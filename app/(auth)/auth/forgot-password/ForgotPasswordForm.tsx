"use client"

import { useState } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Sparkles, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react"
import { authClient } from "@/lib/auth-client"

export default function ForgotPasswordForm() {
    const [email, setEmail] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [error, setError] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        try {
            const res = await authClient.requestPasswordReset({
                email,
                redirectTo: "/auth/reset-password",
            })

            if (res.error) {
                setError(res.error.message || "An error occurred")
            } else {
                setIsSubmitted(true)
            }
        } catch {
            setError("An error occurred while sending the email")
        } finally {
            setIsLoading(false)
        }
    }

    if (isSubmitted) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-purple-600" />
                    <span className="text-xl font-bold">AI Native App</span>
                </div>

                <div className="flex flex-col items-center space-y-4 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                        <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Check your email
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        We have sent a password reset link to{" "}
                        <span className="font-medium text-foreground">{email}</span>
                    </p>
                </div>

                <Button
                    variant="outline"
                    className="w-full cursor-pointer"
                    onClick={() => setIsSubmitted(false)}
                >
                    Try another email
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                    <Link
                        href="/auth/signin"
                        className="inline-flex items-center gap-1 font-medium text-purple-500 hover:text-purple-400"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Sign in
                    </Link>
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-purple-600" />
                <span className="text-xl font-bold">AI Native App</span>
            </div>

            <div className="space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Forgot Password?
                </h1>
                <p className="text-sm text-muted-foreground">
                    Don't worry, we'll send you a link to reset your password.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {error}
                    </div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                    />
                </div>

                <Button
                    type="submit"
                    className="w-full bg-purple-600 py-5 text-white hover:bg-purple-700 cursor-pointer"
                    disabled={isLoading}
                >
                    {isLoading ? "Sending..." : "Reset Password"}
                </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
                <Link
                    href="/auth/signin"
                    className="inline-flex items-center gap-1 font-medium text-purple-500 hover:text-purple-400"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Sign in
                </Link>
            </p>
        </div>
    )
}