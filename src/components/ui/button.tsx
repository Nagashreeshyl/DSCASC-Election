"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-brand-charcoal text-white border-2 border-black shadow-brutal hover:translate-x-1 hover:translate-y-1 hover:shadow-brutal-sm",
        secondary: "bg-brand-yellow text-brand-charcoal border-2 border-black shadow-brutal hover:translate-x-1 hover:translate-y-1 hover:shadow-none",
        outline: "bg-white text-black border-2 border-black hover:bg-brand-yellowMuted",
        destructive: "bg-destructive text-white border-2 border-black shadow-brutal hover:translate-x-1 hover:translate-y-1 hover:shadow-none",
        ghost: "bg-transparent border-2 border-transparent hover:bg-muted"
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-3",
        lg: "h-13 px-8 text-base",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: { variant: "primary", size: "default" }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
);
Button.displayName = "Button";

export { buttonVariants };
