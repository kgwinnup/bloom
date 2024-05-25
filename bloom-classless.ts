import {
    calc,
    from_dump,
    gen_buckets,
    mk_dump,
    type BucketInfo,
} from "./bloom.ts";





interface BloomClassless {

    readonly k: number;

    readonly size: number;

    lookup (input: Uint8Array): boolean;

    insert (input: Uint8Array): BloomClassless;

    batch_insert (inputs: Iterable<Uint8Array>): BloomClassless;

    dump (): Uint8Array;

}





export function bloom_by (n: number, fp: number): BloomClassless {

    const { k, size } = calc(n, fp);

    return gen_bloom({ k, size });

}





export function bloom_from (dump: Uint8Array): BloomClassless {

    const { k, size, filter: raw } = from_dump(dump);

    return gen_bloom({ k, size, raw });

}





function gen_bloom ({ k, size, raw }: {

        k: number,
        size: number,
        raw?: Uint8Array,

}): BloomClassless {

    const filter = raw ?? new Uint8Array(size).fill(0);

    const buckets = gen_buckets(k, size);
    const merge = lift(buckets);

    return {

        k,

        size,

        lookup (input) {

            return buckets(input).some(({ index, position }) => {

                const bit = 1 << position;
                const value = at(filter, index) & bit;

                return value !== 0;

            });

        },

        insert (input) {

            return gen_bloom({ k, size, raw: merge(filter, input) });

        },

        batch_insert (inputs) {

            // @ts-ignore https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator/reduce
            const raw =       inputs .reduce?.(merge, filter)
                ?? Array.from(inputs).reduce  (merge, filter)
            ;

            return gen_bloom({ k, size, raw });

        },

        dump () {
            return mk_dump({ k, size }, filter);
        },

    };

}





function at (buf: Uint8Array, index: number) {

    return buf.at?.(index) ?? buf[index];

}





function lift (buckets: (_: Uint8Array) => ReadonlyArray<BucketInfo>) {

    return function (filter: Uint8Array, input: Uint8Array)  {

        return buckets(input).reduce((acc, { index, position }) => {

            const bit = 1 << position;
            const value = at(acc, index) | bit;

            if (typeof acc.with === 'function') {
                return acc.with(index, value);
            }

            const clone = typeof structuredClone === 'function'
                ? structuredClone(acc, { transfer: [ acc.buffer ] })
                : Uint8Array.from(acc)
            ;

            clone[index] = value;

            return clone;

        }, filter);

    };

}

