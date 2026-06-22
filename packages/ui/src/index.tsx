import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { cva } from "class-variance-authority";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ReadonlyArray<string | false | null | undefined>): string {
  return twMerge(clsx(inputs));
}

export type ButtonVariant = "primary" | "secondary" | "danger";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
}

const buttonClassName = cva("tz-button", {
  variants: {
    variant: {
      primary: "tz-button-primary",
      secondary: "tz-button-secondary",
      danger: "tz-button-danger",
    } satisfies Record<ButtonVariant, string>,
  },
  defaultVariants: {
    variant: "primary",
  },
});

export function Button({ className, variant = "primary", type = "button", ...props }: ButtonProps) {
  return <button className={cn(buttonClassName({ variant }), className)} type={type} {...props} />;
}

export interface ShellProps extends HTMLAttributes<HTMLElement> {
  readonly title: string;
  readonly status: string;
  readonly skipLabel?: string;
  readonly children: ReactNode;
}

export function ResponsiveShell({
  title,
  status,
  skipLabel = "Skip to main content",
  children,
  className,
  ...props
}: ShellProps) {
  return (
    <div className={cn("tz-shell", className)} {...props}>
      <a className="tz-skip-link" href="#main-content">
        {skipLabel}
      </a>
      <div className="tz-shell-container">
        <header className="tz-shell-header" role="banner">
          <h1 className="tz-shell-title">{title}</h1>
          <span className="tz-shell-status" role="status">
            {status}
          </span>
        </header>
        <main className="tz-shell-main" id="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
