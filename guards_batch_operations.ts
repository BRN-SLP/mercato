export type guards_batch_operationsResult<T> = {
  data: T | null;
  error: string | null;
};

export function wrapResult<T>(data: T): guards_batch_operationsResult<T> {
  return { data, error: null };
}
