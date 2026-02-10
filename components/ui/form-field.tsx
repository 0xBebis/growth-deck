/**
 * Accessible form field components with built-in validation patterns.
 * Provides consistent styling, error handling, and accessibility.
 */

"use client";

import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { AlertCircle, CheckCircle, Info } from "lucide-react";

type FieldState = "default" | "error" | "success" | "warning";

interface BaseFieldProps {
  /** Field label */
  label: string;
  /** Helper text shown below input */
  helperText?: string;
  /** Error message (sets state to error if provided) */
  error?: string;
  /** Success message (sets state to success if provided) */
  success?: string;
  /** Warning message (sets state to warning if provided) */
  warning?: string;
  /** Show required indicator */
  required?: boolean;
  /** Optional content for right side of label */
  labelExtra?: ReactNode;
  /** Additional wrapper className */
  wrapperClassName?: string;
}

interface InputFieldProps extends BaseFieldProps, Omit<InputHTMLAttributes<HTMLInputElement>, "className"> {
  /** Input className */
  inputClassName?: string;
}

interface TextareaFieldProps extends BaseFieldProps, Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className"> {
  /** Textarea className */
  textareaClassName?: string;
}

const stateConfig: Record<FieldState, { icon: ReactNode; borderClass: string; textClass: string }> = {
  default: {
    icon: null,
    borderClass: "border-zinc-700 focus-within:border-zinc-500",
    textClass: "text-zinc-400",
  },
  error: {
    icon: <AlertCircle className="h-4 w-4 text-red-400" />,
    borderClass: "border-red-500/50 focus-within:border-red-500",
    textClass: "text-red-400",
  },
  success: {
    icon: <CheckCircle className="h-4 w-4 text-green-400" />,
    borderClass: "border-green-500/50 focus-within:border-green-500",
    textClass: "text-green-400",
  },
  warning: {
    icon: <Info className="h-4 w-4 text-amber-400" />,
    borderClass: "border-amber-500/50 focus-within:border-amber-500",
    textClass: "text-amber-400",
  },
};

function getFieldState(error?: string, success?: string, warning?: string): FieldState {
  if (error) return "error";
  if (success) return "success";
  if (warning) return "warning";
  return "default";
}

function getMessage(error?: string, success?: string, warning?: string): string | undefined {
  return error || success || warning;
}

/**
 * Accessible input field with label, validation, and helper text.
 *
 * @example
 * ```tsx
 * <InputField
 *   label="Email"
 *   type="email"
 *   required
 *   error={errors.email}
 *   placeholder="you@example.com"
 * />
 * ```
 */
export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(function InputField(
  {
    label,
    helperText,
    error,
    success,
    warning,
    required,
    labelExtra,
    wrapperClassName,
    inputClassName,
    id,
    ...props
  },
  ref
) {
  const fieldId = id || `field-${label.toLowerCase().replace(/\s+/g, "-")}`;
  const helperId = `${fieldId}-helper`;
  const errorId = `${fieldId}-error`;
  const state = getFieldState(error, success, warning);
  const message = getMessage(error, success, warning);
  const config = stateConfig[state];

  return (
    <div className={cn("space-y-1.5", wrapperClassName)}>
      <div className="flex items-center justify-between">
        <label htmlFor={fieldId} className="text-sm font-medium text-zinc-200">
          {label}
          {required && (
            <span className="text-red-400 ml-0.5" aria-hidden="true">
              *
            </span>
          )}
        </label>
        {labelExtra}
      </div>

      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border bg-zinc-900/50 px-3 py-2",
          "transition-colors duration-150",
          config.borderClass
        )}
      >
        <input
          ref={ref}
          id={fieldId}
          className={cn(
            "flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500",
            "focus:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-50",
            inputClassName
          )}
          aria-invalid={state === "error" ? true : undefined}
          aria-describedby={cn(helperText && helperId, message && errorId) || undefined}
          required={required}
          {...props}
        />
        {config.icon}
      </div>

      {(helperText || message) && (
        <div className="space-y-1">
          {helperText && !message && (
            <p id={helperId} className="text-xs text-zinc-500">
              {helperText}
            </p>
          )}
          {message && (
            <p
              id={errorId}
              className={cn("text-xs flex items-center gap-1", config.textClass)}
              role={state === "error" ? "alert" : undefined}
            >
              {message}
            </p>
          )}
        </div>
      )}
    </div>
  );
});

/**
 * Accessible textarea field with label, validation, and helper text.
 *
 * @example
 * ```tsx
 * <TextareaField
 *   label="Description"
 *   rows={4}
 *   error={errors.description}
 *   placeholder="Enter a description..."
 * />
 * ```
 */
export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(function TextareaField(
  {
    label,
    helperText,
    error,
    success,
    warning,
    required,
    labelExtra,
    wrapperClassName,
    textareaClassName,
    id,
    ...props
  },
  ref
) {
  const fieldId = id || `field-${label.toLowerCase().replace(/\s+/g, "-")}`;
  const helperId = `${fieldId}-helper`;
  const errorId = `${fieldId}-error`;
  const state = getFieldState(error, success, warning);
  const message = getMessage(error, success, warning);
  const config = stateConfig[state];

  return (
    <div className={cn("space-y-1.5", wrapperClassName)}>
      <div className="flex items-center justify-between">
        <label htmlFor={fieldId} className="text-sm font-medium text-zinc-200">
          {label}
          {required && (
            <span className="text-red-400 ml-0.5" aria-hidden="true">
              *
            </span>
          )}
        </label>
        {labelExtra}
      </div>

      <div
        className={cn(
          "rounded-lg border bg-zinc-900/50 px-3 py-2",
          "transition-colors duration-150",
          config.borderClass
        )}
      >
        <textarea
          ref={ref}
          id={fieldId}
          className={cn(
            "w-full bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500",
            "focus:outline-none resize-y min-h-[80px]",
            "disabled:cursor-not-allowed disabled:opacity-50",
            textareaClassName
          )}
          aria-invalid={state === "error" ? true : undefined}
          aria-describedby={cn(helperText && helperId, message && errorId) || undefined}
          required={required}
          {...props}
        />
      </div>

      {(helperText || message) && (
        <div className="space-y-1">
          {helperText && !message && (
            <p id={helperId} className="text-xs text-zinc-500">
              {helperText}
            </p>
          )}
          {message && (
            <p
              id={errorId}
              className={cn("text-xs flex items-center gap-1", config.textClass)}
              role={state === "error" ? "alert" : undefined}
            >
              {message}
            </p>
          )}
        </div>
      )}
    </div>
  );
});

/**
 * Inline form field group for horizontal layouts.
 */
export function FieldGroup({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2", className)}>
      {children}
    </div>
  );
}

/**
 * Form section with title and description.
 */
export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-1">
        <h3 className="text-base font-medium text-zinc-200">{title}</h3>
        {description && (
          <p className="text-sm text-zinc-400">{description}</p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
