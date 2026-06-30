import type { ReactNode } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

export function DarkSelect({
  label,
  value,
  onChange,
  children,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <label className={`grid min-w-0 gap-1 text-xs font-bold ${disabled ? "text-[#66717d]" : "text-[#b8c2cc]"}`}>
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="w-full min-w-0 rounded-md border border-white/10 bg-[#161b21] px-3 py-3 text-sm font-bold text-white outline-none focus:border-[#64a8ff] disabled:cursor-not-allowed disabled:border-white/5 disabled:bg-[#101418] disabled:text-[#66717d]"
      >
        {children}
      </select>
    </label>
  );
}

export function DarkInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  className,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <label className={["grid min-w-0 gap-1 text-xs font-bold text-[#b8c2cc]", className].filter(Boolean).join(" ")}>
      {label}
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full min-w-0 rounded-md border border-white/10 bg-[#161b21] px-3 py-3 text-sm font-bold text-white outline-none placeholder:text-[#5f6b76] disabled:cursor-not-allowed disabled:bg-[#11161b] disabled:text-[#6b7682] focus:border-[#64a8ff]"
      />
    </label>
  );
}

export function DarkFormInput({
  label,
  registration,
  placeholder,
  className = "",
  error,
}: {
  label: string;
  registration: UseFormRegisterReturn;
  placeholder?: string;
  className?: string;
  error?: string;
}) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="text-xs font-bold text-[#8b95a1]">{label}</span>
      <input
        {...registration}
        placeholder={placeholder}
        className="mt-1 w-full min-w-0 rounded-md border border-[#2b333f] bg-[#101418] px-3 py-3 text-sm font-bold text-white outline-none focus:border-[#3182f6]"
      />
      {error ? <span className="mt-1 block text-xs font-bold text-[#ff8a80]">{error}</span> : null}
    </label>
  );
}

export function DarkFormSelect({
  label,
  registration,
  children,
  className = "",
}: {
  label: string;
  registration: UseFormRegisterReturn;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="text-xs font-bold text-[#8b95a1]">{label}</span>
      <select
        {...registration}
        className="mt-1 w-full min-w-0 rounded-md border border-[#2b333f] bg-[#101418] px-3 py-3 text-sm font-bold text-white outline-none focus:border-[#3182f6]"
      >
        {children}
      </select>
    </label>
  );
}

export function EnabledToggleButton({
  enabled,
  disabled = false,
  onToggle,
}: {
  enabled: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={enabled}
      disabled={disabled}
      onClick={onToggle}
      className={[
        "inline-flex h-8 min-w-20 items-center justify-between gap-2 rounded-md border px-2 text-xs font-black transition disabled:cursor-wait disabled:opacity-55",
        enabled
          ? "border-[#3182f6]/50 bg-[#12345a] text-[#d8ecff]"
          : "border-white/10 bg-white/[0.06] text-[#b8c2cc]",
      ].join(" ")}
    >
      <span
        className={[
          "h-2 w-2 rounded-full",
          enabled ? "bg-[#64a8ff]" : "bg-[#5f6b76]",
        ].join(" ")}
      />
      <span>{disabled ? "처리 중" : enabled ? "가동" : "정지"}</span>
    </button>
  );
}
