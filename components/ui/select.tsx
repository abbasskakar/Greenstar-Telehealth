"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <div className="relative">
    <select
      ref={ref}
      className={cn(
        "h-12 w-full appearance-none rounded-xl border border-border-strong bg-surface px-3.5 pr-10 text-[15px] text-foreground outline-none transition-[border-color,box-shadow] focus:border-primary focus:ring-2 focus:ring-primary/25",
        className,
      )}
      {...props}
    >
      {children}
    </select>
    <ChevronDown
      size={18}
      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
    />
  </div>
));
Select.displayName = "Select";
