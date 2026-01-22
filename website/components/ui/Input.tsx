"use client";

import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

const inputClasses = `
  w-full
  bg-[var(--background)]
  border border-[var(--gray-600)]
  rounded-lg
  px-4 py-4
  text-white
  placeholder:text-[var(--gray-500)]
  transition-all duration-300
  focus:border-[var(--accent)]
  focus:outline-none
  focus:ring-1 focus:ring-[var(--accent)]
`;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-[var(--gray-300)]">
            {label}
          </label>
        )}
        <input ref={ref} className={`${inputClasses} ${className}`} {...props} />
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-[var(--gray-300)]">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`${inputClasses} min-h-[150px] resize-y ${className}`}
          {...props}
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = "", ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-[var(--gray-300)]">
            {label}
          </label>
        )}
        <select ref={ref} className={`${inputClasses} ${className}`} {...props}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";
