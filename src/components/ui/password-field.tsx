"use client";

import { useState } from "react";
import { Label } from "./input";
import { PasswordInput } from "./password-input";

/**
 * Labelled password field with a show/hide toggle and inline (on-blur)
 * min-length validation. The error sits directly under the field and is wired
 * to the input via aria-invalid / aria-describedby.
 */
export function PasswordField({
  id,
  name,
  label,
  autoComplete,
  minLength,
  required,
}: {
  id: string;
  name: string;
  label: string;
  autoComplete: string;
  minLength?: number;
  required?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const errorId = `${id}-error`;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required ? " *" : ""}
      </Label>
      <PasswordInput
        id={id}
        name={name}
        autoComplete={autoComplete}
        minLength={minLength}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className="aria-invalid:border-danger-line"
        onBlur={(e) => {
          const v = e.currentTarget.value;
          setError(minLength && v.length > 0 && v.length < minLength ? `At least ${minLength} characters.` : null);
        }}
        onInput={() => setError((prev) => (prev ? null : prev))}
      />
      {error && (
        <p id={errorId} className="text-xs text-danger-ink">
          {error}
        </p>
      )}
    </div>
  );
}
