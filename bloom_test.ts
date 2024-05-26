import { Bloom } from "./bloom.ts";
import { bloom_by, bloom_from } from "./bloom-classless.ts";
import { assertEquals } from "jsr:@std/assert@^0.204.0";

Deno.test("should create bloom filter with correct properties", () => {
    const filter = bloom_by(4000, 0.0000001);
    assertEquals(filter.k, 23);
    assertEquals(filter.size, 16775);
});

Deno.test("should insert and lookup in a filter", () => {
    let filter = bloom_by(4000, 0.0000001);
    const input = "hello world";
    const encoder = new TextEncoder();
    const uint8array = encoder.encode(input);
    filter = filter.insert(uint8array);

    assertEquals(filter.lookup(uint8array), true);
});

Deno.test("should only have k non-zero buckets with 1 item inserted", () => {
    const filter = bloom_by(4000, 0.0000001);
    const input = "hello world";
    const encoder = new TextEncoder();
    const uint8array = encoder.encode(input);
    const dump = filter.insert(uint8array).dump().subarray(8 + 8);
    const count = dump.reduce((acc, n) => (n > 0) ? (acc + 1) : acc, 0);

    assertEquals(filter.k, count);
});

Deno.test("should not find random inputs in the filter", () => {
    let filter = bloom_by(4000, 0.0000001);
    const input = "hello world";
    const encoder = new TextEncoder();
    const uint8array = encoder.encode(input);
    filter = filter.batch_insert([ uint8array ]);
    assertEquals(filter.lookup(uint8array), true);

    const input2 = "hello world2";
    const encoder2 = new TextEncoder();
    const uint8array2 = encoder2.encode(input2);
    assertEquals(filter.lookup(uint8array2), false);
});

Deno.test("should insert, dump, read and then look up correctly", () => {
    const filter = new Bloom(4000, 0.0000001);
    const input = "hello world";
    const encoder = new TextEncoder();
    const uint8array = encoder.encode(input);
    filter.insert(uint8array);
    assertEquals(filter.lookup(uint8array), true);

    const filter2 = bloom_from(filter.dump());
    assertEquals(filter2.lookup(uint8array), true);
});
