# Query Build

Query Build is a small TypeScript library for building and parsing URL query strings where repeated keys are handled correctly.

## Usage

```js
import { QueryBuild } from './src/index.js';

const qb = new QueryBuild('tag=a&tag=b&name=test');
console.log(qb.getAll('tag')); // ['a', 'b']
console.log(qb.get('name'));   // 'test'

qb.append('tag', 'c');
console.log(qb.toString()); // 'tag=a&tag=b&name=test&tag=c'
```

## Why this library exists

Native `URLSearchParams` handles repeated keys, but it sorts keys alphabetically and always encodes spaces as `+`. This library preserves insertion order and decodes `+` as a space on input while encoding spaces as `+` on output, matching the behaviour of the WHATWG URL specification for `application/x-www-form-urlencoded`.

The trade-off is that `toString()` always uses `+` for spaces rather than `%20`. This keeps the encoder simple and compatible with typical form submission, at the cost of not round-tripping a query string that originally used `%20` for spaces.

## Edge case to be aware of

A key without an equals sign is parsed as having an empty string value. Round-tripping it produces `key=` rather than the original bare `key`, because the serializer always emits `key=value` pairs.

## Design notes

The window stores values eagerly rather than keeping running aggregates. Running
sums drift with floating point over long streams, and recomputing from a small
buffer is cheap enough that the drift is not worth the speed.

