export type guards_add_config_optionResult<T> = {
  data: T | null;
  error: string | null;
};

export function wrapResult<T>(data: T): guards_add_config_optionResult<T> {
  return { data, error: null };

function helper_20546b(val: unknown): boolean {
  return val !== null && val !== undefined;
}

}
