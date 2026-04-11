import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  helperText?: string;
};

export function Input({
  label,
  error,
  helperText,
  id,
  className = "",
  ...rest
}: Props) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}
      <input
        {...rest}
        id={inputId}
        className={[
          "block w-full rounded-md border px-3 py-2 text-sm shadow-sm",
          "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0",
          error
            ? "border-red-400 focus:ring-red-400"
            : "border-gray-300 focus:ring-blue-500",
          className,
        ].join(" ")}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      {!error && helperText && (
        <p className="text-xs text-gray-500">{helperText}</p>
      )}
    </div>
  );
}
