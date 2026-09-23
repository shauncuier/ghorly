import { cn } from "@/lib/cn";

export interface TextareaProps extends React.ComponentProps<"textarea"> {
  invalid?: boolean;
}

export function Textarea({ className, invalid, ...props }: TextareaProps) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={cn(
        "min-h-28 w-full resize-y rounded-md border border-border bg-surface px-3.5 py-3 text-base text-fg",
        "placeholder:text-fg-disabled",
        "transition-[border-color,box-shadow] duration-(--duration-fast) ease-(--ease-standard)",
        "hover:border-border-strong",
        "focus:border-border-focus focus:shadow-focus focus:outline-none",
        "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-fg-disabled",
        "aria-invalid:border-danger-500 aria-invalid:focus:shadow-none",
        className,
      )}
      {...props}
    />
  );
}
