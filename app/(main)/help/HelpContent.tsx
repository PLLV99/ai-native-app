"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Search,
    ChevronDown,
    ChevronRight,
    MessageSquare,
    Database,
    Bot,
    Shield,
    Users,
    Settings,
    BookOpen,
    Lightbulb,
    ExternalLink,
    HelpCircle,
    Mail,
    Zap,
    FileText,
    FolderOpen,
    BarChart3,
    Keyboard,
} from "lucide-react"

// ===================== Types =====================

interface FAQItem {
    question: string
    answer: string
}

interface FAQCategory {
    id: string
    title: string
    icon: typeof HelpCircle
    color: string
    bgColor: string
    items: FAQItem[]
}

interface GuideItem {
    title: string
    description: string
    icon: typeof BookOpen
    color: string
    bgColor: string
    steps: string[]
}

interface ShortcutItem {
    keys: string[]
    action: string
}

// ===================== Data =====================

const FAQ_CATEGORIES: FAQCategory[] = [
    {
        id: "chat",
        title: "AI Chat",
        icon: MessageSquare,
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
        items: [
            { question: "How does AI Chat work?", answer: "It uses RAG (Retrieval-Augmented Generation): the system first searches the knowledge base for relevant content, then sends that context to OpenAI to produce an accurate, on-topic answer." },
            { question: "Can I create multiple sessions?", answer: "Yes. You can create unlimited sessions. Each one keeps its own conversation history, and you can rename or delete a session at any time." },
            { question: "What answer formats does chat support?", answer: "Full Markdown, including tables, code blocks, lists, headings, links and blockquotes. Everything is rendered automatically." },
            { question: "Why does the AI sometimes say it can't find information?", answer: "That happens when your question doesn't match anything in the knowledge base. Try adding relevant documents, or raise Top K in Settings to widen the search." },
        ],
    },
    {
        id: "knowledge",
        title: "Knowledge Base",
        icon: Database,
        color: "text-emerald-600 dark:text-emerald-400",
        bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
        items: [
            { question: "Which file types are supported?", answer: ".txt, .csv and .pdf, up to 10 MB per file." },
            { question: "What does 'Index to Vector DB' mean?", answer: "It splits a document into small chunks, converts them into embeddings with OpenAI, and stores them in the pgVector database so the AI can retrieve relevant content quickly." },
            { question: "Can I edit a document after uploading it?", answer: "Yes. You can edit the title, description and content. After editing, click Index again to refresh the vector database." },
            { question: "If I delete a document, are its vector chunks removed too?", answer: "Yes. All related chunks are deleted automatically (cascade delete)." },
        ],
    },
    {
        id: "auth",
        title: "Account & Security",
        icon: Shield,
        color: "text-purple-600 dark:text-purple-400",
        bgColor: "bg-purple-50 dark:bg-purple-900/20",
        items: [
            { question: "Which sign-in methods are supported?", answer: "Email/password, Google, GitHub, LINE and Facebook. If the email addresses match, accounts are linked automatically." },
            { question: "How do I enable 2FA?", answer: "Go to Profile > Security and turn on Two-Factor Authentication. The system generates a QR code to scan with an authenticator app such as Google Authenticator." },
            { question: "What if I forget my password?", answer: "Click 'Forgot password' on the login page. You'll receive an email with a reset link that stays valid for one hour." },
        ],
    },
    {
        id: "admin",
        title: "System Administration",
        icon: Settings,
        color: "text-amber-600 dark:text-amber-400",
        bgColor: "bg-amber-50 dark:bg-amber-900/20",
        items: [
            { question: "What roles exist in the system?", answer: "Three levels: Admin (manages everything), Manager (creates and edits projects), and User (creates and reads projects)." },
            { question: "How can an admin manage users?", answer: "Go to Admin > Users to see every user. From there you can change roles, ban or unban, and impersonate an account." },
            { question: "Where do I change the AI model?", answer: "Go to Admin > Settings > the 'AI & Models' tab. You can change the chat model, embedding model, temperature and max tokens." },
        ],
    },
]

