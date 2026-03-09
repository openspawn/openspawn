import type { ReactNode, ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";

export enum ButtonVariant {
  Primary = "primary",
  Ghost = "ghost",
  Neutral = "neutral",
}

export enum ButtonSize {
  Sm = "sm",
  Md = "md",
  Lg = "lg",
}

interface ButtonBaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: ReactNode;
  className?: string;
}

// Omit 'children' from HTML attrs to avoid conflict with our typed `children`
type ButtonProps = ButtonBaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & { as?: "button" };

type AnchorProps = ButtonBaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children"> & { as: "a"; href: string };

type Props = ButtonProps | AnchorProps;

const variantStyles: Record<ButtonVariant, string> = {
  [ButtonVariant.Primary]:
    "bg-cyan-500 text-navy-950 font-semibold " +
    "hover:bg-cyan-400 hover:shadow-[0_0_10px_rgba(6,182,212,0.20)] " +
    "active:bg-cyan-600 " +
    "focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 " +
    "focus-visible:ring-offset-navy-950 focus-visible:outline-none",
  [ButtonVariant.Ghost]:
    "bg-cyan-500/10 text-cyan-400 font-medium ring-1 ring-cyan-500/20 " +
    "hover:bg-cyan-500/20 " +
    "active:bg-cyan-500/30 " +
    "focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 " +
    "focus-visible:ring-offset-navy-950 focus-visible:outline-none",
  [ButtonVariant.Neutral]:
    "bg-white/5 text-slate-200 font-medium border border-white/10 " +
    "hover:bg-white/[0.08] " +
    "active:bg-white/[0.12] " +
    "focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 " +
    "focus-visible:ring-offset-navy-950 focus-visible:outline-none",
};

const sizeStyles: Record<ButtonSize, string> = {
  [ButtonSize.Sm]: "px-4 py-2 text-sm rounded-lg",
  [ButtonSize.Md]: "px-6 py-3 text-base rounded-xl",
  [ButtonSize.Lg]: "px-8 py-3.5 text-lg rounded-xl",
};

const baseStyles =
  "inline-flex items-center justify-center gap-2 transition-all duration-150 no-underline";

function classes(variant: ButtonVariant, size: ButtonSize, extra: string) {
  return `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${extra}`;
}

/**
 * Button — unified interactive element with consistent variants and sizes.
 *
 * Usage:
 *   <Button variant="primary" size="md">Get Started →</Button>
 *   <Button as="a" href="/docs" variant="ghost">Read Docs</Button>
 *   <Button variant="neutral" size="sm">GitHub ↗</Button>
 */
export function Button(props: Props) {
  const {
    variant = ButtonVariant.Primary,
    size = ButtonSize.Md,
    children,
    className = "",
    as: tag,
  } = props;

  if (tag === "a") {
    const {
      as: _as,
      variant: _v,
      size: _s,
      children: _c,
      className: _cl,
      ...rest
    } = props as AnchorProps;
    return (
      <a className={classes(variant, size, className)} {...rest}>
        {children}
      </a>
    );
  }

  const {
    as: _as,
    variant: _v,
    size: _s,
    children: _c,
    className: _cl,
    ...rest
  } = props as ButtonProps;
  return (
    <button type="button" className={classes(variant, size, className)} {...rest}>
      {children}
    </button>
  );
}
