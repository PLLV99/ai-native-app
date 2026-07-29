import { Metadata } from "next"
import ForgotPasswordForm from "./ForgotPasswordForm"

export const metadata: Metadata = {
    title: "Forgot Password",
    description:
        "Reset your AI Native App password — Enter your email to receive a password reset link. The system will send a confirmation email within seconds.",
    keywords: [
        "Forgot Password",
        "Reset Password",
        "AI Native App",
        "Better Auth",
        "Account Recovery",
    ],
}

export default function ForgotPasswordPage() {
    return <ForgotPasswordForm />
}