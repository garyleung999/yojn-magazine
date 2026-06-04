import * as React from "react";

// Minimal stub to satisfy the import in hooks/use-toast.ts
export interface ToastProps {
  id?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  [key: string]: any;
}

export type ToastActionElement = React.ReactElement;
