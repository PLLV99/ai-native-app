import SettingContent from '@/app/(main)/admin/settings/SettingContent'
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Settings",
    description:
        "Settings — A comprehensive AI management hub. View usage statistics, manage the Knowledge Base and AI Chat, and configure all system settings in one place.",
    keywords: [
        "Settings",
        "Configuration",
        "AI Native App",
        "Management Hub",
        "Knowledge Base",
        "AI Chat",
        "Usage Statistics",
        "AI Management System",
    ],
}


export default async function SettingPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    })

    if (!session) {
        redirect("/dashboard")
    }

    // Admin-only page
    const userRoles = (session.user.role ?? "user").split(",").map((r: string) => r.trim())
    if (!userRoles.includes("admin")) {
        redirect("/dashboard")
    }

    return <SettingContent />
}