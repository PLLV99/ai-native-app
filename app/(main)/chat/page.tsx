import ChatContent from '@/app/(main)/chat/ChatContent'
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "AI Chat",
    description:
        "AI Chat — An end-to-end AI chat system featuring Session Management, Memory (server-side history), Streaming (SSE), and an intuitive Chat History Sidebar. Perfect for building chatbots, personal assistants, or intelligent Q&A systems.",
    keywords: [
        "AI Chat",
        "AI Native App",
        "Management Center",
        "Knowledge Base",
        "Usage Statistics",
        "AI Management System",
    ],
}

export default function page() {
    return <ChatContent />
}