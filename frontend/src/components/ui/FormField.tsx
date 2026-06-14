import './FormField.css'

interface FormFieldProps { label: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode }

export function FormField({ label, required, error, hint, children }: FormFieldProps) {
  return (
    <div className="field">
      <label className="field__label">{label}{required && <span className="field__req">*</span>}</label>
      {children}
      {hint && !error && <span className="field__hint">{hint}</span>}
      {error && <span className="field__error">{error}</span>}
    </div>
  )
}
