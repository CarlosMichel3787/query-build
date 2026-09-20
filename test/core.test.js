import { test } from 'node:test';
import assert from 'node:assert/strict';
import { QueryBuild } from '../src/core.js';

test('empty constructor creates empty query', () => {
  const qb = new QueryBuild();
  assert.equal(qb.toString(), '');
  assert.equal(qb.size, 0);
});

test('constructor parses query string with repeated keys', () => {
  const qb = new QueryBuild('tag=a&tag=b&name=x');
  assert.deepEqual(qb.getAll('tag'), ['a', 'b']);
  assert.equal(qb.get('name'), 'x');
  assert.equal(qb.size, 3);
});

test('parse preserves insertion order', () => {
  const qb = new QueryBuild('z=1&a=2&m=3');
  assert.equal(qb.toString(), 'z=1&a=2&m=3');
});

test('parse handles key without equals sign as empty value', () => {
  const qb = new QueryBuild('flag');
  assert.equal(qb.get('flag'), '');
  assert.equal(qb.toString(), 'flag=');
});

test('parse ignores empty segments', () => {
  const qb = new QueryBuild('a=1&&b=2&');
  assert.equal(qb.get('a'), '1');
  assert.equal(qb.get('b'), '2');
  assert.equal(qb.size, 2);
});

test('parse decodes percent-encoding and plus as space', () => {
  const qb = new QueryBuild('q=hello+world%21&x=%E2%9C%93');
  assert.equal(qb.get('q'), 'hello world!');
  assert.equal(qb.get('x'), '✓');
});

test('toString encodes spaces as plus and special characters', () => {
  const qb = new QueryBuild();
  qb.append('q', 'hello world');
  qb.append('x', 'a&b=c');
  assert.equal(qb.toString(), 'q=hello+world&x=a%26b%3Dc');
});

test('append multiple values for same key', () => {
  const qb = new QueryBuild();
  qb.append('tag', 'a');
  qb.append('tag', 'b');
  qb.append('tag', 'c');
  assert.deepEqual(qb.getAll('tag'), ['a', 'b', 'c']);
  assert.equal(qb.get('tag'), 'a');
  assert.equal(qb.size, 3);
});

test('get returns null for missing key', () => {
  const qb = new QueryBuild('a=1');
  assert.equal(qb.get('missing'), null);
  assert.deepEqual(qb.getAll('missing'), []);
});

test('set replaces all existing values for key', () => {
  const qb = new QueryBuild('tag=a&tag=b&x=1');
  qb.set('tag', 'z');
  assert.deepEqual(qb.getAll('tag'), ['z']);
  assert.equal(qb.size, 2);
  assert.equal(qb.toString(), 'x=1&tag=z');
});

test('delete removes all values for key', () => {
  const qb = new QueryBuild('tag=a&tag=b&x=1');
  qb.delete('tag');
  assert.equal(qb.get('tag'), null);
  assert.deepEqual(qb.getAll('tag'), []);
  assert.equal(qb.size, 1);
  assert.equal(qb.toString(), 'x=1');
});

test('iteration yields pairs in insertion order', () => {
  const qb = new QueryBuild('b=2&a=1&b=3');
  const pairs = [...qb];
  assert.deepEqual(pairs, [['b', '2'], ['a', '1'], ['b', '3']]);
});

test('fromObject handles arrays as repeated keys', () => {
  const qb = QueryBuild.fromObject({
    tag: ['a', 'b'],
    name: 'test'
  });
  assert.deepEqual(qb.getAll('tag'), ['a', 'b']);
  assert.equal(qb.get('name'), 'test');
  assert.equal(qb.toString(), 'tag=a&tag=b&name=test');
});

test('append and get coerce non-string arguments', () => {
  const qb = new QueryBuild();
  qb.append(42, true);
  assert.equal(qb.get('42'), 'true');
  assert.equal(qb.size, 1);
});

test('constructor throws on non-string query', () => {
  assert.throws(() => new QueryBuild(123), TypeError);
});

test('round-trip preserves repeated keys and order', () => {
  const original = 'tag=red&tag=blue&sort=asc&tag=green';
  const qb = new QueryBuild(original);
  assert.equal(qb.toString(), original);
});
