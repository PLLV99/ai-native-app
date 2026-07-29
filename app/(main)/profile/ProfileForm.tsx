"use client"

import { useState } from "react"
import { authClient, useSession } from "@/lib/auth-client"
import {
    User, Mail, Save, Loader2, CheckCircle, AlertCircle,
    Lock, Eye, EyeOff, ShieldCheck, ShieldOff, QrCode, Copy, KeyRound,
    MailCheck, MailX, Send
} from "lucide-react"
import Image from "next/image"
import QRCode from "qrcode"

export default function ProfileForm() {
    const { data: session, isPending } = useSession()

    // ── Profile State ──────────────────────────────────────
    const [name, setName] = useState("")
    const [nameInitialized, setNameInitialized] = useState(false)
    const [saving, setSaving] = useState(false)
    const [success, setSuccess] = useState("")
    const [error, setError] = useState("")

    // ── Email Verification State ───────────────────────────
    const [emailVerifySending, setEmailVerifySending] = useState(false)
    const [emailVerifySuccess, setEmailVerifySuccess] = useState("")
    const [emailVerifyError, setEmailVerifyError] = useState("")

    // ── Password State ─────────────────────────────────────
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [passwordSaving, setPasswordSaving] = useState(false)
    const [passwordSuccess, setPasswordSuccess] = useState("")
    const [passwordError, setPasswordError] = useState("")

    // ── TOTP State ─────────────────────────────────────────
    const [totpStep, setTotpStep] = useState<"idle" | "setup" | "verify" | "done">("idle")
    const [totpPassword, setTotpPassword] = useState("")
    const [showTotpPassword, setShowTotpPassword] = useState(false)
    const [qrDataUrl, setQrDataUrl] = useState("")
    const [totpUri, setTotpUri] = useState("")
    const [backupCodes, setBackupCodes] = useState<string[]>([])
    const [verifyCode, setVerifyCode] = useState("")
    const [totpLoading, setTotpLoading] = useState(false)
    const [totpError, setTotpError] = useState("")
    const [totpSuccess, setTotpSuccess] = useState("")
    const [disablePassword, setDisablePassword] = useState("")
    const [showDisablePassword, setShowDisablePassword] = useState(false)
    const [disableLoading, setDisableLoading] = useState(false)

    // ── Initialize name from session ───────────────────────
    if (session && !nameInitialized) {
        setName(session.user?.name || "")
        setNameInitialized(true)
    }

    // ── Handlers ───────────────────────────────────────────
    const handleUpdateProfile = async () => {
        if (!name.trim()) {
            setError("Please enter your name")
            return
        }

        setSaving(true)
        setError("")
        setSuccess("")

        try {
            const res = await authClient.updateUser({
                name: name.trim(),
            })

            if (res.error) {
                setError(res.error.message || "An error occurred")
            } else {
                setSuccess("Profile updated successfully!")
                setTimeout(() => {
                    setSuccess("")
                }, 3000)
            }
        } catch {
            setError("An error occurred while updating")
        } finally {
            setSaving(false)
        }
    }

    // ── Email Verification Handler ─────────────────────────
    const handleSendVerificationEmail = async () => {
        setEmailVerifySending(true)
        setEmailVerifyError("")
        setEmailVerifySuccess("")

        try {
            const res = await authClient.sendVerificationEmail({
                email: session?.user?.email || "",
                callbackURL: "/auth/verify-email",
            })

            if (res.error) {
                setEmailVerifyError(res.error.message || "An error occurred")
            } else {
                setEmailVerifySuccess("Verification email sent! Please check your inbox.")
                setTimeout(() => {
                    setEmailVerifySuccess("")
                }, 5000)
            }
        } catch {
            setEmailVerifyError("An error occurred while sending email")
        } finally {
            setEmailVerifySending(false)
        }
    }

    const handleChangePassword = async () => {
        setPasswordError("")
        setPasswordSuccess("")

        if (!currentPassword) {
            setPasswordError("Please enter current password")
            return
        }
        if (!newPassword) {
            setPasswordError("Please enter new password")
            return
        }
        if (newPassword.length < 8) {
            setPasswordError("New password must be at least 8 characters")
            return
        }
        if (newPassword !== confirmPassword) {
            setPasswordError("New passwords do not match")
            return
        }

        setPasswordSaving(true)

        try {
            const res = await authClient.changePassword({
                currentPassword,
                newPassword,
                revokeOtherSessions: true,
            })

            if (res.error) {
                setPasswordError(res.error.message || "An error occurred")
            } else {
                setPasswordSuccess("Password changed successfully!")
                setCurrentPassword("")
                setNewPassword("")
                setConfirmPassword("")
                setTimeout(() => {
                    setPasswordSuccess("")
                }, 3000)
            }
        } catch {
            setPasswordError("An error occurred while changing password")
        } finally {
            setPasswordSaving(false)
        }
    }

    // ── TOTP Handlers ──────────────────────────────────────
    const handleEnableTotp = async () => {
        if (!totpPassword) {
            setTotpError("Please enter your password to enable 2FA")
            return
        }

        setTotpLoading(true)
        setTotpError("")

        try {
            const res = await authClient.twoFactor.enable({
                password: totpPassword,
            })

            if (res.error) {
                if (res.error.code === "INVALID_PASSWORD") {
                    setTotpError("Incorrect password")
                    return
                }
                setTotpError(res.error.message || "An error occurred")
                return
            }

            if (res.data?.totpURI) {
                const dataUrl = await QRCode.toDataURL(res.data.totpURI, {
                    width: 200,
                    margin: 2,
                    color: { dark: "#000000", light: "#ffffff" },
                })
                setQrDataUrl(dataUrl)
                setTotpUri(res.data.totpURI)
                setBackupCodes(res.data.backupCodes ?? [])
                setTotpStep("verify")
            }
        } catch {
            setTotpError("An error occurred while enabling 2FA")
        } finally {
            setTotpLoading(false)
        }
    }

    const handleVerifyTotp = async () => {
        if (!verifyCode || verifyCode.length !== 6) {
            setTotpError("Please enter the 6-digit code from your Authenticator app")
            return
        }

        setTotpLoading(true)
        setTotpError("")

        try {
            const res = await authClient.twoFactor.verifyTotp({
                code: verifyCode,
            })

            if (res.error) {
                if (res.error.code === "INVALID_CODE") {
                    setTotpError("Invalid 2FA code")
                    return
                }
                setTotpError(res.error.message || "Invalid code")
                return
            }

            setTotpSuccess("2FA enabled successfully!")
            setTotpStep("done")
            setTimeout(() => {
                setTotpSuccess("")
                setTotpStep("idle")
                setTotpPassword("")
                setVerifyCode("")
                setQrDataUrl("")
                setTotpUri("")
            }, 5000)
        } catch {
            setTotpError("An error occurred during verification")
        } finally {
            setTotpLoading(false)
        }
    }

    const handleDisableTotp = async () => {
        if (!disablePassword) {
            setTotpError("Please enter your password to disable 2FA")
            return
        }

        setDisableLoading(true)
        setTotpError("")

        try {
            const res = await authClient.twoFactor.disable({
                password: disablePassword,
            })

            if (res.error) {
                if (res.error.code === "INVALID_PASSWORD") {
                    setTotpError("Incorrect password")
                    return
                }
                setTotpError(res.error.message || "An error occurred")
                return
            }

            setTotpSuccess("2FA disabled successfully!")
            setDisablePassword("")
            setTimeout(() => {
                setTotpSuccess("")
            }, 3000)
        } catch {
            setTotpError("An error occurred while disabling 2FA")
        } finally {
            setDisableLoading(false)
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
    }

    // ── Loading ────────────────────────────────────────────
    if (isPending) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
        )
    }

    if (!session) return null

    const initials = (session.user?.name || "U")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)

    const userRole = (session.user as { role?: string })?.role || "user"
    const isTwoFactorEnabled = (session.user as { twoFactorEnabled?: boolean })?.twoFactorEnabled === true
    const isEmailVerified = (session.user as { emailVerified?: boolean })?.emailVerified === true

    // ── Render ─────────────────────────────────────────────
    return (
        <div className="mx-auto max-w-2xl space-y-6">
            {/* ── Profile Card ── */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                    <User className="w-5 h-5 text-purple-500" />
                    Profile Information
                </h2>

                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
                    {session.user?.image ? (
                        <Image
                            src={session.user.image}
                            alt="Avatar"
                            className="w-16 h-16 rounded-full ring-2 ring-purple-200 dark:ring-purple-800"
                            width={64}
                            height={64}
                        />
                    ) : (
                        <div className="w-16 h-16 rounded-full bg-linear-to-br from-purple-500 to-indigo-600 flex items-center justify-center ring-2 ring-purple-200 dark:ring-purple-800">
                            <span className="text-xl font-bold text-white">{initials}</span>
                        </div>
                    )}
                    <div>
                        <p className="text-base font-semibold text-foreground">{session.user?.name}</p>
                        <p className="text-sm text-muted-foreground">{session.user?.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                            {userRole.toUpperCase()}
                        </span>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                            <Mail className="w-4 h-4 inline mr-1.5 text-muted-foreground" />
                            Email
                        </label>
                        <input
                            type="email"
                            value={session.user?.email || ""}
                            disabled
                            className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-muted-foreground text-sm cursor-not-allowed"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                            <User className="w-4 h-4 inline mr-1.5 text-muted-foreground" />
                            Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your name"
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition"
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg">
                            <CheckCircle className="w-4 h-4 shrink-0" />
                            {success}
                        </div>
                    )}

                    <div className="flex justify-end">
                        <button
                            onClick={handleUpdateProfile}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition"
                        >
                            {saving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            {saving ? "Saving..." : "Save"}
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Email Verification Card ── */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-purple-500" />
                    Email Verification Status
                </h2>

                <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-muted/50">
                    {isEmailVerified ? (
                        <>
                            <MailCheck className="w-5 h-5 text-green-500" />
                            <div>
                                <p className="text-sm font-medium text-green-700 dark:text-green-400">Email Verified</p>
                                <p className="text-xs text-muted-foreground">Email {session.user?.email} has been verified.</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <MailX className="w-5 h-5 text-amber-500" />
                            <div>
                                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Email Not Verified</p>
                                <p className="text-xs text-muted-foreground">Please verify your email to unlock all features.</p>
                            </div>
                        </>
                    )}
                </div>

                {emailVerifyError && (
                    <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg mb-4">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {emailVerifyError}
                    </div>
                )}
                {emailVerifySuccess && (
                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg mb-4">
                        <CheckCircle className="w-4 h-4 shrink-0" />
                        {emailVerifySuccess}
                    </div>
                )}

                {!isEmailVerified && (
                    <div className="flex justify-end">
                        <button
                            onClick={handleSendVerificationEmail}
                            disabled={emailVerifySending}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition cursor-pointer"
                        >
                            {emailVerifySending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            {emailVerifySending ? "Sending..." : "Send Verification Email"}
                        </button>
                    </div>
                )}
            </div>

            {/* ── Change Password Card ── */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-purple-500" />
                    Change Password
                </h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                            Current Password
                        </label>
                        <div className="relative">
                            <input
                                type={showCurrentPassword ? "text" : "password"}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Enter current password"
                                className="w-full px-3 py-2 pr-10 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition cursor-pointer"
                            >
                                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                            New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showNewPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="At least 8 characters"
                                className="w-full px-3 py-2 pr-10 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition cursor-pointer"
                            >
                                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                            Confirm New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                className="w-full px-3 py-2 pr-10 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition cursor-pointer"
                            >
                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {passwordError && (
                        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {passwordError}
                        </div>
                    )}
                    {passwordSuccess && (
                        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg">
                            <CheckCircle className="w-4 h-4 shrink-0" />
                            {passwordSuccess}
                        </div>
                    )}

                    <div className="flex justify-end">
                        <button
                            onClick={handleChangePassword}
                            disabled={passwordSaving}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition cursor-pointer"
                        >
                            {passwordSaving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Lock className="w-4 h-4" />
                            )}
                            {passwordSaving ? "Changing..." : "Change Password"}
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Two-Factor Authentication Card ── */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-purple-500" />
                    Two-Factor Authentication (2FA)
                </h2>

                <div className="flex items-center gap-3 mb-6 p-3 rounded-lg bg-muted/50">
                    {isTwoFactorEnabled ? (
                        <>
                            <ShieldCheck className="w-5 h-5 text-green-500" />
                            <div>
                                <p className="text-sm font-medium text-green-700 dark:text-green-400">Enabled</p>
                                <p className="text-xs text-muted-foreground">Your account is protected with 2FA</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <ShieldOff className="w-5 h-5 text-amber-500" />
                            <div>
                                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Not Enabled</p>
                                <p className="text-xs text-muted-foreground">Enable 2FA to increase security</p>
                            </div>
                        </>
                    )}
                </div>

                {totpError && (
                    <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg mb-4">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {totpError}
                    </div>
                )}
                {totpSuccess && (
                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg mb-4">
                        <CheckCircle className="w-4 h-4 shrink-0" />
                        {totpSuccess}
                    </div>
                )}

                {!isTwoFactorEnabled && totpStep === "idle" && (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Enter your password to setup 2FA with an Authenticator app (e.g., Google Authenticator, Authy)
                        </p>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
                            <div className="relative">
                                <input
                                    type={showTotpPassword ? "text" : "password"}
                                    value={totpPassword}
                                    onChange={(e) => setTotpPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    className="w-full px-3 py-2 pr-10 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowTotpPassword(!showTotpPassword)}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition cursor-pointer"
                                >
                                    {showTotpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button
                                onClick={handleEnableTotp}
                                disabled={totpLoading}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition cursor-pointer"
                            >
                                {totpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                                {totpLoading ? "Generating QR Code..." : "Enable 2FA"}
                            </button>
                        </div>
                    </div>
                )}

                {totpStep === "verify" && (
                    <div className="space-y-4">
                        <div className="text-center">
                            <p className="text-sm font-medium text-foreground mb-3">
                                Scan QR Code with Authenticator app
                            </p>
                            {qrDataUrl && (
                                <div className="inline-block p-3 bg-white rounded-xl shadow-sm border border-border">
                                    <Image src={qrDataUrl} alt="TOTP QR Code" width={200} height={200} />
                                </div>
                            )}
                        </div>

                        {totpUri && (
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Or enter the Secret Key manually:</p>
                                <div className="flex gap-2">
                                    <code className="flex-1 px-2 py-1.5 bg-muted rounded text-xs break-all font-mono">
                                        {totpUri}
                                    </code>
                                    <button
                                        onClick={() => copyToClipboard(totpUri)}
                                        className="px-2 py-1.5 text-muted-foreground hover:text-foreground transition cursor-pointer"
                                        title="Copy"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {backupCodes.length > 0 && (
                            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-1.5">
                                    <KeyRound className="w-4 h-4" />
                                    Backup Codes — Save them in a secure place!
                                </p>
                                <p className="text-xs text-amber-700 dark:text-amber-400 mb-2">
                                    Use these to sign in if you lose access to your Authenticator app. Each code can only be used once.
                                </p>
                                <div className="grid grid-cols-2 gap-1.5">
                                    {backupCodes.map((code, i) => (
                                        <code key={i} className="px-2 py-1 bg-white dark:bg-gray-800 rounded text-xs font-mono text-center">
                                            {code}
                                        </code>
                                    ))}
                                </div>
                                <button
                                    onClick={() => copyToClipboard(backupCodes.join("\n"))}
                                    className="mt-2 text-xs text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                    <Copy className="w-3 h-3" /> Copy all
                                </button>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">
                                Enter 6-digit code from Authenticator app
                            </label>
                            <input
                                type="text"
                                value={verifyCode}
                                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                placeholder="000000"
                                maxLength={6}
                                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm text-center tracking-[0.3em] font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition"
                            />
                        </div>

                        <div className="flex justify-between">
                            <button
                                onClick={() => {
                                    setTotpStep("idle")
                                    setTotpError("")
                                    setVerifyCode("")
                                }}
                                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleVerifyTotp}
                                disabled={totpLoading || verifyCode.length !== 6}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition cursor-pointer"
                            >
                                {totpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                {totpLoading ? "Verifying..." : "Verify and Enable"}
                            </button>
                        </div>
                    </div>
                )}

                {isTwoFactorEnabled && totpStep === "idle" && (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Enter your password to disable Two-Factor Authentication
                        </p>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
                            <div className="relative">
                                <input
                                    type={showDisablePassword ? "text" : "password"}
                                    value={disablePassword}
                                    onChange={(e) => setDisablePassword(e.target.value)}
                                    placeholder="Enter your password"
                                    className="w-full px-3 py-2 pr-10 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowDisablePassword(!showDisablePassword)}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition cursor-pointer"
                                >
                                    {showDisablePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button
                                onClick={handleDisableTotp}
                                disabled={disableLoading}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition cursor-pointer"
                            >
                                {disableLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldOff className="w-4 h-4" />}
                                {disableLoading ? "Disabling..." : "Disable 2FA"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}