enum FetchErrorCode {
  Network = 'ERR_NETWORK',
  Timeout = 'ERR_TIMEOUT',
  Cancel = 'ERR_CANCEL',
  Unknown = 'ERR_UNKNOWN',
  BadRequest = 'ERR_BAD_REQUEST',
  BadResponse = 'ERR_BAD_RESPONSE',
  NotSupport = 'ERR_NOT_SUPPORT',
  InvalidUrl = 'ERR_INVALID_URL'
}

interface FetchErrorOptions extends ErrorOptions {
  request: Request
  code: FetchErrorCode
  response?: Response
  cause?: Error
}

class FetchError extends Error {
  readonly request: Request
  readonly code: FetchErrorCode
  readonly response?: Response
  readonly cause?: Error

  constructor(
    message: string,
    options: FetchErrorOptions
  ) {
    super(message, options)
    this.name = 'FetchError'
    this.request = options.request
    this.code = options.code
    this.response = options.response
    this.cause = options.cause

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FetchError)
    }

    Object.defineProperty(this, 'name', { enumerable: false })
  }

  toString() {
    return `${this.name}(${this.code}): ${this.message} (code: ${this.code})`
  }

  toJSON() {
    return {
      message: this.message,
      name: this.name,
      code: this.code,
      request: this.serializeRequest(this.request),
      response: this.response ? this.serializeResponse(this.response) : undefined,
      cause: this.cause ? this.cause.message : undefined,
    }
  }

  private serializeRequest(request: Request): Record<string, unknown> {
    return {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers),
      mode: request.mode,
      credentials: request.credentials,
      cache: request.cache,
      redirect: request.redirect,
      referrer: request.referrer,
      referrerPolicy: request.referrerPolicy,
      integrity: request.integrity,
      keepalive: request.keepalive,
    }
  }

  private serializeResponse(response: Response): Record<string, unknown> {
    return {
      url: response.url,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers),
      type: response.type,
      redirected: response.redirected,
    }
  }

  static from(error: unknown, options: FetchErrorOptions): FetchError {
    if (error instanceof FetchError) {
      return error
    }

    let message: string
    let cause: Error | undefined

    if (error instanceof Error) {
      message = error.message
      cause = error
    } else if (typeof error === 'string') {
      message = error
    } else {
      message = JSON.stringify(error)
    }

    return new FetchError(message, { ...options, cause })
  }
}

export {
  FetchError,
  FetchErrorCode,
}
