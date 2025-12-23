"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ghost, X } from "lucide-react";
import { useAssistantState } from "@assistant-ui/react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useIncognitoOptional } from "@/contexts/incognito-provider";
import { cn } from "@/lib/utils";

export function IncognitoToggle() {
  const router = useRouter();
  const incognito = useIncognitoOptional();
  const isEmpty = useAssistantState(({ thread }) => thread.isEmpty);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!incognito) return null;

  const { isIncognito, enableIncognito, disableIncognito } = incognito;

  const handleToggle = () => {
    if (isIncognito) {
      if (!isEmpty) {
        setShowConfirm(true);
      } else {
        disableIncognito();
        router.push("/");
      }
    } else {
      if (!isEmpty) {
        setShowConfirm(true);
      } else {
        enableIncognito();
        router.push("/");
      }
    }
  };

  const handleConfirm = () => {
    if (isIncognito) {
      disableIncognito();
    } else {
      enableIncognito();
    }
    setShowConfirm(false);
    router.push("/");
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleToggle}
            className={cn(
              isIncognito && "bg-muted text-foreground hover:bg-muted/80",
            )}
          >
            {isIncognito ? (
              <X className="size-4" />
            ) : (
              <Ghost className="size-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isIncognito ? "Exit incognito mode" : "Start incognito chat"}
        </TooltipContent>
      </Tooltip>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isIncognito ? "Exit incognito mode?" : "Start incognito chat?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isIncognito
                ? "Your incognito conversation will be permanently deleted and cannot be recovered."
                : "Your current conversation will be saved. A new incognito chat will start that won't be saved to your history or memory."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              {isIncognito ? "Exit" : "Start incognito"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
