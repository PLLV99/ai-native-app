import { Metadata } from "next"
import SignupForm from "./SignupForm"

export const metadata: Metadata = {
    title: "Sign Up",
    description:
        "Sign up for AI Native App — Create an account to access our intelligent RAG Chatbot, Knowledge Base Management, and a comprehensive AI system. Supports Social Login via Google, GitHub, and LINE.",
    keywords: [
        "Sign Up",
        "Register",
        "Create Account",
        "AI Native App",
        "Better Auth",
        "Next.js 16",
        "RAG Chatbot",
        "Knowledge Base",
        "AI Application",
        "User Registration",
    ],
}

export default function SignUpPage() {
    return <SignupForm />
}