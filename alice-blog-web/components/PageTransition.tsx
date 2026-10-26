import { ReactNode } from "react";

/**
 * Lightweight page wrapper: a single 180ms opacity animation, no spring
 * physics, no persistent client component, no layout shift.
 */
export default function PageTransition({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`page-enter ${className}`}>{children}</div>;
}
