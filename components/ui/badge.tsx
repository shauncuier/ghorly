import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
  [
    "inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap",
    // Bangla sits low in the em box; the extra bottom padding optically
    // re-centres the label without touching line-height.
    "pb-px [&_svg]:shrink-0",
  ],
  {
    variants: {
      tone: {
        neutral: "bg-ink-100 text-ink-700",
        accent: "bg-teal-50 text-teal-700",
        success: "bg-success-50 text-success-700",
        warning: "bg-warning-50 text-warning-700",
        danger: "bg-danger-50 text-danger-700",
      },
      variant: {
        soft: "",
        outline: "bg-transparent border",
        solid: "",
      },
      size: {
        sm: "px-2 py-0.5 text-xs [&_svg]:size-3",
        md: "px-2.5 py-1 text-xs [&_svg]:size-3.5",
        lg: "px-3 py-1.5 text-sm [&_svg]:size-4",
      },
    },
    compoundVariants: [
      { variant: "outline", tone: "neutral", class: "border-border text-fg-secondary" },
      { variant: "outline", tone: "accent", class: "border-teal-200 text-teal-700" },
      { variant: "outline", tone: "success", class: "border-success-500/35 text-success-700" },
      { variant: "outline", tone: "warning", class: "border-warning-500/35 text-warning-700" },
      { variant: "outline", tone: "danger", class: "border-danger-500/35 text-danger-700" },
      { variant: "solid", tone: "neutral", class: "bg-ink-800 text-white" },
      { variant: "solid", tone: "accent", class: "bg-teal-600 text-white" },
      { variant: "solid", tone: "success", class: "bg-success-600 text-white" },
      { variant: "solid", tone: "warning", class: "bg-warning-600 text-white" },
      { variant: "solid", tone: "danger", class: "bg-danger-600 text-white" },
    ],
    defaultVariants: { tone: "neutral", variant: "soft", size: "md" },
  },
);

export interface BadgeProps
  extends React.ComponentProps<"span">,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, variant, size, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone, variant, size }), className)} {...props}>
      {children}
    </span>
  );
}

export { badgeVariants };
