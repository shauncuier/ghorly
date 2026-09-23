"use client";

import { Search, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { ARIA, COMMON } from "@/lib/strings";

export interface SearchInputProps
  extends Omit<React.ComponentProps<"input">, "onChange" | "value" | "size"> {
  value: string;
  onValueChange: (value: string) => void;
  onClear?: () => void;
  size?: "sm" | "md" | "lg";
}

export function SearchInput({
  value,
  onValueChange,
  onClear,
  size = "md",
  className,
  placeholder = COMMON.searchPlaceholder,
  "aria-label": ariaLabel,
  ...props
}: SearchInputProps) {
  return (
    <div className="relative">
      <Search
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-tertiary",
          size === "lg" ? "size-5" : "size-4.5",
        )}
      />
      <input
        type="search"
        // The accessible name has to live on the control itself — a sibling
        // sr-only span is not associated with it.
        aria-label={ariaLabel ?? placeholder ?? ARIA.search}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onValueChange(e.target.value)}
        className={cn(
          "w-full rounded-md border border-border bg-surface pl-11 text-fg",
          "placeholder:text-fg-disabled",
          "transition-[border-color,box-shadow] duration-(--duration-fast) ease-(--ease-standard)",
          "hover:border-border-strong",
          "focus:border-border-focus focus:shadow-focus focus:outline-none",
          // The native clear affordance is a Latin-styled "x" we can't restyle.
          "[&::-webkit-search-cancel-button]:appearance-none",
          value ? "pr-11" : "pr-3.5",
          size === "sm" && "h-[2.375rem] text-sm",
          size === "md" && "h-11 text-base",
          size === "lg" && "h-14 text-base",
          className,
        )}
        {...props}
      />
      {value && (
        <button
          type="button"
          aria-label="খালি করুন"
          onClick={() => {
            onValueChange("");
            onClear?.();
          }}
          className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-fg-tertiary transition-colors hover:bg-ink-100 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
