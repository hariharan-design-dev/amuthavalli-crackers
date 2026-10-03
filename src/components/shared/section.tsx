import * as React from "react";
import { cn } from "@/lib/utils";

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
}

export function Section({
  as: Component = "section",
  className,
  children,
  ...props
}: SectionProps) {
  return (
    <Component
      className={cn("w-full py-8 sm:py-12 lg:py-16", className)}
      {...props}
    >
      {children}
    </Component>
  );
}
