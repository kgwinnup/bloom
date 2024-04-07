import { Bloom } from "./bloom.ts";
import { assertEquals } from "https://deno.land/std@0.204.0/assert/mod.ts";

Deno.test("should create bloom filter with correct properties", () => {
    const filter = new Bloom(4000, 0.0000001);
    assertEquals(filter.k, 23);
    assertEquals(filter.size, 16775);
});

Deno.test("should insert and lookup in a filter", () => {
    const filter = new Bloom(4000, 0.0000001);
    const input = "hello world";
    const encoder = new TextEncoder();
    const uint8array = encoder.encode(input);
    filter.insert(uint8array);

    assertEquals(filter.lookup(uint8array), true);
});

Deno.test("should not find random inputs in the filter", () => {
    const filter = new Bloom(4000, 0.0000001);
    const input = "hello world";
    const encoder = new TextEncoder();
    const uint8array = encoder.encode(input);
    filter.insert(uint8array);
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

    const bytes = filter.dump();

    const filter2 = Bloom.from(bytes);
    assertEquals(filter2.lookup(uint8array), true);
});
