import DashboardContent from "@/app/(main)/dashboard/DashboardContent"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Dashboard",
    description:
        "AI Native App Dashboard — A comprehensive AI management hub. View usage statistics, manage the Knowledge Base and AI Chat, and configure all system settings in one place.",
    keywords: [
        "Dashboard",
        "Analytics",
        "AI Native App",
        "Management Hub",
        "Knowledge Base",
        "AI Chat",
        "Usage Statistics",
        "AI Management System",
    ],
}

export default function DashboardPage() {
    return <DashboardContent />
}