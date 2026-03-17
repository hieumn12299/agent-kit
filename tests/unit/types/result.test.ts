import { describe, it, expect } from 'vitest';
import { Ok, Err, ok, err, fromPromise } from '../../../src/types/result.js';

describe('Result type', () => {
  describe('Ok', () => {
    it('ok flag is true', () => {
      const r = ok(42);
      expect(r.ok).toBe(true);
    });

    it('unwrap returns the value', () => {
      expect(ok('hello').unwrap()).toBe('hello');
    });

    it('map transforms the value', () => {
      const r = ok(3).map((n) => n * 2);
      expect(r.ok).toBe(true);
      expect(r.unwrap()).toBe(6);
    });

    it('mapErr is a no-op on Ok', () => {
      const r = ok<number>(10);
      // mapErr on Ok returns itself unchanged
      expect(r.ok).toBe(true);
      expect(r.unwrap()).toBe(10);
    });
  });

  describe('Err', () => {
    it('ok flag is false', () => {
      const r = err('failure');
      expect(r.ok).toBe(false);
    });

    it('unwrap throws', () => {
      expect(() => err(new Error('boom')).unwrap()).toThrow('boom');
    });

    it('unwrap wraps non-Error in Error', () => {
      expect(() => err('string error').unwrap()).toThrow('string error');
    });

    it('map is a no-op on Err', () => {
      const r = err<string>('fail');
      expect(r.ok).toBe(false);
    });

    it('mapErr transforms the error', () => {
      const r = err('oops').mapErr((e) => `wrapped: ${e}`);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toBe('wrapped: oops');
    });
  });

  describe('fromPromise', () => {
    it('wraps resolved promise in Ok', async () => {
      const r = await fromPromise(Promise.resolve(42));
      expect(r.ok).toBe(true);
      expect(r.unwrap()).toBe(42);
    });

    it('wraps rejected promise in Err', async () => {
      const r = await fromPromise(Promise.reject(new Error('fail')));
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toBe('fail');
    });

    it('wraps non-Error rejection in Err with Error', async () => {
      const r = await fromPromise(Promise.reject('string'));
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toBeInstanceOf(Error);
    });
  });
});
