> [!NOTE]
> This is a forked version of (https://jsr.io/@kgwinnup/bloom),
> featuring significant internal rewrites from **class-based**
> to **functional** implementation.\
> Stick to the original unless you're specifically interested
> in functional programming characteristics.

# Bloom filter <sup>(classless)</sup>

[![JSR](https://jsr.io/badges/@imcotton/bloom)](https://jsr.io/@imcotton/bloom)





## create

```ts
const filter1 = bloom_by(4000, 1e-7);

const filter2 = bloom_from(filter1.dump());
```





## insert

immutable updates

```ts
const filter = bloom_by(4000, 1e-7);

const filter1 = filter.insert(item);

const filter2 = filter.batch_insert([ item, item ]);
```


