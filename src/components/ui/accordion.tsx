"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface AccordionContextValue {
  openItems: string[];
  toggleItem: (id: string) => void;
}

const AccordionContext = React.createContext<AccordionContextValue | null>(null);

export function Accordion({
  children,
  className,
  type = "single",
  defaultValue = [],
}: {
  children: React.ReactNode;
  className?: string;
  type?: "single" | "multiple";
  defaultValue?: string[];
}) {
  const [openItems, setOpenItems] = React.useState<string[]>(defaultValue);

  const toggleItem = (id: string) => {
    setOpenItems((prev) => {
      const isOpen = prev.includes(id);
      if (type === "single") {
        return isOpen ? [] : [id];
      } else {
        return isOpen ? prev.filter((item) => item !== id) : [...prev, id];
      }
    });
  };

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem }}>
      <div className={cn("divide-y divide-neutral-200 border-y border-neutral-200", className)}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

interface AccordionItemContextValue {
  id: string;
  isOpen: boolean;
}

const AccordionItemContext = React.createContext<AccordionItemContextValue | null>(null);

export function AccordionItem({
  id,
  children,
  className,
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  const context = React.useContext(AccordionContext);
  if (!context) {
    throw new Error("AccordionItem must be used within an Accordion.");
  }

  const isOpen = context.openItems.includes(id);

  return (
    <AccordionItemContext.Provider value={{ id, isOpen }}>
      <div className={cn("overflow-hidden", className)}>{children}</div>
    </AccordionItemContext.Provider>
  );
}

export function AccordionTrigger({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const accordionContext = React.useContext(AccordionContext);
  const itemContext = React.useContext(AccordionItemContext);

  if (!accordionContext || !itemContext) {
    throw new Error("AccordionTrigger must be used within AccordionItem.");
  }

  const { id, isOpen } = itemContext;
  const triggerId = `accordion-trigger-${id}`;
  const contentId = `accordion-content-${id}`;

  return (
    <h3>
      <button
        type="button"
        id={triggerId}
        aria-controls={contentId}
        aria-expanded={isOpen}
        onClick={() => accordionContext.toggleItem(id)}
        className={cn(
          "flex w-full items-center justify-between py-4 text-left text-sm font-medium text-neutral-900 transition-all hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950",
          className
        )}
      >
        {children}
        <svg
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-200 text-neutral-500",
            isOpen && "rotate-180"
          )}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </h3>
  );
}

export function AccordionContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const itemContext = React.useContext(AccordionItemContext);

  if (!itemContext) {
    throw new Error("AccordionContent must be used within AccordionItem.");
  }

  const { id, isOpen } = itemContext;
  const triggerId = `accordion-trigger-${id}`;
  const contentId = `accordion-content-${id}`;

  if (!isOpen) return null;

  return (
    <div
      id={contentId}
      role="region"
      aria-labelledby={triggerId}
      className={cn("pb-4 pt-0 text-sm text-neutral-600", className)}
    >
      {children}
    </div>
  );
}
