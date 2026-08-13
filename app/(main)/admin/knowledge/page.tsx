import KnowledgeBase from "@/app/(main)/admin/knowledge/KnowledgeBase"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Knowledge Base",
    description:
        "Knowledge Base — Comprehensive AI management center. View usage statistics, manage the knowledge base, AI Chat, and configure all system settings in one place.",
    keywords: [
        "Knowledge Base",
        "Knowledge Management",
        "AI Native App",
        "Management Hub",
        "AI Chat",
        "Usage Analytics",
        "AI Management System",
    ],
}

export default function KnowledgePage() {
    return <KnowledgeBase />
}