import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DetailPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function DetailPanel({ open, onOpenChange, title, description, children, footer }: DetailPanelProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex flex-col top-0 left-auto right-0 bottom-0 h-dvh w-full max-w-none translate-x-0 translate-y-0 gap-0 rounded-none p-0 sm:max-w-xl sm:rounded-l-xl data-open:zoom-in-100 data-closed:zoom-out-100 data-open:slide-in-from-right data-closed:slide-out-to-right"
      >
        <DialogHeader className="gap-1 border-b p-4 pr-12">
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
        {footer && <div className="border-t p-4">{footer}</div>}
      </DialogContent>
    </Dialog>
  );
}
