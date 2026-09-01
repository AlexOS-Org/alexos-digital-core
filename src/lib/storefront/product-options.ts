import type { StoreVariant } from "./api";

export type VariantOptionKey = "gender" | "color" | "size";
export type VariantOptionValues = Partial<Record<VariantOptionKey, string>>;

export function getVariantOption(variant: StoreVariant, key: VariantOptionKey): string | null {
  if (key === "color" && variant.color?.trim()) return variant.color.trim();
  const options = variant.options;
  if (options && typeof options === "object" && !Array.isArray(options)) {
    const record = options as Record<string, unknown>;
    const value =
      record[key] ??
      (key === "gender" ? (record.sex ?? record.audience) : undefined) ??
      (key === "color" ? record.colour : undefined);
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

export function getOptionGroups(variants: StoreVariant[]) {
  return (["gender", "color", "size"] as const).flatMap((key) => {
    const values = Array.from(
      new Set(
        variants
          .map((variant) => getVariantOption(variant, key))
          .filter((value): value is string => Boolean(value)),
      ),
    );
    return values.length ? [{ key, values }] : [];
  });
}

export function findVariantForOptions(
  variants: StoreVariant[],
  selectedOptions: VariantOptionValues,
): StoreVariant | null {
  return (
    variants.find((variant) =>
      (["gender", "color", "size"] as const).every(
        (key) => !selectedOptions[key] || getVariantOption(variant, key) === selectedOptions[key],
      ),
    ) ?? null
  );
}

export function areAllUnavailable(variants: StoreVariant[]): boolean {
  return (
    variants.length > 0 && variants.every((variant) => variant.availability_confirmed === false)
  );
}

export function isVariantUnavailable(
  variants: StoreVariant[],
  selectedOptions: VariantOptionValues,
  key: VariantOptionKey,
  value: string,
): boolean {
  const candidates = variants.filter((variant) => {
    if (getVariantOption(variant, key) !== value) return false;
    return (["gender", "color", "size"] as const).every(
      (otherKey) =>
        otherKey === key ||
        !selectedOptions[otherKey] ||
        getVariantOption(variant, otherKey) === selectedOptions[otherKey],
    );
  });
  return (
    candidates.length > 0 && candidates.every((variant) => variant.availability_confirmed === false)
  );
}
