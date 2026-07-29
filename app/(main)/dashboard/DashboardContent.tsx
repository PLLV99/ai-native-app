import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Bot, Database, Sparkles } from "lucide-react"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export default async function DashboardContent() {

    const session = await auth.api.getSession({
        headers: await headers(),
    })

    if (!session) {
        return null
    }
    const userRole = session.user.role || "user"
    // หั่นด้วยลูกน้ำ -> ทำตัวใหญ่ทีละคำ -> จับมาต่อกันด้วยลูกน้ำและเว้นวรรค
    const displayRole = userRole.split(',')
        .map(role => role.trim().charAt(0).toUpperCase() + role.trim().slice(1))
        .join(', ')
    const stats = [
        {
            title: "Status",
            // value: session.user.role === "admin" ? "Admin" : "User",
            value: displayRole,
            icon: Shield,
            description: `Role: ${userRole.split(',').join(', ')}`,
        },
        {
            title: "Knowledge Docs",
            value: "0",
            icon: Database,
            description: "Documents in database",
        },
        {
            title: "AI Chats",
            value: "0",
            icon: Bot,
            description: "Total conversations",
        },
        {
            title: "System Status",
            value: "Active",
            icon: Sparkles,
            description: "System running normally",
        },
    ]

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                        Hello, {session.user.name} 👋
                    </h2>
                    <p className="text-muted-foreground">
                        Welcome to the AI Native App Dashboard
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {stat.title}
                            </CardTitle>
                            <stat.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground">
                                {stat.description}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Start</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                    <p>
                        Start by adding documents to the{" "}
                        <a href="/knowledge" className="text-purple-500 dark:text-purple-400 underline">
                            Knowledge Base
                        </a>{" "}
                        or test the{" "}
                        <a href="/chat" className="text-purple-500 dark:text-purple-400 underline">
                            AI Chat
                        </a>
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}