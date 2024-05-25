import { hash32 } from "./murmur3.ts";

/**
 * BucketInfo is returned by the buckets function and represents the byte index in the filter and the position within
 * that byte
 */
export type BucketInfo = { index: number; position: number };

/**
 * uint8ArrayToNumber converts a Uint8array to a javascript number
 * @param input array
 * @returns a javascript number
 */
export function uint8ArrayToNumber(input: Uint8Array) {
    return Array.from(input).reduceRight((acc, x) => (acc << 8) + x, 0);
}

/**
 * numberToUint8Array converts a number to a uint8array
 * @param n, the number to be converted
 * @return a Uint8Array representation of the number
 */
export function numberToUint8Array(n: number): Uint8Array {

    const result = Array.from({ length: 8 }).reduce(({ acc, x }) => ({
        acc: acc.concat(x & 0xFF),
        x: x >> 8,
    }), {
        acc: [],
        x: n,
    });

    return Uint8Array.from(result.acc);

}

/**
 * type to allow the Bloom constructor to initialize from a file
 */
type BloomParams = { filter: Uint8Array; k: number; size: number };

export class Bloom {
    public readonly filter: Uint8Array;
    // number of buckets to check for the hash
    readonly k: number;
    // total size in bytes of the bloom filter
    readonly size: number;

    readonly #buckets;

    constructor(n: number, fp: number, bloomParams?: BloomParams) {
        if (bloomParams) {
            this.filter = bloomParams.filter;
            this.k = bloomParams.k;
            this.size = bloomParams.size;
            this.#buckets = gen_buckets(this.k, this.size);
            return;
        }

        const { k, size } = calc(n, fp);

        this.k = k;
        this.size = size;
        this.#buckets = gen_buckets(k, size);
        this.filter = new Uint8Array(size).fill(0);
    }

    /**
     * dump will convert the entire bloom filter to a Uint8Array for storing. This will contain all information in
     * order to re-hydrate this bloom filter using the `from` static function.
     * @returns the byte representation of the bloom filter.
     */
    public dump(): Uint8Array {
        return gen_dump(this);
    }

    /**
     * from will take the output of the `dump` method and create a bloom filter object for use.
     * @param input, raw bytes from `dump` command
     * @param Bloom filter object
     */
    static from(input: Uint8Array): Bloom {
        return new Bloom(0, 0, from_dump(input));
    }

    /**
     * insert will flip all the bits to 1 corresponding to the input hash in the bloom filter.
     * @param input is the raw bytes array of the thing to be placed in the filter
     */
    public insert(input: Uint8Array) {

        for (const { index, position } of this.#buckets(input)) {

            const bit = 1 << position;

            this.filter[index] |= bit;

        }

    }

    /** lookup returns true if the input is in the filter, false otherwise */
    public lookup(input: Uint8Array): boolean {

        return this.#buckets(input).some(({ index, position }) => {

            const bit = 1 << position;

            return (this.filter[index] & bit) !== 0;

        });

    }
}

export function gen_buckets(length: number, size: number) {

    /**
     * buckets hashes k times and populate those buckets that get hit
     * @param input is the thing to be placed into the bloom filter
     * @return an array of which bucket and position the bit is in
     */
    return function(input: Uint8Array): Array<BucketInfo> {

        return Array.from({ length }, (_, i) => {

            const sum = hash32(input, i);
            const newindex = sum % size;

            return {
                index: Math.floor(newindex / 8),
                position: Math.floor(newindex % 8),
            };

        });

    }

}

export function gen_dump(that: { k: number, size: number, filter: Uint8Array }) {
    const k = numberToUint8Array(that.k);
    const size = numberToUint8Array(that.size);

    const buf = new Uint8Array(8 + 8 + that.size).fill(0);
    buf.set(k, 0);
    buf.set(size, 8);
    buf.set(that.filter, 16);

    return buf;
}

export function calc(n: number, fp: number) {

    const m = Math.ceil(n * Math.log(fp)) / Math.log(1.0 / Math.pow(2, Math.log(2)));
    const k = Math.round((m / n) * Math.log(2));
    const size = Math.floor(Math.ceil((m + 8.0) / 8.0));

    return { k, size };

}

export function from_dump(input: Uint8Array) {
    const k = uint8ArrayToNumber(input.subarray(0, 8));
    const size = uint8ArrayToNumber(input.subarray(8, 16));
    const filter = input.subarray(16, size + 16);
    return { filter, k, size };
}

