import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'quiet'
}

export function Button({ variant = 'quiet', className, ...rest }: ButtonProps) {
  return <button className={`ui-button ui-button--${variant} ${className ?? ''}`} {...rest} />
}
