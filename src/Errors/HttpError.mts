class HttpError extends Error {
    status: number
    statusText: string
    headers: Headers
    content: string

    constructor(response: Response) {
        super(`HTTP error! status: ${response.status} ${response.statusText}`)
        this.status = response.status
        this.statusText = response.statusText
        this.headers = response.headers
        this.content = ''
    }

    public async initContent(response: Response) {
        try {
            const contentType = response.headers.get('Content-Type')
            this.content = contentType?.includes('application/json')
            ? await response.json() as string
            : await response.text()
        } catch {
            this.content = ''
        }
    }
}

export {
    HttpError,
}