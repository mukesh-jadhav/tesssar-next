"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

export const Tabs = TabsPrimitive.Root;

export const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-11 items-center justify-start gap-1 rounded-xl border bg-card/60 p-1 text-muted-foreground overflow-x-auto scrollbar-thin backdrop-blur supports-[backdrop-filter]:bg-card/40",
      className,
    )}
    {...props}
  />
));
TabsList.displayName = "TabsList";

export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "group/tab relative inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3.5 py-1.5 text-sm font-medium ring-offset-background transition-colors duration-200 ease-out-quart focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:text-foreground/80 data-[state=active]:text-foreground",
      className,
    )}
    {...props}
  >
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 rounded-lg bg-background opacity-0 shadow-[0_1px_0_hsl(var(--border)),0_4px_10px_-4px_hsl(var(--foreground)/0.08)] transition-opacity duration-300 ease-out-quart group-data-[state=active]/tab:opacity-100"
    />
    <span className="relative z-10 inline-flex items-center gap-1.5">{children}</span>
  </TabsPrimitive.Trigger>
));
TabsTrigger.displayName = "TabsTrigger";

export const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-6 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=active]:animate-reveal-up",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = "TabsContent";
