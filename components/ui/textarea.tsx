import { forwardRef, useId, type TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> { label?: string; error?: string }
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ label, error, className = '', id, ...props }, ref) => {
  const generatedId = useId(); const fieldId = id ?? generatedId;
  return <div className="w-full">{label && <label htmlFor={fieldId} className="iv-field-label">{label}</label>}<textarea {...props} ref={ref} id={fieldId} className={`iv-field min-h-28 resize-y ${error ? 'iv-field-error' : ''} ${className}`} />{error && <p className="iv-field-error-text">{error}</p>}</div>;
});
Textarea.displayName = 'Textarea';
