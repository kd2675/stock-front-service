import type { FieldErrors, FieldValues } from "react-hook-form";

export function resolveFirstFieldErrorMessage<TFieldValues extends FieldValues>(
  errors: FieldErrors<TFieldValues>,
  fallbackMessage: string,
) {
  return Object.values(errors).find(isFieldErrorWithMessage)?.message ?? fallbackMessage;
}

function isFieldErrorWithMessage(error: unknown): error is { message: string } {
  if (typeof error !== "object" || error === null || !("message" in error)) {
    return false;
  }
  return typeof (error as { message?: unknown }).message === "string";
}
