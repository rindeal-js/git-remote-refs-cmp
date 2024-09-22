import {
    PriorityQueue,
} from './PriorityQueue.mjs'
import {
    CircuitBreaker,
    CircuitBreakerInit,
 } from './CircuitBreaker.mjs'
import {
    Hostname,
    Milliseconds,
    Count,
} from './Types.mjs'


enum Priority {
    LOW,
    MEDIUM,
    HIGH,
}

class HttpError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'HttpError'
    }
}

class NetworkError extends HttpError {}
class HttpResponseError extends HttpError {
    constructor(public readonly status: number, message: string) {
        super(message)
    }
}
class CircuitOpenError extends HttpError {}
class RetryExhaustedError extends HttpError {}

type QueueItem = {
    execute: () => Promise<Response>,
    priority: Priority,
    resolve: (value: Response | PromiseLike<Response>) => void,
    reject: (reason?: Error) => void,
}

type RetryOptions = {
    maxRetries: Count,
    initialDelay: Milliseconds,
    maxDelay: Milliseconds,
    factor: number,
    jitter: Milliseconds,
    retryStrategy?: (error: Error, attemptCount: number) => boolean,
}

type HostnameData = {
    active: Count,
    queue: PriorityQueue<QueueItem>,
    circuitBreaker: CircuitBreaker,
}

interface AdvancedHttpFetcherOptions {
    retry?: Partial<RetryOptions>,
    circuitBreaker?: CircuitBreakerInit,
    maxConcurrentRequests?: Count,
    priority?: Priority,
}

interface PerHostHttpFetcherOptions extends AdvancedHttpFetcherOptions {
    globalLimit?: Count,
}

interface HttpFetcher {
    fetch(reqInfo: RequestInfo, options?: RequestInit, advancedOptions?: AdvancedHttpFetcherOptions): Promise<Response>
}

class RetryUtility {
    private static readonly DEFAULT_OPTIONS: RetryOptions = {
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 10000,
        factor: 2,
        jitter: 100,
    }

    static async retryWithBackoff(
        executeRequest: () => Promise<Response>,
        options: Partial<RetryOptions> = {}
    ): Promise<Response> {
        const retryOptions = { ...RetryUtility.DEFAULT_OPTIONS, ...options }
        let lastError: Error | undefined = undefined

        for ( let attempt = 0; attempt <= retryOptions.maxRetries; attempt++ ) {
            try {
                return await executeRequest()
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error))

                if (
                    attempt === retryOptions.maxRetries ||
                    (retryOptions.retryStrategy && !retryOptions.retryStrategy(lastError, attempt))
                ) {
                    throw new RetryExhaustedError(`Retry attempts exhausted: ${lastError.message}`)
                }

                const delay = Math.min(
                    retryOptions.initialDelay * Math.pow(retryOptions.factor, attempt) + Math.random() * retryOptions.jitter,
                    retryOptions.maxDelay
                )
                await new Promise(resolve => setTimeout(resolve, delay))
            }
        }
        throw lastError
    }
}

class BasicHttpFetcher implements HttpFetcher {
    async fetch(reqInfo: RequestInfo, options: RequestInit = {}): Promise<Response> {
        let response: Response
        try {
            response = await fetch(reqInfo, options)
        } catch (error) {
            throw new NetworkError(`Network error: ${error instanceof Error ? error.message : String(error)}`)
        }
        if ( ! response.ok ) {
            throw new HttpResponseError(response.status, `HTTP error! status: ${response.status}`)
        }
        return response
    }
}

class AdvancedHttpFetcher implements HttpFetcher {
    private static readonly DEFAULT_MAX_CONCURRENT_REQUESTS: Count = Infinity
    private static readonly DEFAULT_PRIORITY = Priority.MEDIUM

    private readonly circuitBreaker: CircuitBreaker
    private readonly requestQueue: PriorityQueue<QueueItem>
    private _maxConcurrentRequests: Count
    private activeRequests: Count = 0

    constructor(private readonly advancedOptions: AdvancedHttpFetcherOptions = {}) {
        this.circuitBreaker = new CircuitBreaker(advancedOptions.circuitBreaker)
        this._maxConcurrentRequests = advancedOptions.maxConcurrentRequests ?? AdvancedHttpFetcher.DEFAULT_MAX_CONCURRENT_REQUESTS
        this.requestQueue = new PriorityQueue<QueueItem>((a, b) => !!( a.priority - b.priority ))
    }

    get maxConcurrentRequests(): Count {
        return this._maxConcurrentRequests
    }

    set maxConcurrentRequests(value: Count) {
        this._maxConcurrentRequests = value
        this.processQueue()
    }

