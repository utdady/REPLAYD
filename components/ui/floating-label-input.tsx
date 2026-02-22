"use client";

import { useState, useRef, useEffect, type InputHTMLAttributes } from "react";

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

export interface FloatingLabelInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "className"> {
  id: string;
  name: string;
  label: string;
  value?: string;
  defaultValue?: string;
  className?: string;
  inputClassName?: string;
  showPasswordToggle?: boolean;
}

export function FloatingLabelInput({
  id,
  name,
  label,
  type = "text",
  value,
  defaultValue,
  onChange,
  onFocus,
  onBlur,
  required,
  maxLength,
  minLength,
  pattern,
  autoComplete,
  className = "",
  inputClassName = "",
  showPasswordToggle = false,
  ...rest
}: FloatingLabelInputProps) {
  const [focused, setFocused] = useState(false);
  const [internalValue, setInternalValue] = useState(value ?? defaultValue ?? "");
  const [showPassword, setShowPassword] = useState(false);
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;
  const hasValue = currentValue.length > 0;
  const isFloating = focused || hasValue;

  const inputType = showPasswordToggle ? (showPassword ? "text" : "password") : type;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) setInternalValue(e.target.value);
    onChange?.(e);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setFocused(false);
    onBlur?.(e);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={inputType}
          value={isControlled ? value : undefined}
          defaultValue={!isControlled ? defaultValue : undefined}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          required={required}
          maxLength={maxLength}
          minLength={minLength}
          pattern={pattern}
          autoComplete={autoComplete}
          className={`w-full rounded-badge border border-border2 bg-surface3 px-3 pt-4 pb-2 text-sm font-sans text-white focus:outline-none focus:ring-1 focus:ring-green ${showPasswordToggle ? "pr-10" : ""} ${inputClassName}`}
          {...rest}
        />
        <label
          htmlFor={id}
          className={`absolute left-3 pointer-events-none transition-all duration-200 text-muted2 ${
            isFloating
              ? "top-1.5 text-[0.65rem] font-mono uppercase tracking-wider"
              : "top-1/2 -translate-y-1/2 text-sm font-sans"
          }`}
        >
          {label}
        </label>
        {showPasswordToggle && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((p) => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted2 hover:text-white transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>
    </div>
  );
}
