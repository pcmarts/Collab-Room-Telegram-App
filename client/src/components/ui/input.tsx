import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-md border border-border-strong bg-surface-raised px-3 text-base text-text",
          "placeholder:text-text-subtle",
          "transition-[border-color,background-color,box-shadow] duration-fast ease-out",
          "hover:border-[color-mix(in_oklch,var(--border-strong)_70%,var(--brand))]",
          "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-text",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
