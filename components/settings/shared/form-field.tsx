/**
 * Reusable form field component for settings forms.
 */

interface FormFieldProps {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  placeholder?: string;
  disabled?: boolean;
  multiline?: boolean;
  rows?: number;
  help?: string;
}

export function FormField({
  label,
  name,
  defaultValue,
  placeholder,
  disabled,
  multiline,
  rows,
  help,
}: FormFieldProps) {
  const inputClass = "w-full rounded-lg glass border-border/50 px-3 py-2 text-sm disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary transition-smooth";

  return (
    <div>
      <label className="block text-sm font-medium mb-1 text-foreground">{label}</label>
      {multiline ? (
        <textarea
          name={name}
          defaultValue={defaultValue ?? ""}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows || 3}
          className={inputClass}
        />
      ) : (
        <input
          name={name}
          defaultValue={defaultValue ?? ""}
          placeholder={placeholder}
          disabled={disabled}
          className={inputClass}
        />
      )}
      {help && <p className="text-xs text-muted-foreground mt-1">{help}</p>}
    </div>
  );
}
