"use client";

import { type ComponentPropsWithRef, useId, useState } from "react";
import { LABEL_CLASS, fieldClass, buildDescribedBy } from "./styles";

interface TextareaProps extends Omit<ComponentPropsWithRef<"textarea">, "id"> {
  label: string;
  hideLabel?: boolean;
  error?: string;
  helperText?: string;
}

export default function Textarea({
  label,
  hideLabel = false,
  error,
  helperText,
  required,
  className,
  maxLength,
  onChange,
  defaultValue,
  value,
  ...rest
}: TextareaProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const helperId = `${id}-helper`;
  const countId = `${id}-count`;

  const [charCount, setCharCount] = useState(
    () => String(value ?? defaultValue ?? "").length,
  );

  const describedBy = buildDescribedBy(
    error ? errorId : null,
    helperText ? helperId : null,
    maxLength ? countId : null,
  );

  return (
    <div className={className}>
      <label htmlFor={id} className={hideLabel ? "sr-only" : LABEL_CLASS}>
        {label}
        {required && (
          <span className="text-error-500 ml-0.5" aria-hidden="true">
            *
          </span>
        )}
      </label>

      <textarea
        {...rest}
        id={id}
        required={required}
        maxLength={maxLength}
        value={value}
        defaultValue={defaultValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        onChange={(e) => {
          setCharCount(e.target.value.length);
          onChange?.(e);
        }}
        className={fieldClass(error, "py-2 resize-none")}
      />

      {maxLength != null && (
        <p
          id={countId}
          className="mt-1.5 text-right text-xs text-muted"
          aria-live="polite"
        >
          {charCount} / {maxLength}
        </p>
      )}

      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-error-600 dark:text-error-500" role="alert">
          {error}
        </p>
      )}

      {helperText && !error && (
        <p id={helperId} className="mt-1.5 text-sm text-muted">
          {helperText}
        </p>
      )}
    </div>
  );
}
