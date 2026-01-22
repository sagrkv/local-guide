"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  external?: boolean;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--accent)] text-[var(--background)] hover:bg-[#e88800] active:scale-[0.98]",
  secondary:
    "bg-transparent border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--background)]",
  ghost:
    "bg-transparent text-white underline underline-offset-4 hover:text-[var(--accent)]",
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
};

const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      href,
      external,
      disabled,
      loading,
      className = "",
      onClick,
      type = "button",
    },
    ref
  ) => {
    const baseClasses = `
      inline-flex items-center justify-center gap-2
      font-semibold rounded-lg
      transition-all duration-300 ease-out
      disabled:opacity-50 disabled:cursor-not-allowed
      ${variants[variant]}
      ${sizes[size]}
      ${className}
    `;

    const content = (
      <>
        {loading && (
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
          />
        )}
        {children}
        {variant !== "ghost" && !loading && (
          <motion.span
            initial={{ x: 0 }}
            whileHover={{ x: 4 }}
            transition={{ duration: 0.2 }}
          >
            →
          </motion.span>
        )}
      </>
    );

    if (href) {
      if (external) {
        return (
          <a
            ref={ref as React.Ref<HTMLAnchorElement>}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={baseClasses}
          >
            {content}
          </a>
        );
      }
      return (
        <Link
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={baseClasses}
        >
          {content}
        </Link>
      );
    }

    return (
      <motion.button
        ref={ref as React.Ref<HTMLButtonElement>}
        type={type}
        disabled={disabled || loading}
        onClick={onClick}
        className={baseClasses}
        whileTap={{ scale: 0.98 }}
      >
        {content}
      </motion.button>
    );
  }
);

Button.displayName = "Button";

export default Button;
