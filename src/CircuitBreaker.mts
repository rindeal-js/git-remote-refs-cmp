import {
    Count,
    Milliseconds,
    UnixTimeMs,
} from './Types.mjs'


enum CircuitState {
    CLOSED,
    OPEN,
    HALF_OPEN,
}

type CircuitBreakerInit = {
    window?: Milliseconds
    threshold?: Count
    cooldown?: Milliseconds
}

class CircuitBreaker {
    private state: CircuitState
    private failureTimes: UnixTimeMs[]
    private lastStateChange: UnixTimeMs
    private window: Milliseconds
    private threshold: Count
    private cooldown: Milliseconds

    constructor(options: CircuitBreakerInit = {}) {
        this.state = CircuitState.CLOSED
        this.failureTimes = []
        this.lastStateChange = Date.now()
        this.window = options.window ?? 10000 as Milliseconds
        this.threshold = options.threshold ?? 5 as Count
        this.cooldown = options.cooldown ?? 10000 as Milliseconds
    }

    public isOpen(): boolean {
        if (this.state === CircuitState.OPEN) {
            const cooldownPassed = Date.now() - this.lastStateChange > this.cooldown
            if (cooldownPassed) {
                this.state = CircuitState.HALF_OPEN
                this.lastStateChange = Date.now()
                return false
            }
            return true
        }
        return false
    }

    public onSuccess(): void {
        if (this.state === CircuitState.HALF_OPEN) {
            this.state = CircuitState.CLOSED
            this.failureTimes = []
            this.lastStateChange = Date.now()
        }
    }

    public onFailure(): void {
        const now = Date.now()
        this.failureTimes.push(now)
        this.failureTimes = this.failureTimes.filter(time => now - time <= this.window)

        if (this.failureTimes.length >= this.threshold) {
            this.state = CircuitState.OPEN
            this.lastStateChange = now
        }
    }

    public getState(): CircuitState {
        return this.state
    }
}


export {
    CircuitBreaker,
    CircuitBreakerInit,
    CircuitState,
}