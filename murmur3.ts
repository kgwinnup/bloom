/**
 * Murmur3 hashing computes the 32bit murmur3 hashing algorithm
 */

const c1 = 0xcc9e2d51;
const c2 = 0x1b873593;
const r1 = 15;
const r2 = 13;
const m = 5;
const n = 0xe6546b64;

/**
 * hash32 is the main function for computing the murmur3 hash
 * @param key is the bytes to hash as a Uint8Array
 * @param seed for the hash
 * @returns the js number representation of the hash
 */
export function hash32(key: Uint8Array, seed: number = 0): number {
    let hash = seed;
    const len = key.length;
    let k: number;

    for (let i = 0; i + 4 <= len; i += 4) {
        k = (key[i] & 0xff) |
            ((key[+1] & 0xff) << 8) |
            ((key[i + 2] & 0xff) << 16) |
            ((key[i + 3] & 0xff) << 24);

        k = mixK(k);
        hash ^= k;
        hash = mixH(hash);
    }

    k = 0;

    if ((len & 3) === 3) {
        k ^= (key[len - 3] & 0xff) << 16;
    }
    if ((len & 2) === 2) {
        k ^= (key[len - 2] & 0xff) << 8;
    }
    if ((len & 1) === 1) {
        k ^= key[len - 1] & 0xff;
    }

    k = mixK(k);
    hash ^= k;
    hash = finalizeHash(hash, len);

    return hash >>> 0;
}

function mixK(k: number): number {
    k = Math.imul(k, c1);
    k = (k << r1) | (k >>> (32 - r1));
    k = Math.imul(k, c2);
    return k;
}

function mixH(hash: number): number {
    hash ^= n;
    hash = Math.imul(hash, m);
    hash ^= hash >>> r2;
    hash = Math.imul(hash, n);
    return hash;
}

function finalizeHash(hash: number, len: number): number {
    hash ^= len;
    hash ^= hash >>> 16;
    hash = Math.imul(hash, 0x85ebca6b);
    hash ^= hash >>> 13;
    hash = Math.imul(hash, 0xc2b2ae35);
    hash ^= hash >>> 16;
    return hash;
}

