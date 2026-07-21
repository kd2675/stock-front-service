import { z } from "zod";

type NumberRange = {
  min?: number;
  max?: number;
};

export function requiredTrimmedString(message = "필수 값을 입력해 주세요.") {
  return z.string().trim().min(1, message);
}

export function requiredUppercaseString(message = "필수 값을 입력해 주세요.") {
  return requiredTrimmedString(message).transform((value) => value.toUpperCase());
}

export function optionalTrimmedStringAsUndefined() {
  return z.string().trim().transform((value) => value || undefined);
}

export function optionalTrimmedStringAsNull() {
  return z.string().trim().transform((value) => value || null);
}

export function positiveNumber(message = "0보다 큰 숫자로 입력해 주세요.") {
  return z.coerce.number().finite(message).positive(message);
}

export function positiveInteger(message = "1 이상 정수로 입력해 주세요.") {
  return z.coerce.number().int(message).positive(message);
}

export function nonNegativeInteger(message = "0 이상 정수로 입력해 주세요.") {
  return z.coerce.number().int(message).min(0, message);
}

export function integerRange(min: number, max: number) {
  return z.coerce.number().int().min(min).max(max);
}

export function numberRange(min: number, max: number) {
  return z.coerce.number().finite().min(min).max(max);
}

export function numberFromBlankZero(range: NumberRange = {}) {
  let numberSchema = z.number().finite();
  if (range.min !== undefined) {
    numberSchema = numberSchema.min(range.min);
  }
  if (range.max !== undefined) {
    numberSchema = numberSchema.max(range.max);
  }
  return z.string()
    .trim()
    .transform((value) => value === "" ? 0 : Number(value))
    .pipe(numberSchema);
}
