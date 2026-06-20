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

const buttonClassName = cva(
  "inline-flex min-h-11 items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
  {
    variants: {
      variant: {
        primary: "bg-brand-blue text-white hover:bg-blue-700 focus-visible:outline-brand-orange",
        secondary:
          "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50 focus-visible:outline-brand-blue",
        danger: "bg-brand-danger text-white hover:bg-red-700 focus-visible:outline-brand-orange",
      } satisfies Record<ButtonVariant, string>,
    },
    defaultVariants: {
      variant: "primary",
    },
  },
);

export function Button({ className, variant = "primary", type = "button", ...props }: ButtonProps) {
  return <button className={cn(buttonClassName({ variant }), className)} type={type} {...props} />;
}

export interface ShellProps extends HTMLAttributes<HTMLElement> {
  readonly title: string;
  readonly status: string;
  readonly children: ReactNode;
}

export function ResponsiveShell({ title, status, children, className, ...props }: ShellProps) {
  return (
    <main className={cn("min-h-dvh bg-app-background text-app-text", className)} {...props}>
      <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <h1 className="text-xl font-bold">{title}</h1>
          <span className="rounded-md bg-white px-3 py-1 text-xs font-semibold text-brand-success shadow-sm">
            {status}
          </span>
        </header>
        <div className="flex flex-1 flex-col py-6">{children}</div>
      </div>
    </main>
  );
}
