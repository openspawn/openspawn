import { useState } from "react";
import { Shield, Smartphone, Key, Loader2, Check, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { useAuth } from "../../contexts";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export function SecuritySettings() {
  const { user, token, refreshUser } = useAuth();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isEnabling2FA, setIsEnabling2FA] = useState(false);
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [twoFaStatus, setTwoFaStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: "error", message: "Passwords don't match" });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordStatus({ type: "error", message: "Password must be at least 8 characters" });
      return;
    }

    setIsChangingPassword(true);
    setPasswordStatus(null);

    try {
      const response = await fetch(`${API_URL}/auth/password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to change password");
      }

      setPasswordStatus({ type: "success", message: "Password updated successfully" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setPasswordStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to change password",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleToggle2FA = async () => {
    setIsEnabling2FA(true);
    setTwoFaStatus(null);

    try {
      if (user?.totpEnabled) {
        // Disable 2FA - need to show a dialog for password and code
        // For now, just show a message
        setTwoFaStatus({ type: "error", message: "To disable 2FA, use the /auth/totp/disable endpoint with password and TOTP code" });
      } else {
        // Enable 2FA
        const response = await fetch(`${API_URL}/auth/totp/setup`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ password: currentPassword || "temp" }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to setup 2FA");
        }

        const data = await response.json();
        // In a real implementation, show the QR code and recovery codes
        setTwoFaStatus({ type: "success", message: "2FA setup initiated. Check your authenticator app." });
        await refreshUser?.();
      }
    } catch (error) {
      setTwoFaStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to toggle 2FA",
      });
    } finally {
      setIsEnabling2FA(false);
    }
  };

  const handleLogoutAll = async () => {
    setIsLoggingOutAll(true);
    try {
      await fetch(`${API_URL}/auth/logout-all`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // Note: This will log out the current session too
      window.location.href = "/login";
    } catch {
      setIsLoggingOutAll(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Password Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Password
          </CardTitle>
          <CardDescription>
            Change your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
          </div>
          {passwordStatus && (
            <div
              className={`flex items-center gap-2 rounded-md p-3 text-sm ${
                passwordStatus.type === "success"
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "bg-red-500/10 text-red-500"
              }`}
            >
              {passwordStatus.type === "success" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              {passwordStatus.message}
            </div>
          )}
          <Button onClick={handleChangePassword} disabled={isChangingPassword}>
            {isChangingPassword ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Shield className="mr-2 h-4 w-4" />
            )}
            Update Password
          </Button>
        </CardContent>
      </Card>

      {/* 2FA Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`rounded-full p-2 ${user?.totpEnabled ? 'bg-emerald-500/10' : 'bg-muted'}`}>
                {user?.totpEnabled ? (
                  <Check className="h-5 w-5 text-emerald-500" />
                ) : (
                  <X className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="font-medium">
                  {user?.totpEnabled ? "Enabled" : "Disabled"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {user?.totpEnabled
                    ? "Your account is protected with 2FA"
                    : "Enable 2FA for additional security"}
                </p>
              </div>
            </div>
            <Button
              variant={user?.totpEnabled ? "destructive" : "default"}
              onClick={handleToggle2FA}
              disabled={isEnabling2FA}
            >
              {isEnabling2FA ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : user?.totpEnabled ? (
                "Disable 2FA"
              ) : (
                "Enable 2FA"
              )}
            </Button>
          </div>
          {twoFaStatus && (
            <div
              className={`mt-4 flex items-center gap-2 rounded-md p-3 text-sm ${
                twoFaStatus.type === "success"
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "bg-red-500/10 text-red-500"
              }`}
            >
              {twoFaStatus.type === "success" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              {twoFaStatus.message}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sessions Section */}
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>
            Manage your active login sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Current Session</p>
                <p className="text-sm text-muted-foreground">
                  This browser · Last active now
                </p>
              </div>
              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-500">
                Active
              </span>
            </div>
          </div>
          <Button variant="outline" className="mt-4" onClick={handleLogoutAll} disabled={isLoggingOutAll}>
            {isLoggingOutAll ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Sign Out All Sessions
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
