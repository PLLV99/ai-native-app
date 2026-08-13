import ProjectContent from "@/app/(main)/management/projects/ProjectContent"

import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Projects",
    description:
        "AI Native App Dashboard — A comprehensive AI project management hub. View usage statistics, manage the Knowledge Base and AI Chat, and configure system settings all in one place.",
    keywords: [
        "Projects",
        "Project Management",
        "AI Native App",
        "Management Hub",
        "Knowledge Base",
        "AI Chat",
        "Usage Statistics",
        "AI Management System",
    ],
}

export default function ProjectsPage() {
    return <ProjectContent />
}