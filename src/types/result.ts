/**
 * Result type for explicit error handling without try/catch.
 * AR5 compliance.
 */
export type Result<T, E = Error> = Ok<T> | Err<E>;

export class Ok<T> {
  readonly ok = true;
  constructor(readonly value: T) {}

  map<U>(fn: (value: T) => U): Result<U, never> {
    return new Ok(fn(this.value));
  }

  mapErr(): Result<T, never> {
    return this;
  }

  unwrap(): T {
    return this.value;
  }
}

export class Err<E> {
  readonly ok = false;
  constructor(readonly error: E) {}

  map(): Result<never, E> {
    return this;
  }

  mapErr<U>(fn: (error: E) => U): Result<never, U> {
    return new Err(fn(this.error));
  }

  unwrap(): never {
    if (this.error instanceof Error) {
      throw this.error;
    }
    throw new Error(String(this.error));
  }
}

export const ok = <T>(value: T): Result<T, never> => new Ok(value);
export const err = <E>(error: E): Result<never, E> => new Err(error);

/**
 * Wraps a promise in a Result.
 */
export const fromPromise = async <T>(
  promise: Promise<T>,
): Promise<Result<T, Error>> => {
  try {
    const value = await promise;
    return ok(value);
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
};
