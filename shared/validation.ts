export function isSafeUrl(value: string) {
    // Attempt to create a new url using the passed value, and then return a bool indicating whether or not it matches a proper url protocol.
    try {
        const url = new URL(value);
        return url.protocol === 'https:' || url.protocol === 'http:';
    } catch {
        return false;
    }
}