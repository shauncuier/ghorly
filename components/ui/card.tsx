import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const cardVariants = cva("rounded-lg bg-surface", {
  variants: {
    variant: {
      bordered: "border border-border",
      raised: "border border-border-subtle shadow-sm",
      flat: "",
      muted: "bg-surface-muted",
    },
    /** Lift on hover. Only for cards that are themselves a link or button. */
    interactive: {
      true: [
        "transition-[box-shadow,border-color,transform] duration-(--duration-base) ease-(--ease-standard)",
        "hover:-translate-y-0.5 hover:shadow-md hover:border-border-strong",
        "focus-within:-translate-y-0.5 focus-within:shadow-md",
      ],
    },
  },
  defaultVariants: { variant: "bordered" },
});

export interface CardProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof cardVariants> {}

export function Card({ className, variant, interactive, ...props }: CardProps) {
  return (
    <div className={cn(cardVariants({ variant, interactive }), className)} {...props} />
  );
}

export function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex items-start justify-between gap-4 px-5 pt-5 pb-4", className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return <h3 className={cn("text-base font-semibold text-fg", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-sm text-fg-secondary", className)} {...props} />;
}

export function CardBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("px-5 pb-5", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 border-t border-border-subtle px-5 py-4",
        className,
      )}
      {...props}
    />
  );
}
