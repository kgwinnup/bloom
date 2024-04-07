# Bloom filter

[![JSR](https://jsr.io/badges/@kgwinnup/tlsh)](https://jsr.io/@kgwinnup/tlsh)

This is a standard bloom filter written in pure typescript. 

# Usage

```typescript
const filter = new Bloom(4000, 0.0000001);
const input = "hello world";
const encoder = new TextEncoder();
const uint8array = encoder.encode(input);
filter.insert(uint8array);

assertEquals(filter.lookup(uint8array), true);
```

It is often useful to save and load the bloom filter.

```typescript
const filter = new Bloom(4000, 0.0000001);
const input = "hello world";
const encoder = new TextEncoder();
const uint8array = encoder.encode(input);
filter.insert(uint8array);
assertEquals(filter.lookup(uint8array), true);

const bytes = filter.dump();

const filter2 = Bloom.from(bytes);
assertEquals(filter2.lookup(uint8array), true);
```
