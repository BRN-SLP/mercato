export type utils_add_rate_limitResult<T> = {
  data: T | null;
  error: string | null;
};

export function wrapResult<T>(data: T): utils_add_rate_limitResult<T> {
  return { data, error: null };
}
