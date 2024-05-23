/**
 * Murmur3 hashing computes the 32bit murmur3 hashing algorithm
 */
export class Murmur3 {
    private static readonly c1: number = 0xcc9e2d51;
    private static readonly c2: number = 0x1b873593;
    private static readonly r1: number = 15;
    private static readonly r2: number = 13;
    private static readonly m: number = 5;
    private static readonly n: number = 0xe6546b64;

    /**
     * hash32 is the main function for computing the murmur3 hash
     * @param key is the bytes to hash as a Uint8Array
     * @param seed for the hash
     * @returns the js number representation of the hash
     */
    static hash32(key: Uint8Array, seed: number = 0): number {
        let hash = seed;
        const len = key.length;
        let k: number;

        for (let i = 0; i + 4 <= len; i += 4) {
            k = (key[i] & 0xff) |
                ((key[+1] & 0xff) << 8) |
                ((key[i + 2] & 0xff) << 16) |
                ((key[i + 3] & 0xff) << 24);

            k = Murmur3.mixK(k);
            hash ^= k;
            hash = Murmur3.mixH(hash);
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

        k = Murmur3.mixK(k);
        hash ^= k;
        hash = Murmur3.finalizeHash(hash, len);

        return hash >>> 0;
    }

    private static mixK(k: number): number {
        k = Math.imul(k, Murmur3.c1);
        k = (k << Murmur3.r1) | (k >>> (32 - Murmur3.r1));
        k = Math.imul(k, Murmur3.c2);
        return k;
    }

    private static mixH(hash: number): number {
        hash ^= Murmur3.n;
        hash = Math.imul(hash, Murmur3.m);
        hash ^= hash >>> Murmur3.r2;
        hash = Math.imul(hash, Murmur3.n);
        return hash;
    }

    private static finalizeHash(hash: number, len: number): number {
        hash ^= len;
        hash ^= hash >>> 16;
        hash = Math.imul(hash, 0x85ebca6b);
        hash ^= hash >>> 13;
        hash = Math.imul(hash, 0xc2b2ae35);
        hash ^= hash >>> 16;
        return hash;
    }
}

