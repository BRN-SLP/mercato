export type cache_extract_constantResult<T> = {
  data: T | null;
  error: string | null;
};

export function wrapResult<T>(data: T): cache_extract_constantResult<T> {
  return { data, error: null };
}
