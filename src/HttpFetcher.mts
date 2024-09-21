import {
    CircuitBreaker,
} from './CircuitBreaker.mjs'
import {
    Count,
    Hostname,
    Milliseconds,
} from './Types.mjs'
import {
    PriorityQueue,
} from './PriorityQueue.mjs'

abstract class HttpFetcher {
    public abstract fetch(input: RequestInfo, init?: RequestInit): Promise<Response>
}

class BasicHttpFetcher implements HttpFetcher {
    public fetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
        return fetch(input, init)
    }
}

enum Priority {
    LOW,
    MEDIUM,
    HIGH,
}

type QueueItem = {
    req: Request,
    priority: Priority,
    resolve: (value: Response | PromiseLike<Response>) => void,
    reject: (reason?: Error | unknown) => void,
    retryOptions?: RetryOptions,
}

type RetryOptions = {
    maxRetries: number,
    initialDelay: number,
    maxDelay: number,
    factor: number,
    jitter: boolean,
}

type HostnameData = {
    queue: PriorityQueue<QueueItem>,
    active: number,
    circuitBreaker: CircuitBreaker,
    limit: Count,
}

abstract class BaseHttpFetcher extends BasicHttpFetcher {
    protected batchSize: Count
    protected batchTimeout: Milliseconds

    constructor(options: {
        batchSize?: Count,
        batchTimeout?: Milliseconds,
    }) {
        super()
        this.batchSize = options.batchSize ?? 5 as Count
        this.batchTimeout = options.batchTimeout ?? 50 as Milliseconds
    }

    protected abstract getBatch(): QueueItem[]
    protected abstract processBatch(batch: QueueItem[]): Promise<void>
    protected abstract isCircuitOpen(hostname?: Hostname): boolean
    protected abstract onCircuitSuccess(hostname?: Hostname): void
    protected abstract onCircuitFailure(hostname?: Hostname): void

    protected createReq(reqInfo: RequestInfo, options: RequestInit): Request {
        return reqInfo instanceof Request ? reqInfo : new Request(reqInfo, options)
    }

    protected async processQueue(): Promise<void> {
        if ( this.isProcessing() ) return
        this.setProcessing(true)

        try {
            while ( this.hasQueuedItems() ) {
                const batch = this.getBatch()

                if ( batch.length === 0 ) {
                    await new Promise(resolve => setTimeout(resolve, this.batchTimeout))
                    continue
                }

                await this.processBatch(batch)
            }
        } finally {
            this.setProcessing(false)

            if ( this.hasQueuedItems() ) {
                setTimeout(() => this.processQueue(), 0)
            }
        }
    }

    protected async processQueueItem(item: QueueItem): Promise<void> {
        const { req, resolve, reject, retryOptions } = item
        let attempts = 0

        const attemptFetch = async (): Promise<Response> => {
            try {
                const response = await fetch(req)
                this.onCircuitSuccess(new URL(req.url).hostname)
                return response
            } catch (error) {
                this.onCircuitFailure(new URL(req.url).hostname)
                throw error
            }
        }

        if ( retryOptions ) {
            while ( attempts < retryOptions.maxRetries ) {
                try {
                    const response = await attemptFetch()
                    resolve(response)
                    return
                } catch (error) {
                    attempts++
                    if ( attempts >= retryOptions.maxRetries ) {
                        reject(error)
                        return
                    }
                    await this.delay(this.calculateDelay(attempts, retryOptions))
                }
            }
        } else {
            try {
                const response = await attemptFetch()
                resolve(response)
            } catch (error) {
                reject(error)
            }
        }
    }

    protected calculateDelay(attempt: number, options: RetryOptions): number {
        const delay = Math.min(
            options.initialDelay * Math.pow(options.factor, attempt - 1),
            options.maxDelay
        )
        if ( options.jitter ) {
            return delay * (0.5 + Math.random())
        }
        return delay
    }

    protected delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    protected abstract isProcessing(): boolean
    protected abstract setProcessing(value: boolean): void
    protected abstract hasQueuedItems(): boolean
}

class HostnameLimitingHttpFetcher extends BaseHttpFetcher {
    private hostnameData: Map<Hostname, HostnameData>
    private defaultLimit: Count
    private processing: boolean

