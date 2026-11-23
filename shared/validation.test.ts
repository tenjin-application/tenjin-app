// Don't worry about the errors in shared. It isn't actually wrong, shared is just in limbo, so TS freaks out over it.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { isSafeUrl } from './validation.ts';

// Expect true as a valid url is provided.
test('Accepts a normal https link.', () => {
    assert.equal(isSafeUrl('https://discord.gg/somelinkthingyidk'), true);
});

// Expects false as a javascript link is not a valid link.
test('Rejects JavaScript: links.', () => {
    assert.equal(isSafeUrl('javascript:alert(1)'), false);
});

// Expects false as any text that is not a link... is not a link.
test('Rejects any text that is not a link.', () => {
    assert.equal(isSafeUrl('This is not a valid url.'), false);
});

// Expects false as empty text is not a valid link.
test('Rejects an empty string.', () => {
    assert.equal(isSafeUrl(''), false);
});