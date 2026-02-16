/** Framework-agnostic component type. Each framework binding provides its own concrete type. */
export type AnyComponent =
  | ((...args: any[]) => unknown)
  | { new (...args: any[]): unknown };
