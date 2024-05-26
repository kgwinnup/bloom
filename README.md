> [!NOTE]
> This is forked version from (https://jsr.io/@kgwinnup/bloom)
> due to massive internal rewritten from **Class** to **functional**
> implemntation.

# Bloom filter <sup>(classless)</sup>





## different

### create

from:

```ts
const filter1 = new Bloom(4000, 0.0000001);
const filter2 = Bloom.from(filter1.dump());
```

to:

```ts
const filter1 = bloom_by(4000, 0.0000001);
const filter2 = bloom_from(filter1.dump());
```





### insert

from:

```ts
filter.insert(item);
```

to:

```ts
filter = filter.insert(item); // immutable update
```





<details>

<summary>(unfold to the original README down below)</summary>

# Bloom filter

[![JSR](https://jsr.io/badges/@kgwinnup/bloom)](https://jsr.io/@kgwinnup/bloom)

This is a standard bloom filter written in typescript.

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

</details>