    constructor(options: {
        defaultLimit?: Count,
        batchSize?: Count,
        batchTimeout?: Milliseconds,
    }) {
        super(options)
        this.defaultLimit = options.defaultLimit ?? 4 as Count
        this.hostnameData = new Map()
        this.processing = false
    }

    async fetch(reqInfo: RequestInfo, options: RequestInit & { priority?: Priority, retry?: RetryOptions } = {}): Promise<Response> {
        const req = this.createReq(reqInfo, options)
        const { hostname } = new URL(req.url)
        const priority = options.priority ?? Priority.MEDIUM
        const retryOptions = options.retry

        this.initializeHostnameIfNeeded(hostname)

        if ( this.isCircuitOpen(hostname) ) {
            throw new Error(`Circuit is open for ${hostname}`)
        }

        return new Promise((resolve, reject) => {
            this.hostnameData.get(hostname)!.queue.push({ req, priority, resolve, reject, retryOptions })
            this.processQueue().catch(error => {
                console.error(`Error processing queue for ${hostname}:`, error)
            })
        })
    }

    private initializeHostnameIfNeeded(hostname: Hostname): void {
        if ( !this.hostnameData.has(hostname) ) {
            this.hostnameData.set(hostname, {
                queue: new PriorityQueue<QueueItem>((a, b) => !!(b.priority - a.priority)),
                active: 0,
                circuitBreaker: new CircuitBreaker(),
                limit: this.defaultLimit,
            })
        }
    }

    protected getBatch(): QueueItem[] {
        const batch: QueueItem[] = []
        
        for ( const data of this.hostnameData.values() ) {
            const availableSlots = data.limit - data.active

            while ( batch.length < Math.min(this.batchSize, availableSlots) && ! data.queue.isEmpty() ) {
                const item = data.queue.pop()
                if ( item ) {
                    batch.push(item)
                    data.active++
                }
            }

            if ( batch.length >= this.batchSize ) break
        }

        return batch
    }

    protected async processBatch(batch: QueueItem[]): Promise<void> {
        try {
            const promises = batch.map(item => this.processQueueItem(item))
            await Promise.all(promises)
        } finally {
            for ( const item of batch ) {
                const { hostname } = new URL(item.req.url)
                const data = this.hostnameData.get(hostname)
                if ( data ) data.active--
            }
        }
    }

    protected isCircuitOpen(hostname: Hostname): boolean {
        return this.hostnameData.get(hostname)?.circuitBreaker.isOpen() ?? false
    }

    protected onCircuitSuccess(hostname: Hostname): void {
        this.hostnameData.get(hostname)?.circuitBreaker.onSuccess()
    }

    protected onCircuitFailure(hostname: Hostname): void {
        this.hostnameData.get(hostname)?.circuitBreaker.onFailure()
    }

    protected isProcessing(): boolean {
        return this.processing
    }

    protected setProcessing(value: boolean): void {
        this.processing = value
    }

    protected hasQueuedItems(): boolean {
        for ( const data of this.hostnameData.values() ) {
            if ( !data.queue.isEmpty() ) return true
        }
        return false
    }

    // Public API methods
    public setLimit(hostname: Hostname, limit: number): void {
        const data = this.hostnameData.get(hostname)
        if ( data ) data.limit = limit as Count
    }

    public getLimit(hostname: Hostname): number {
        return this.hostnameData.get(hostname)?.limit ?? this.defaultLimit
    }

    public getQueueLength(): number {
        let total = 0
        for ( const data of this.hostnameData.values() ) {
            total += data.queue.size()
        }
        return total
    }

    public getQueueLengthForHost(hostname: Hostname): number {
        return this.hostnameData.get(hostname)?.queue.size() ?? 0
    }

    public getActiveCount(): number {
        let total = 0
        for ( const data of this.hostnameData.values() ) {
            total += data.active
        }
        return total
    }

    public getActiveCountForHost(hostname: Hostname): number {
        return this.hostnameData.get(hostname)?.active ?? 0
    }

    public getTotalHostnames(): number {
        return this.hostnameData.size
    }

    public getCircuitBreakerStatus(hostname: Hostname): CircuitBreaker | undefined {
        return this.hostnameData.get(hostname)?.circuitBreaker
    }
}

export {
    HttpFetcher,
    BasicHttpFetcher,
    HostnameLimitingHttpFetcher,
}
