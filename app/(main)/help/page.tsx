import HelpContent from '@/app/(main)/help/HelpContent'

import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Help",
    description:
        "Help — Find answers, usage guides and technical details for the AI Native App: AI Chat, Knowledge Base, accounts and system administration.",
    keywords: [
        "Help",
        "Support",
        "FAQ",
        "AI Native App",
        "User Guide",
        "Knowledge Base",
        "AI Chat",
        "AI Management System",
    ],
}

export default function HelpPage() {
    return <HelpContent />
}