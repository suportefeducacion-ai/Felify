import React from "react";
import { cn } from "../../lib/utils";

export const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("glass-card p-5", className)}>
    {children}
  </div>
);

export const Header = ({ title, subtitle, action }: { title: string, subtitle?: string, action?: React.ReactNode }) => (
  <header className="flex items-center justify-between py-6 px-4 lg:px-8 max-w-7xl mx-auto w-full">
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-white mb-0.5">{title}</h1>
      {subtitle && <p className="text-sm text-zinc-400">{subtitle}</p>}
    </div>
    {action && <div>{action}</div>}
  </header>
);
