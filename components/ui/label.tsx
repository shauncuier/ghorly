import { cn } from "@/lib/cn";
import { COMMON } from "@/lib/strings";

export interface LabelProps extends React.ComponentProps<"label"> {
  required?: boolean;
  optional?: boolean;
}

export function Label({
  className,
  required,
  optional,
  children,
  ...props
}: LabelProps) {
  return (
    <label
      className={cn("flex items-center gap-1.5 text-sm font-medium text-fg", className)}
      {...props}
    >
      {children}
      {required && (
        <span className="text-danger-600" aria-hidden="true">
          *
        </span>
      )}
      {optional && (
        <span className="text-xs font-normal text-fg-tertiary">({COMMON.optional})</span>
      )}
    </label>
  );
}
