import { Metadata } from "next"
import LoginForm from "./LoginForm"

export const metadata: Metadata = {
    title: "Sign In",
    description:
        "Sign in to AI Native App — An all-in-one AI application featuring a RAG Chatbot, Knowledge Base, and LINE Integration. Supports Social Login via Google, GitHub, and LINE.",
    keywords: [
        "Login",
        "Sign In",
        "AI Native App",
        "Better Auth",
        "Social Login",
        "Google Login",
        "GitHub Login",
        "LINE Login",
        "Next.js Authentication",
        "Authentication System",
    ],
}

export default function SignInPage() {
    return <LoginForm />
}