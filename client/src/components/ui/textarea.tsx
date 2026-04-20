import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[88px] w-full rounded-md border border-border-strong bg-surface-raised px-3 py-2.5 text-base text-text leading-snug",
          "placeholder:text-text-subtle",
          "transition-[border-color,background-color,box-shadow] duration-fast ease-out",
          "hover:border-[color-mix(in_oklch,var(--border-strong)_70%,var(--brand))]",
          "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
