import React from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'cosmic' | 'ghost' | 'outline'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-2xl font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
    
    const variants = {
      default: "bg-[#7B2FF7] text-white hover:bg-[#9A4EFF] shadow-[0_0_20px_rgba(123,47,247,0.3)] hover:shadow-[0_0_30px_rgba(123,47,247,0.5)]",
      cosmic: "bg-gradient-to-r from-[#7B2FF7] to-[#00FFA3] text-white hover:opacity-90 shadow-[0_0_20px_rgba(0,255,163,0.3)]",
      ghost: "hover:bg-[#1E1E3F] text-white",
      outline: "border-2 border-[#7B2FF7] text-[#7B2FF7] hover:bg-[#7B2FF7]/10"
    }
    
    const sizes = {
      default: "h-11 px-8 py-2",
      sm: "h-9 px-4 text-sm",
      lg: "h-14 px-10 text-lg",
      icon: "h-10 w-10"
    }
    
    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
