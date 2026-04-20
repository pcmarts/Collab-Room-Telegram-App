import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { triggerHapticFeedback } from "@/lib/haptics"

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap select-none",
    "font-medium tracking-[-0.005em]",
    "transition-[background-color,color,border-color,transform,box-shadow]",
    "duration-fast ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-40",
    "active:translate-y-px",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "bg-brand text-brand-fg hover:bg-brand-hover",
        secondary: "bg-surface text-text hover:bg-accent border border-hairline",
        outline: "bg-transparent text-text border border-border-strong hover:bg-surface",
        ghost: "bg-transparent text-text-muted hover:bg-surface hover:text-text",
        link: "bg-transparent text-brand underline-offset-4 hover:underline h-auto p-0",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
      size: {
        sm: "h-9 px-3 rounded-sm text-sm",
        default: "h-11 px-4 rounded-md text-base",
        lg: "h-12 px-5 rounded-md text-md",
        icon: "h-11 w-11 rounded-md",
        "icon-sm": "h-9 w-9 rounded-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, onClick, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      triggerHapticFeedback("light")
      onClick?.(event)
    }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        onClick={handleClick}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
