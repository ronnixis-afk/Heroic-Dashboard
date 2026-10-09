import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { cn, formatBytes } from '../src/lib/utils';

describe('utils formatBytes', () => {
  it('formats standard byte sizes correctly', () => {
    assert.equal(formatBytes(0), '0 B');
    assert.equal(formatBytes(1024), '1 KB');
    assert.equal(formatBytes(1024 * 1024), '1 MB');
    assert.equal(formatBytes(1024 * 1024 * 1024), '1 GB');
    assert.equal(formatBytes(1536, 1), '1.5 KB');
  });

  it('handles negative and non-finite numbers safely', () => {
    assert.equal(formatBytes(-100), '0 B');
    assert.equal(formatBytes(NaN), '0 B');
    assert.equal(formatBytes(Infinity), '0 B');
    assert.equal(formatBytes(-Infinity), '0 B');
  });

  it('clamps unit index to TB for very large values', () => {
    const huge = 1024 * 1024 * 1024 * 1024 * 5;
    assert.equal(formatBytes(huge), '5 TB');
  });

  it('handles fractional byte sizes safely without negative index', () => {
    assert.equal(formatBytes(0.5), '0.5 B');
  });

  it('handles invalid or non-integer decimal precision safely', () => {
    assert.equal(formatBytes(1536, NaN), '2 KB');
    assert.equal(formatBytes(1536, -2), '2 KB');
    assert.equal(formatBytes(1536, 1.9), '1.5 KB');
  });
});

describe('utils cn', () => {
  it('merges class names and resolves tailwind conflicts', () => {
    assert.equal(cn('px-2', 'py-1'), 'px-2 py-1');
    assert.equal(cn('px-2', 'px-4'), 'px-4');
  });
});
