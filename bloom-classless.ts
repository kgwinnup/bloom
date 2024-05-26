import {
    calc,
    from_dump,
    gen_buckets,
    gen_dump,
    type BucketInfo,
} from "./bloom.ts";





export interface BloomClassless {

    readonly k: number;

    readonly size: number;

    lookup (input: Uint8Array): boolean;

    insert (input: Uint8Array): BloomClassless;

    batch_insert (inputs: Iterable<Uint8Array>): BloomClassless;

    async_batch_insert (input: AsyncIterable<Uint8Array>): Promise<BloomClassless>;

    dump (): Uint8Array;

}





export function bloom_by (n: number, fp: number): BloomClassless {

    return gen_bloom(calc(n, fp));

}





export function bloom_from (dump: Uint8Array): BloomClassless {

    return gen_bloom(from_dump(dump));

}





function gen_bloom ({ k, size, filter }: {

        k: number,
        size: number,
        filter?: Uint8Array,

}): BloomClassless {

    const store = filter ?? new Uint8Array(size).fill(0);

    const buckets = gen_buckets(k, size);
    const append = lift(buckets);

    return {

        k,

        size,

        lookup (input) {

            return some(function ({ index, position }) {

                const bit = 1 << position;
                const value = at(store, index) & bit;

                return value !== 0;

            }, buckets(input));

        },

        insert (input) {
            return gen_bloom({ k, size, filter: append(store, input) });
        },

        batch_insert (inputs) {
            return gen_bloom({ k, size, filter: fold(append, store, inputs) });
        },

        async async_batch_insert (input) {
            return gen_bloom({ k, size, filter: await async_fold(append, store, input) });
        },

        dump () {
            return gen_dump({ k, size, filter: store });
        },

    };

}





function lift (buckets: (_: Uint8Array) => Iterable<BucketInfo>) {

    return function (filter: Uint8Array, input: Uint8Array)  {

        return fold(function (acc, { index, position }) {

            const bit = 1 << position;
            const value = at(acc, index) | bit;

            return update(acc, { index, value });

        }, filter, buckets(input));

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





function some <T> (

        f: (x: T) => boolean,
        xs: Iterable<T>,

): boolean {

    // @ts-ignore https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator/some
    return xs.some?.(f) ?? Array.from(xs).some(f);

}





function fold <A, B, C> (

        f: (acc: A, x: B) => C,
        x: A,
        xs: Iterable<B>,

): C {

    // @ts-ignore https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator/reduce
    return xs.reduce?.(f, x) ?? Array.from(xs).reduce(f, x);

}





async function async_fold <A, B> (

        f: (acc: A, x: B) => A,
        x: A,
        xs: AsyncIterable<B>,

): Promise<A> {

    let result = x;

    for await (const item of xs) {
        result = f(result, item);
    }

    return result;

}

