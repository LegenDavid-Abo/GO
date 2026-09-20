import { InputHTMLAttributes, TextareaHTMLAttributes, ReactNode } from "react";

interface WrapProps {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}

export function FieldWrap({ label, hint, required, children }: WrapProps) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <label className="text-sm font-medium text-bone/70">
          {label}
          {required && <span className="ml-1 text-brass-400">*</span>}
        </label>
        {hint && <span className="text-xs text-bone/35">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
}

export function TextField({ label, hint, required, className = "", ...rest }: TextFieldProps) {
  return (
    <FieldWrap label={label} hint={hint} required={required}>
      <input required={required} className={`field-input ${className}`} {...rest} />
    </FieldWrap>
  );
}

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
}

export function TextAreaField({ label, hint, required, className = "", rows = 5, ...rest }: TextAreaProps) {
  return (
    <FieldWrap label={label} hint={hint} required={required}>
      <textarea required={required} rows={rows} className={`field-input resize-none ${className}`} {...rest} />
    </FieldWrap>
  );
}
