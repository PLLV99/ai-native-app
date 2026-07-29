import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { AuthBranding } from "./auth-branding"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"

export default async function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {

    // Fetch session data on the server side
    const session = await auth.api.getSession({
        headers: await headers()
    })

    // If a session exists (user is logged in), redirect to the dashboard immediately
    if (session) {
        redirect("/dashboard")
    }

    return (
        <div className="flex min-h-screen">
            {/* Left Side - Form */}
            <div className="relative flex w-full flex-col justify-center px-4 py-12 lg:w-1/2 lg:px-20">
                {/* Back to Home */}
                <Link
                    href="/"
                    className="absolute left-6 top-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Home
                </Link>

                <div className="mx-auto w-full max-w-100">
                    {children}
                </div>
            </div>

            {/* Right Side - Branding */}
            <div className="hidden lg:block lg:w-1/2">
                <AuthBranding />
            </div>
        </div>
    )
}