// Helpers for calling the Express API. Every failed request throws an ApiError with its status code.
// TODO: Enforce with TypeScript later one (type generics).

// The ApiError class, extends Error.
export class ApiError extends Error {
    status: number
    constructor(status: number, message: string) {
        super(message)
        this.status = status
    }
}

async function request(method: string, path: string, body?: unknown) {
    // Fetches the response.
    const res = await fetch('/api' + path, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
    })
    const data = await res.json();

    // If our response is faulty, throws a new error.
    if (!res.ok) {
        throw new ApiError(res.status, data?.error ?? 'Something went wrong');
    }
    return data;
}

// Defines two functions for GET and POST, uses request as a blueprint.
export const get = (path: string) => request('GET', path)
export const post = (path: string, body?: unknown) => request('POST', path, body)