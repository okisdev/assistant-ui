"use client";

import { useState } from "react";
import {
  Loader2,
  Shield,
  ShieldCheck,
  ShieldOff,
  Copy,
  Check,
  Key,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import QRCode from "qrcode";

import { authClient } from "@/lib/auth.client";
import { api } from "@/utils/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { SettingHeader } from "@/components/dashboard/setting-header";
import { cn } from "@/lib/utils";

function ChangePasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrentPassword(false);
    setShowNewPassword(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    try {
      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: false,
      });

      if (result.error) {
        toast.error(result.error.message || "Failed to change password");
        return;
      }

      toast.success("Password changed successfully");
      resetForm();
      onOpenChange(false);
    } catch {
      toast.error("Failed to change password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) resetForm();
        onOpenChange(newOpen);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>
            Enter your current password and choose a new one.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="current-password">Current Password</Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="new-password">New Password</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Change Password
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SetPasswordDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const setPasswordMutation = api.user.account.setPassword.useMutation();

  const resetForm = () => {
    setNewPassword("");
    setConfirmPassword("");
    setShowNewPassword(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    try {
      await setPasswordMutation.mutateAsync({ newPassword });
      toast.success("Password set successfully");
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to set password",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) resetForm();
        onOpenChange(newOpen);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set Password</DialogTitle>
          <DialogDescription>
            Create a password to sign in with your email address.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="set-new-password">New Password</Label>
            <div className="relative">
              <Input
                id="set-new-password"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="set-confirm-password">Confirm Password</Label>
            <Input
              id="set-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Set Password
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EnableTwoFactorDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState<"password" | "setup" | "verify">("password");
  const [password, setPassword] = useState("");
  const [totpUri, setTotpUri] = useState("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [showManualSetup, setShowManualSetup] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verifyCode, setVerifyCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedBackupCodes, setCopiedBackupCodes] = useState(false);

  const resetForm = () => {
    setStep("password");
    setPassword("");
    setTotpUri("");
    setQrCodeDataUrl("");
    setBackupCodes([]);
    setVerifyCode("");
    setCopiedBackupCodes(false);
    setShowManualSetup(false);
  };

  const getSecretFromUri = (uri: string): string => {
    try {
      const url = new URL(uri);
      return url.searchParams.get("secret") || "";
    } catch {
      return "";
    }
  };

  const handleEnable = async () => {
    if (!password) {
      toast.error("Please enter your password");
      return;
    }

    setIsLoading(true);
    try {
      const result = await authClient.twoFactor.enable({
        password,
      });

      if (result.error) {
        toast.error(result.error.message || "Failed to enable 2FA");
        return;
      }

      if (result.data?.totpURI) {
        setTotpUri(result.data.totpURI);
        const dataUrl = await QRCode.toDataURL(result.data.totpURI);
        setQrCodeDataUrl(dataUrl);
      }

      if (result.data?.backupCodes) {
        setBackupCodes(result.data.backupCodes);
      }

      setStep("setup");
    } catch {
      toast.error("Failed to enable 2FA");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verifyCode || verifyCode.length !== 6) {
      toast.error("Please enter a 6-digit code");
      return;
    }

    setIsLoading(true);
    try {
      const result = await authClient.twoFactor.verifyTotp({
        code: verifyCode,
      });

      if (result.error) {
        toast.error(result.error.message || "Invalid code");
        return;
      }

      toast.success("Two-factor authentication enabled");
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error("Failed to verify code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyBackupCodes = async () => {
    try {
      await navigator.clipboard.writeText(backupCodes.join("\n"));
      setCopiedBackupCodes(true);
      setTimeout(() => setCopiedBackupCodes(false), 2000);
    } catch {
      toast.error("Failed to copy backup codes");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) resetForm();
        onOpenChange(newOpen);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === "password" && "Enable Two-Factor Authentication"}
            {step === "setup" && "Set Up Authenticator"}
            {step === "verify" && "Verify Setup"}
          </DialogTitle>
          <DialogDescription>
            {step === "password" &&
              "Enter your password to enable two-factor authentication."}
            {step === "setup" &&
              "Scan the QR code with your authenticator app and save your backup codes."}
            {step === "verify" &&
              "Enter the 6-digit code from your authenticator app to complete setup."}
          </DialogDescription>
        </DialogHeader>

        {step === "password" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleEnable();
            }}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="2fa-password">Password</Label>
              <Input
                id="2fa-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                Continue
              </Button>
            </DialogFooter>
          </form>
        )}

        {step === "setup" && (
          <div className="flex flex-col gap-4">
            {!showManualSetup && qrCodeDataUrl && (
              <div className="flex flex-col items-center gap-2">
                <div className="rounded-lg bg-white p-4">
                  <img
                    src={qrCodeDataUrl}
                    alt="QR Code for authenticator app"
                    className="size-48"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowManualSetup(true)}
                  className="text-muted-foreground text-xs hover:text-foreground"
                >
                  Can&apos;t scan? Enter code manually
                </button>
              </div>
            )}

            {showManualSetup && totpUri && (
              <div className="flex flex-col gap-2">
                <Label>Secret Key</Label>
                <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
                  <code className="flex-1 break-all font-mono text-xs">
                    {getSecretFromUri(totpUri)}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={async () => {
                      await navigator.clipboard.writeText(
                        getSecretFromUri(totpUri),
                      );
                      toast.success("Secret key copied");
                    }}
                    className="shrink-0"
                  >
                    <Copy className="size-3" />
                  </Button>
                </div>
                <p className="text-muted-foreground text-xs">
                  Enter this key in your authenticator app manually.
                </p>
                <button
                  type="button"
                  onClick={() => setShowManualSetup(false)}
                  className="text-muted-foreground text-xs hover:text-foreground"
                >
                  Show QR code instead
                </button>
              </div>
            )}

            {backupCodes.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label>Backup Codes</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyBackupCodes}
                    className="text-muted-foreground"
                  >
                    {copiedBackupCodes ? (
                      <>
                        <Check className="mr-1 size-3" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1 size-3" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/50 p-3 font-mono text-xs">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="text-center">
                      {code}
                    </div>
                  ))}
                </div>
                <p className="text-muted-foreground text-xs">
                  Save these codes securely. Each code can only be used once.
                </p>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button onClick={() => setStep("verify")}>
                I&apos;ve saved my backup codes
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "verify" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerify();
            }}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="verify-code">Verification Code</Label>
              <Input
                id="verify-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={verifyCode}
                onChange={(e) =>
                  setVerifyCode(e.target.value.replace(/\D/g, ""))
                }
                placeholder="000000"
                className="text-center font-mono text-lg tracking-widest"
                autoComplete="one-time-code"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("setup")}
                disabled={isLoading}
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={isLoading || verifyCode.length !== 6}
              >
                {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                Verify & Enable
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DisableTwoFactorDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setPassword("");
  };

  const handleDisable = async () => {
    if (!password) {
      toast.error("Please enter your password");
      return;
    }

    setIsLoading(true);
    try {
      const result = await authClient.twoFactor.disable({
        password,
      });

      if (result.error) {
        toast.error(result.error.message || "Failed to disable 2FA");
        return;
      }

      toast.success("Two-factor authentication disabled");
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error("Failed to disable 2FA");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) resetForm();
        onOpenChange(newOpen);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Disable Two-Factor Authentication?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This will make your account less secure. You&apos;ll only need your
            password to sign in.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-2 py-2">
          <Label htmlFor="disable-2fa-password">Password</Label>
          <Input
            id="disable-2fa-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDisable}
            disabled={isLoading || !password}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
            Disable 2FA
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function SecuritySettings() {
  const { data: session } = authClient.useSession();
  const { data: hasPassword, isLoading } =
    api.user.account.hasPassword.useQuery();

  const [changePasswordDialogOpen, setChangePasswordDialogOpen] =
    useState(false);
  const [setPasswordDialogOpen, setSetPasswordDialogOpen] = useState(false);
  const [enableTwoFactorDialogOpen, setEnableTwoFactorDialogOpen] =
    useState(false);
  const [disableTwoFactorDialogOpen, setDisableTwoFactorDialogOpen] =
    useState(false);

  const twoFactorEnabled = session?.user?.twoFactorEnabled;

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="flex flex-col gap-4">
      <SettingHeader title="Security" />

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3 transition-colors duration-200 hover:bg-muted">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted/50">
              <Key className="size-5 text-muted-foreground" />
            </div>
            <div>
              {isLoading ? (
                <>
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                  <div className="mt-1.5 h-3 w-48 animate-pulse rounded bg-muted" />
                </>
              ) : (
                <>
                  <div className="font-medium text-sm">
                    {hasPassword ? "Password" : "No password set"}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {hasPassword
                      ? "You can sign in with your email and password"
                      : "Set a password to sign in without social accounts"}
                  </div>
                </>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="h-8 w-20 animate-pulse rounded bg-muted" />
          ) : hasPassword ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setChangePasswordDialogOpen(true)}
              >
                Change
              </Button>
              <ChangePasswordDialog
                open={changePasswordDialogOpen}
                onOpenChange={setChangePasswordDialogOpen}
              />
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSetPasswordDialogOpen(true)}
              >
                Set Password
              </Button>
              <SetPasswordDialog
                open={setPasswordDialogOpen}
                onOpenChange={setSetPasswordDialogOpen}
                onSuccess={handleRefresh}
              />
            </>
          )}
        </div>

        <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3 transition-colors duration-200 hover:bg-muted">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex size-10 items-center justify-center rounded-full",
                twoFactorEnabled ? "bg-emerald-500/10" : "bg-muted/50",
              )}
            >
              {twoFactorEnabled ? (
                <ShieldCheck className="size-5 text-emerald-500" />
              ) : (
                <Shield className="size-5 text-muted-foreground" />
              )}
            </div>
            <div>
              {isLoading ? (
                <>
                  <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                  <div className="mt-1.5 h-3 w-48 animate-pulse rounded bg-muted" />
                </>
              ) : (
                <>
                  <div className="font-medium text-sm">
                    Two-factor authentication
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {twoFactorEnabled
                      ? "Your account is protected with 2FA"
                      : !hasPassword
                        ? "Set a password to enable 2FA for this app"
                        : "Add an extra layer of security to your account"}
                  </div>
                </>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="h-8 w-20 animate-pulse rounded bg-muted" />
          ) : !hasPassword ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSetPasswordDialogOpen(true)}
            >
              Set password first
            </Button>
          ) : twoFactorEnabled ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDisableTwoFactorDialogOpen(true)}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <ShieldOff className="mr-1 size-3" />
                Disable
              </Button>
              <DisableTwoFactorDialog
                open={disableTwoFactorDialogOpen}
                onOpenChange={setDisableTwoFactorDialogOpen}
                onSuccess={handleRefresh}
              />
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEnableTwoFactorDialogOpen(true)}
              >
                Enable
              </Button>
              <EnableTwoFactorDialog
                open={enableTwoFactorDialogOpen}
                onOpenChange={setEnableTwoFactorDialogOpen}
                onSuccess={handleRefresh}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
