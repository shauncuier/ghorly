import { cn } from "@/lib/cn";

export interface InputProps extends React.ComponentProps<"input"> {
  /** Rendered inside the field, before the text. Decorative only. */
  iconStart?: React.ReactNode;
  iconEnd?: React.ReactNode;
  invalid?: boolean;
}

export function Input({
  className,
  iconStart,
  iconEnd,
  invalid,
  ...props
}: InputProps) {
  const field = (
    <input
      aria-invalid={invalid || undefined}
      className={cn(
        "h-11 w-full rounded-md border border-border bg-surface px-3.5 text-base text-fg",
        "placeholder:text-fg-disabled",
        "transition-[border-color,box-shadow] duration-(--duration-fast) ease-(--ease-standard)",
        "hover:border-border-strong",
        "focus:border-border-focus focus:shadow-focus focus:outline-none",
        "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-fg-disabled",
        "aria-invalid:border-danger-500 aria-invalid:focus:shadow-none",
        iconStart && "pl-10",
        iconEnd && "pr-10",
        className,
      )}
      {...props}
    />
  );

  if (!iconStart && !iconEnd) return field;

  return (
    <div className="relative">
      {iconStart && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-tertiary [&_svg]:size-4.5"
        >
          {iconStart}
        </span>
      )}
      {field}
      {iconEnd && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-fg-tertiary [&_svg]:size-4.5"
        >
          {iconEnd}
        </span>
      )}
    </div>
  );
}
