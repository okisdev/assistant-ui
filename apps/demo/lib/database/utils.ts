/**
 * Recursively makes all properties in T required and non-nullable.
 */
export type DeepRequired<T> = {
  [K in keyof T]-?: T[K] extends object | undefined
    ? DeepRequired<NonNullable<T[K]>>
    : NonNullable<T[K]>;
};
