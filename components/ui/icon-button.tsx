import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const iconButtonVariants = cva(
  [
    "inline-flex items-center justify-center shrink-0 rounded-md",
    "transition-[background-color,border-color,color] duration-(--duration-fast) ease-(--ease-standard)",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:shrink-0 [&_svg]:pointer-events-none",
  ],
  {
    variants: {
      variant: {
        primary: "bg-teal-600 text-white hover:bg-teal-700",
        secondary: "bg-surface text-fg border border-border hover:bg-surface-muted",
        subtle: "bg-ink-100 text-fg-secondary hover:bg-ink-200 hover:text-fg",
        ghost: "text-fg-secondary hover:bg-ink-100 hover:text-fg",
        danger: "text-danger-600 hover:bg-danger-50",
      },
      size: {
        sm: "size-8 [&_svg]:size-4",
        md: "size-10 [&_svg]:size-4.5",
        lg: "size-11 [&_svg]:size-5",
      },
    },
    defaultVariants: { variant: "ghost", size: "md" },
  },
);

export interface IconButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof iconButtonVariants> {
  asChild?: boolean;
  /** Required — an icon-only control is invisible to screen readers without it. */
  "aria-label": string;
}

export function IconButton({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: IconButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp className={cn(iconButtonVariants({ variant, size }), className)} {...props} />
  );
}