    async fetch(reqInfo: RequestInfo, options: RequestInit = {}, advancedOptions: AdvancedHttpFetcherOptions = {}): Promise<Response> {
        if ( this.circuitBreaker.isOpen() ) {
            throw new CircuitOpenError('Circuit is open')
        }

        const priority = advancedOptions.priority ?? this.advancedOptions.priority ?? AdvancedHttpFetcher.DEFAULT_PRIORITY

        const executeRequest = async (): Promise<Response> => {
            if ( this.activeRequests >= this._maxConcurrentRequests ) {
                return new Promise<Response>((resolve, reject) => {
                    this.requestQueue.push({
                        execute: () => this.executeFetch(reqInfo, options),
                        priority,
                        resolve,
                        reject,
                    })
                })
            }

            return this.executeFetch(reqInfo, options)
        }

        return RetryUtility.retryWithBackoff(executeRequest, advancedOptions.retry ?? this.advancedOptions.retry)
    }

    private async executeFetch(reqInfo: RequestInfo, options: RequestInit): Promise<Response> {
        this.activeRequests++
        try {
            const response = await fetch(reqInfo, options)
            if ( !response.ok ) {
                throw new HttpResponseError(response.status, `HTTP error! status: ${response.status}`)
            }
            this.circuitBreaker.onSuccess()
            return response
        } catch (error) {
            if ( error instanceof HttpResponseError ) {
                this.circuitBreaker.onFailure()
            }
            throw error
        } finally {
            this.activeRequests--
            this.processQueue()
        }
    }

    private processQueue(): void {
        while ( this.activeRequests < this._maxConcurrentRequests && !this.requestQueue.isEmpty() ) {
            const queueItem = this.requestQueue.pop()
            if ( queueItem ) {
                queueItem.execute().then(queueItem.resolve).catch(queueItem.reject)
            }
        }
    }
}

class PerHostHttpFetcher extends AdvancedHttpFetcher {
    private static readonly DEFAULT_GLOBAL_LIMIT: Count = Infinity

    private readonly hosts: Map<Hostname, HostnameData> = new Map()
    private _globalLimit: Count

    constructor(options: PerHostHttpFetcherOptions = {}) {
        super(options)
        this._globalLimit = options.globalLimit ?? PerHostHttpFetcher.DEFAULT_GLOBAL_LIMIT
    }

    get globalLimit(): Count {
        return this._globalLimit
    }

    set globalLimit(value: Count) {
        this._globalLimit = value
        for ( const data of this.hosts.values() ) {
            this.processHostnameQueue(data)
        }
    }

    async fetch(reqInfo: RequestInfo, options: RequestInit = {}, advancedOptions: PerHostHttpFetcherOptions = {}): Promise<Response> {
        const url = new URL(reqInfo.toString())
        const hostname = url.hostname as Hostname

        const data = this.initHostnameData(hostname, advancedOptions.circuitBreaker)

        return this.fetchWithHostnameLimit(data, () => super.fetch(reqInfo, options, advancedOptions), advancedOptions.priority)
    }

    private initHostnameData(hostname: Hostname, circuitBreakerOptions?: CircuitBreakerInit): HostnameData {
        let data = this.hosts.get(hostname)
        if ( ! data ) {
            data = {
                active: 0,
                queue: new PriorityQueue<QueueItem>((a, b) => !!( a.priority - b.priority )),
                circuitBreaker: new CircuitBreaker(circuitBreakerOptions),
            }
            this.hosts.set(hostname, data)
        }
        return data
    }

    private async fetchWithHostnameLimit(
        data: HostnameData,
        request: () => Promise<Response>,
        priority: Priority = Priority.MEDIUM
    ): Promise<Response> {
        if ( data.circuitBreaker.isOpen() ) {
            throw new CircuitOpenError('Circuit is open for this hostname')
        }

        if ( data.active >= this._globalLimit ) {
            return new Promise<Response>((resolve, reject) => {
                data.queue.push({
                    execute: request,
                    priority,
                    resolve,
                    reject,
                })
            })
        }

        data.active++
        try {
            const response = await request()
            data.circuitBreaker.onSuccess()
            return response
        } catch (error) {
            if ( error instanceof HttpResponseError ) {
                data.circuitBreaker.onFailure()
            }
            throw error
        } finally {
            data.active--
            this.processHostnameQueue(data)
        }
    }

    private processHostnameQueue(data: HostnameData): void {
        while ( data.active < this._globalLimit && !data.queue.isEmpty() ) {
            const queueItem = data.queue.pop()
            if ( queueItem ) {
                this.fetchWithHostnameLimit(data, queueItem.execute, queueItem.priority)
                    .then(queueItem.resolve)
                    .catch(queueItem.reject)
            }
        }
    }
}


export {
    HttpFetcher,
    BasicHttpFetcher,
    AdvancedHttpFetcher,
    PerHostHttpFetcher,
    AdvancedHttpFetcherOptions,
    PerHostHttpFetcherOptions,
    RetryOptions,
    HostnameData,
    Priority,
    HttpError,
    NetworkError,
    HttpResponseError,
    CircuitOpenError,
    RetryExhaustedError,
}