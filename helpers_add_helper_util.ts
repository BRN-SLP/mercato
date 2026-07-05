export type helpers_add_helper_utilResult<T> = {
  data: T | null;
  error: string | null;
};

export function wrapResult<T>(data: T): helpers_add_helper_utilResult<T> {
  return { data, error: null };
}