const GUIDES: GuideItem[] = [
    {
        title: "Getting started with AI Chat",
        description: "Learn how to talk to an AI that is connected to your knowledge base",
        icon: MessageSquare,
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
        steps: [
            "Open the AI & Data > Chat menu",
            "Click 'New chat' to start a session",
            "Type your question, then press Enter or click the send button",
            "The AI searches the knowledge base and streams its answer back",
            "Rename or delete a session from the left sidebar",
        ],
    },
    {
        title: "Adding data to the knowledge base",
        description: "Upload documents and index them so the AI can answer from them",
        icon: FolderOpen,
        color: "text-emerald-600 dark:text-emerald-400",
        bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
        steps: [
            "Go to the Admin > Knowledge menu",
            "Click '+ New document'",
            "Enter a title and description, then upload a file (.txt, .csv, .pdf) or type the content yourself",
            "Click 'Save' to create the document",
            "Click 'Index to Vector DB' to turn it into embeddings and store them",
            "Go back to Chat and ask a related question!",
        ],
    },
    {
        title: "Managing teams and projects",
        description: "Create teams, invite members and manage projects",
        icon: Users,
        color: "text-purple-600 dark:text-purple-400",
        bgColor: "bg-purple-50 dark:bg-purple-900/20",
        steps: [
            "Go to the Management > Teams menu",
            "Browse the team list and click a team to see its members",
            "Click 'Invite Member' to add someone new to the team",
            "Go to Management > Projects to create and track projects",
        ],
    },
]

const SHORTCUTS: ShortcutItem[] = [
    { keys: ["Enter"], action: "Send a chat message" },
    { keys: ["Shift", "Enter"], action: "New line in the chat box" },
    { keys: ["Ctrl", "K"], action: "Quick search" },
    { keys: ["Ctrl", "B"], action: "Toggle the sidebar" },
]

const TECH_STACK = [
    { name: "Next.js 16", desc: "App Router + React 19", icon: Zap },
    { name: "OpenAI", desc: "GPT-4o + Embeddings", icon: Bot },
    { name: "Prisma 7", desc: "PostgreSQL (Neon)", icon: Database },
    { name: "pgVector", desc: "Vector Search", icon: BarChart3 },
    { name: "better-auth", desc: "Auth + RBAC + 2FA", icon: Shield },
    { name: "Tailwind CSS", desc: "Styling + Dark Mode", icon: FileText },
]

// ===================== Component =====================

