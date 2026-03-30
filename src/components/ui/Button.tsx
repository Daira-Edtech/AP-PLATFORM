import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", ...props }, ref) => {
    let baseStyles = "inline-flex items-center justify-center font-bold tracking-tight transition-colors focus:outline-none focus:ring-2 disabled:opacity-50 disabled:pointer-events-none";
    
    // Size variants
    switch (size) {
      case "sm":
        baseStyles += " h-9 px-4 text-xs rounded-lg";
        break;
      case "md":
        baseStyles += " h-11 px-6 text-sm rounded-2xl"; // matching 16px radius logic
        break;
      case "lg":
        baseStyles += " h-14 px-8 text-base rounded-[18px]";
        break;
    }

    // Color variants mapping to globals.css CSS Variables
    switch (variant) {
      case "primary":
        // Deep Black primary button from spec
        baseStyles += " bg-[var(--color-black-btn)] text-white hover:bg-black/80";
        break;
      case "secondary":
        // Action blue
        baseStyles += " bg-[var(--color-action-solid)] text-white hover:bg-[var(--color-action-hover)]";
        break;
      case "danger":
        baseStyles += " bg-[var(--color-danger-dark)] text-white hover:bg-[var(--color-danger-text)]";
        break;
      case "outline":
        baseStyles += " border-2 border-[var(--color-border-slate)] text-[var(--color-dark-slate)] hover:bg-[var(--color-slate-light)]";
        break;
      case "ghost":
        baseStyles += " text-[var(--color-dark-slate)] hover:bg-[var(--color-slate-light)]";
        break;
    }

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${className}`}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
