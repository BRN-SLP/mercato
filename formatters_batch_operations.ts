export type formatters_batch_operationsResult<T> = {
  data: T | null;
  error: string | null;
};

export function wrapResult<T>(data: T): formatters_batch_operationsResult<T> {
  return { data, error: null };
}
