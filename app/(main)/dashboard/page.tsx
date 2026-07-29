import { Metadata } from "next"
import DashboardContent from "./DashboardContent"

export const metadata: Metadata = {
    title: "Dashboard",
    description:
        "AI Native App Dashboard — A comprehensive AI system management hub. View usage statistics, manage your Knowledge Base and AI Chat, and configure the entire system all in one place.",
    keywords: [
        "Dashboard",
        "Admin Panel",
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