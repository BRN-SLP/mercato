export type guards_sanitize_inputResult<T> = {
  data: T | null;
  error: string | null;
};

export function wrapResult<T>(data: T): guards_sanitize_inputResult<T> {
  return { data, error: null };
}
