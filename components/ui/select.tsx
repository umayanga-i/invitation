import { forwardRef, useId, type SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> { label?: string; error?: string }
export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ label, error, className = '', children, id, ...props }, ref) => {
  const generatedId = useId(); const selectId = id ?? generatedId;
  return <div className="w-full">{label && <label htmlFor={selectId} className="iv-field-label">{label}</label>}<select {...props} ref={ref} id={selectId} className={`iv-field ${error ? 'iv-field-error' : ''} ${className}`}>{children}</select>{error && <p className="iv-field-error-text">{error}</p>}</div>;
});
Select.displayName = 'Select';
