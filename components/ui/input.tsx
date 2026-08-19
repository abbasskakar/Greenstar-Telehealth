"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, trailing, ...props }, ref) => (
    <div
      className={cn(
        "flex h-12 items-center gap-2.5 rounded-xl border border-border-strong bg-surface px-3.5 transition-[border-color,box-shadow] focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/25",
        className,
      )}
    >
      {icon && <span className="shrink-0 text-muted">{icon}</span>}
      <input
        ref={ref}
        className="min-w-0 flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-2/55"
        {...props}
      />
      {trailing}
    </div>
  ),
);
Input.displayName = "Input";

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "mb-1.5 block text-sm font-semibold text-foreground",
        className,
      )}
      {...props}
    />
  );
}