export default function HelpContent() {
    const [searchQuery, setSearchQuery] = useState("")
    const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null)
    const [activeSection, setActiveSection] = useState<"faq" | "guides" | "shortcuts" | "tech">("faq")

    // Filter the FAQ by search query
    const filteredCategories = FAQ_CATEGORIES.map((cat) => ({
        ...cat,
        items: cat.items.filter(
            (item) =>
                item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.answer.toLowerCase().includes(searchQuery.toLowerCase())
        ),
    })).filter((cat) => cat.items.length > 0)

    const totalFAQ = FAQ_CATEGORIES.reduce((s, c) => s + c.items.length, 0)

    function toggleFAQ(key: string) {
        setExpandedFAQ(expandedFAQ === key ? null : key)
    }

    const sections = [
        { id: "faq" as const, label: "FAQ", icon: HelpCircle, count: totalFAQ },
        { id: "guides" as const, label: "Guides", icon: BookOpen, count: GUIDES.length },
        { id: "shortcuts" as const, label: "Shortcuts", icon: Keyboard, count: SHORTCUTS.length },
        { id: "tech" as const, label: "Tech Stack", icon: Lightbulb, count: TECH_STACK.length },
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center max-w-2xl mx-auto">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/30 mb-4">
                    <HelpCircle className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Help Center</h2>
                <p className="text-muted-foreground mt-1">Find answers, usage guides and technical details</p>

                {/* Search */}
                <div className="relative mt-5 max-w-lg mx-auto">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search questions or topics..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value)
                            if (e.target.value) setActiveSection("faq")
                        }}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-sm"
                    />
                </div>
            </div>

            {/* Section Tabs */}
            {!searchQuery && (
                <div className="flex flex-wrap justify-center gap-2">
                    {sections.map((sec) => {
                        const Icon = sec.icon
                        const isActive = activeSection === sec.id
                        return (
                            <button
                                key={sec.id}
                                onClick={() => setActiveSection(sec.id)}
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${isActive
                                        ? "bg-blue-600 text-white shadow-sm"
                                        : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                                    }`}
                            >
                                <Icon className="h-4 w-4" />
                                {sec.label}
                                <span
                                    className={`text-xs px-1.5 py-0.5 rounded-full ${isActive
                                            ? "bg-blue-500 text-white"
                                            : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                                        }`}
                                >
                                    {sec.count}
                                </span>
                            </button>
                        )
                    })}
                </div>
            )}

            {/* ==================== FAQ ==================== */}
            {(activeSection === "faq" || searchQuery) && (
                <div className="space-y-5">
                    {(searchQuery ? filteredCategories : FAQ_CATEGORIES).map((category) => {
                        const Icon = category.icon
                        return (
                            <Card key={category.id}>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <div className={`p-1.5 rounded-lg ${category.bgColor}`}>
                                            <Icon className={`h-4 w-4 ${category.color}`} />
                                        </div>
                                        {category.title}
                                        <span className="text-xs font-normal text-muted-foreground">({category.items.length})</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0 space-y-1">
                                    {category.items.map((item, idx) => {
                                        const key = `${category.id}-${idx}`
                                        const isOpen = expandedFAQ === key
                                        return (
                                            <div key={key} className="border border-gray-100 dark:border-gray-700 rounded-lg overflow-hidden">
                                                <button
                                                    onClick={() => toggleFAQ(key)}
                                                    className="w-full flex items-center justify-between p-3.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                                                >
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white pr-4">{item.question}</span>
                                                    {isOpen ? (
                                                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                                                    ) : (
                                                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                                                    )}
                                                </button>
                                                {isOpen && (
                                                    <div className="px-3.5 pb-3.5 pt-0">
                                                        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                                            {item.answer}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </CardContent>
                            </Card>
                        )
                    })}

                    {searchQuery && filteredCategories.length === 0 && (
                        <div className="text-center py-16">
                            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No results found</h3>
                            <p className="text-muted-foreground mt-1">Try a different search term, or contact our support team</p>
                        </div>
                    )}
                </div>
            )}

            {/* ==================== Guides ==================== */}
            {activeSection === "guides" && !searchQuery && (
                <div className="grid gap-5 lg:grid-cols-3">
                    {GUIDES.map((guide) => {
                        const Icon = guide.icon
                        return (
                            <Card key={guide.title} className="flex flex-col">
                                <CardHeader className="pb-3">
                                    <div className={`w-10 h-10 rounded-xl ${guide.bgColor} flex items-center justify-center mb-2`}>
                                        <Icon className={`h-5 w-5 ${guide.color}`} />
                                    </div>
                                    <CardTitle className="text-base">{guide.title}</CardTitle>
                                    <CardDescription>{guide.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 pt-0">
                                    <ol className="space-y-2.5">
                                        {guide.steps.map((step, i) => (
                                            <li key={i} className="flex gap-3 text-sm">
                                                <span className="shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 flex items-center justify-center text-xs font-bold">
                                                    {i + 1}
                                                </span>
                                                <span className="text-gray-700 dark:text-gray-300 pt-0.5">{step}</span>
                                            </li>
                                        ))}
                                    </ol>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* ==================== Shortcuts ==================== */}
            {activeSection === "shortcuts" && !searchQuery && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Keyboard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            Common Keyboard Shortcuts
                        </CardTitle>
                        <CardDescription>Shortcuts to help you work faster</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {SHORTCUTS.map((sc) => (
                                <div
                                    key={sc.action}
                                    className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                                >
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{sc.action}</span>
                                    <div className="flex items-center gap-1">
                                        {sc.keys.map((k, i) => (
                                            <span key={i}>
                                                <kbd className="px-2 py-1 text-xs font-mono font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm">
                                                    {k}
                                                </kbd>
                                                {i < sc.keys.length - 1 && <span className="text-xs text-muted-foreground mx-1">+</span>}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ==================== Tech Stack ==================== */}
            {activeSection === "tech" && !searchQuery && (
                <div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {TECH_STACK.map((tech) => {
                            const Icon = tech.icon
                            return (
                                <Card key={tech.name}>
                                    <CardContent className="p-5 flex items-center gap-4">
                                        <div className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800">
                                            <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{tech.name}</p>
                                            <p className="text-xs text-muted-foreground">{tech.desc}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Contact Footer */}
            <Card className="border-dashed">
                <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-4 justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/20">
                            <Mail className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">Still can&apos;t find an answer?</p>
                            <p className="text-xs text-muted-foreground">Contact our support team for further help</p>
                        </div>
                    </div>
                    <a
                        href="mailto:support@ainative.app"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition shadow-sm"
                    >
                        <Mail className="h-4 w-4" />
                        Email Us
                        <ExternalLink className="h-3 w-3" />
                    </a>
                </CardContent>
            </Card>
        </div>
    )
}