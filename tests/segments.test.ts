import { describe, expect, it } from 'vitest';
import { batchSegments, decodeBatch, encodeBatch, type Segment } from '../src/core/page/segments';

const segment = (text: string): Segment => ({
  node: { nodeValue: text } as unknown as Text,
  original: text,
});

describe('batchSegments', () => {
  it('keeps each batch under the character budget', () => {
    const segments = Array.from({ length: 10 }, () => segment('x'.repeat(400)));
    const batches = batchSegments(segments, 1000);
    expect(batches.every((b) => b.reduce((n, s) => n + s.original.length, 0) <= 1200)).toBe(true);
    expect(batches.flat()).toHaveLength(10);
  });

  it('never emits an empty batch, even for oversized segments', () => {
    const batches = batchSegments([segment('y'.repeat(5000))], 100);
    expect(batches).toHaveLength(1);
  });
});

describe('encode/decode round trip', () => {
  it('maps numbered replies back onto their segments', () => {
    const batch = [segment('Hello'), segment('World')];
    expect(encodeBatch(batch)).toBe('1. Hello\n2. World');
    expect(decodeBatch('1. Bonjour\n2. Monde', batch)).toEqual(['Bonjour', 'Monde']);
  });

  it('keeps the original when a line is missing from the reply', () => {
    const batch = [segment('Hello'), segment('World')];
    expect(decodeBatch('1. Bonjour', batch)).toEqual(['Bonjour', 'World']);
  });

  it('keeps the original when the model returns an empty line', () => {
    const batch = [segment('Hello')];
    expect(decodeBatch('1. ', batch)).toEqual(['Hello']);
  });

  it('ignores stray prose around the list', () => {
    const batch = [segment('Hello')];
    expect(decodeBatch('Sure! Here you go:\n1. Bonjour\nHope that helps', batch)).toEqual([
      'Bonjour',
    ]);
  });
});
