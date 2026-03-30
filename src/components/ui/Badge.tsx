import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "warning" | "danger" | "orange" | "default";
}

export function Badge({ className = "", variant = "default", ...props }: BadgeProps) {
  let baseStyles = "inline-flex items-center rounded-[8px] border px-2.5 py-0.5 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400";
  
  switch(variant) {
    case "success":
      baseStyles += " border-[var(--color-success-border)] bg-[var(--color-success-light)] text-[var(--color-success-dark)]";
      break;
    case "warning":
      baseStyles += " border-[var(--color-warning-border)] bg-[var(--color-warning-light)] text-[var(--color-warning-dark)]";
      break;
    case "orange":
      baseStyles += " border-[var(--color-orange-border)] bg-[var(--color-orange-light)] text-[var(--color-orange-dark)]";
      break;
    case "danger":
      baseStyles += " border-[var(--color-danger-border)] bg-[var(--color-danger-light)] text-[var(--color-danger-dark)]";
      break;
    case "default":
      baseStyles += " border-[var(--color-border-slate)] bg-[var(--color-slate-mute)] text-[var(--color-subtle-text)]";
      break;
  }

  return (
    <span className={`${baseStyles} ${className}`} {...props} />
  );
}