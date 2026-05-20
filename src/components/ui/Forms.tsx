import React from "react";
import { cn } from "../../lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { label?: string, helper?: string }>(
  ({ className, label, helper, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && <label className="text-sm font-medium text-zinc-300 ml-1">{label}</label>}
        <input
          ref={ref}
          className={cn(
            "w-full bg-zinc-900/50 border border-zinc-800 text-white rounded-xl px-4 py-3",
            "focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition-all",
            "placeholder:text-zinc-600",
            className
          )}
          {...props}
        />
        {helper && <span className="text-xs text-zinc-500 ml-1">{helper}</span>}
      </div>
    );
  }
);
Input.displayName = "Input";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }>(
  ({ className, label, children, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && <label className="text-sm font-medium text-zinc-300 ml-1">{label}</label>}
        <select
          ref={ref}
          className={cn(
            "w-full bg-zinc-900/50 border border-zinc-800 text-white rounded-xl px-4 py-3 appearance-none",
            "focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition-all",
            className
          )}
          {...props}
        >
          {children}
        </select>
      </div>
    );
  }
);
Select.displayName = "Select";
