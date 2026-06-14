import './Button.css'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'default' | 'danger'
  size?: 'md' | 'sm'
  icon?: React.ReactNode
}

export function Button({ variant = 'default', size = 'md', icon, children, className = '', ...rest }: ButtonProps) {
  return (
    <button className={`btn btn--${variant} btn--${size} ${className}`} {...rest}>
      {icon}{children}
    </button>
  )
}
