type NormalizeStringListOptions = {
  sort?: boolean;
};

export function normalizeStringList(
  values: Array<string | null | undefined> | null | undefined,
  options: NormalizeStringListOptions = {},
) {
  if (values == null || values.length === 0) {
    return [];
  }
  const normalized = [...new Set(values.map((value) => value?.trim() ?? "").filter(Boolean))];
  return options.sort ? normalized.sort() : normalized;
}
