import { Metadata } from "next"
import ResetPasswordForm from "./ResetPasswordForm"

export const metadata: Metadata = {
    title: "Reset Password",
    description: "Set a new password for AI Native App to sign in again.",
}

export default function ResetPasswordPage() {
    return <ResetPasswordForm />
}