> [!NOTE]
> This is forked version from (https://jsr.io/@kgwinnup/bloom)
> due to massive internal rewritten from **Class** to **functional**
> implemntation.

# Bloom filter <sup>(classless)</sup>

[![JSR](https://jsr.io/badges/@imcotton/bloom)](https://jsr.io/@imcotton/bloom)





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


