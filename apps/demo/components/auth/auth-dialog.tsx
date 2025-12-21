"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { AuthForm } from "@/components/auth/form";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogTitle className="sr-only">Auth Dialog</DialogTitle>
        <AuthForm onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
