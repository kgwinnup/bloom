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

            return gen_bloom({ k, size, raw: fold(merge, filter, inputs) });

        },

        dump () {
            return mk_dump({ k, size }, filter);
        },

    };

}





function lift (buckets: (_: Uint8Array) => ReadonlyArray<BucketInfo>) {

    return function (filter: Uint8Array, input: Uint8Array)  {

        return buckets(input).reduce((acc, { index, position }) => {

            const bit = 1 << position;
            const value = at(acc, index) | bit;

            return update(acc, { index, value });

        }, filter);

    };

}





function at (buf: Uint8Array, index: number) {

    return buf.at?.(index) ?? buf[index];

}





function update (buf: Uint8Array, { index, value }: {

        index: number,
        value: number,

}) {

    if (typeof buf.with === 'function') {
        return buf.with(index, value);
    }

    const clone = typeof structuredClone === 'function'
        ? structuredClone(buf, { transfer: [ buf.buffer ] })
        : Uint8Array.from(buf)
    ;

    clone[index] = value;

    return clone;

}





function fold <A, B, C> (

        f: (acc: A, x: B) => C,
        x: A,
        xs: Iterable<B>,

): C {

    // @ts-ignore https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator/reduce
    return xs.reduce?.(f, x) ?? Array.from(xs).reduce(f, x);

}

