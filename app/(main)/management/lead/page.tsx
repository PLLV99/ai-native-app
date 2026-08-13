import { Metadata } from "next"
import LeadContent from "@/app/(main)/management/lead/LeadContent"

export const metadata: Metadata = {
    title: "Leads",
    description:
        "AI Native App Dashboard — A comprehensive AI Lead Management Hub. View usage statistics, manage the Knowledge Base, AI Chat, and configure system settings all in one place.",
    keywords: [
        "Leads",
        "Lead Generation",
        "AI Native App",
        "Management Hub",
        "Knowledge Base",
        "AI Chat",
        "Usage Statistics",
        "AI Management System",
    ],
}

export default function LeadPage() {
    return <LeadContent />
}