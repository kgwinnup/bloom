import { Murmur3 } from "./murmur3.ts";

/**
 * BucketInfo is returned by the buckets function and represents the byte index in the filter and the position within
 * that byte
 */
type BucketInfo = { index: number; position: number };

/**
 * uint8ArrayToNumber converts a Uint8array to a javascript number
 * @param input array
 * @returns a javascript number
 */
function uint8ArrayToNumber(input: Uint8Array) {
    let num = 0;
    for (let i = 0; i < 8; i++) {
        num += Math.pow(256, i) * input[i];
    }
    return num;
}

/**
 * type to allow the Bloom constructor to initialize from a file
 */
type BloomParams = { filter: Uint8Array; k: number; size: number };

export class Bloom {
    filter: Uint8Array = new Uint8Array(0);
    // number of buckets to check for the hash
    k: number = 0;
    // total size in bytes of the bloom filter
    size: number = 0;

    constructor(n: number, fp: number, bloomParams?: BloomParams) {
        if (bloomParams) {
            this.filter = bloomParams.filter;
            this.k = bloomParams.k;
            this.size = bloomParams.size;
            return;
        }

        const m = Math.ceil(n * Math.log(fp)) / Math.log(1.0 / Math.pow(2, Math.log(2)));
        const k = Math.round((m / n) * Math.log(2));
        const size = Math.floor(Math.ceil((m + 8.0) / 8.0));

        this.filter = new Uint8Array(size).fill(0);
        this.k = Math.floor(k);
        this.size = size;
    }

    /**
     * dump will conver the entire bloom filter to a Uint8Array for storing. This will contain all information in
     * order to re-hydrate this bloom filter using the `from` static function.
     * @returns the byte representation of the bloom filter.
     */
    public dump(): Uint8Array {
        const k = this.numberToUint8Array(this.k);
        const size = this.numberToUint8Array(this.size);

        const buf = new Uint8Array(8 + 8 + this.size).fill(0);
        buf.set(k, 0);
        buf.set(size, 8);
        buf.set(this.filter, 16);

        return buf;
    }

    /**
     * from will take the output of the `dump` method and create a bloom filter object for use.
     * @param input, raw bytes from `dump` command
     * @param Bloom filter object
     */
    static from(input: Uint8Array): Bloom {
        const k = uint8ArrayToNumber(input.subarray(0, 8));
        const size = uint8ArrayToNumber(input.subarray(8, 16));
        const filter = input.subarray(16, size + 16);
        return new Bloom(0, 0, { filter: filter, k: k, size: size });
    }

    /**
     * numberToUint8Array converts a number to a uint8array
     * @param n, the number to be converted
     * @return a Uint8Array representation of the number
     */
    private numberToUint8Array(n: number): Uint8Array {
        const out = new Uint8Array(8);
        for (let i = 0; i < 8; i++) {
            out[i] = n % 256;
            n = Math.floor(n / 256);
        }
        return out;
    }

    /**
     * buckets hashes k times and popuate those buckets that get hit
     * @param input is the thing to be placed into the bloom filter
     * @return an array of which bucket and position the bit is in
     */
    private buckets(input: Uint8Array): Array<BucketInfo> {
        const out = [];

        for (let i = 0; i < this.k; i++) {
            const sum = Murmur3.hash32(input, i);
            const newindex = sum % this.size;
            out.push({ index: Math.floor(newindex / 8), position: Math.floor(newindex % 8) });
        }

        return out;
    }

    /**
     * insert will flip all the bits to 1 corresponding to the input hash in the bloom filter.
     * @param input is the raw bytes array of the thing to be placed in the filter
     */
    public insert(input: Uint8Array) {
        const buckets = this.buckets(input);
        for (let i = 0; i < buckets.length; i++) {
            const bit = 1 << buckets[i].position;
            this.filter[buckets[i].index] |= bit;
        }
    }

    /** lookup returns true if the input is in the filter, false otherwise */
    public lookup(input: Uint8Array): boolean {
        const buckets = this.buckets(input);
        for (let i = 0; i < buckets.length; i++) {
            const bit = 1 << buckets[i].position;
            if ((this.filter[buckets[i].index] & bit) == 0) {
                return false;
            }
        }
        return true;
    }
}
