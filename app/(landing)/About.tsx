import { Code, Users, Lightbulb } from "lucide-react"

export default function About() {
    const highlights = [
        {
            icon: Lightbulb,
            title: "AI-First Approach",
            description: "Designed with AI at its core, from RAG and Embeddings to an intelligent Chatbot.",
        },
        {
            icon: Code,
            title: "Modern Stack",
            description: "Uses the latest technologies — Next.js 16, Prisma v7, Better Auth, and pgVector.",
        },
        {
            icon: Users,
            title: "Production Ready",
            description: "Ready to deploy with Containers, Workflow Automation, and LINE Integration.",
        },
    ]

    return (
        <section id="about" className="py-24">
            <div className="mx-auto max-w-7xl px-6">
                <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
                    {/* Left - Text */}
                    <div>
                        <h2 className="mb-4 text-3xl font-bold tracking-tight">
                            About{" "}
                            <span className="bg-linear-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                                AI Native App
                            </span>
                        </h2>
                        <p className="mb-6 text-muted-foreground leading-relaxed">
                            AI Native App is a prototype project developed from the
                            &quot;Next.js 16: The AI-Native Developer Masterclass&quot; course.
                            It covers building end-to-end applications from Authentication,
                            RAG Knowledge Base, and AI Chatbots, all the way to LINE Integration
                            and Production Deployment.
                        </p>
                        <p className="text-muted-foreground leading-relaxed">
                            Perfect for developers who want to learn how to build AI Applications
                            using modern technologies through hands-on, practical steps.
                        </p>
                    </div>

                    {/* Right - Highlights */}
                    <div className="space-y-6">
                        {highlights.map((item) => (
                            <div key={item.title} className="flex gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30">
                                    <item.icon className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="mb-1 font-semibold">{item.title}</h3>
                                    <p className="text-sm text-muted-foreground">{item.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}