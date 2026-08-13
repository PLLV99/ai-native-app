import TeamContent from "@/app/(main)/management/teams/TeamContent"

import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Teams",
    description:
        "AI Native App Dashboard — A comprehensive AI team management hub. View usage statistics, manage the Knowledge Base and AI Chat, and configure system settings all in one place.",
    keywords: [
        "Teams",
        "Team Management",
        "AI Native App",
        "Management Hub",
        "Knowledge Base",
        "AI Chat",
        "Usage Statistics",
        "AI Management System",
    ],
}


export default function TeamsPage() {
    return <TeamContent />
}