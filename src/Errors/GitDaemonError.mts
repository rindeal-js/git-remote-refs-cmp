class GitDaemonError extends Error {
    constructor(message: string, options?: ErrorOptions) {
        super(message, options)
        this.name = 'GitDaemonError'
        Object.setPrototypeOf(this, GitDaemonError.prototype)
    }

    toString() {
        return `${this.name}: ${this.message}`
    }
}


export {
    GitDaemonError
}