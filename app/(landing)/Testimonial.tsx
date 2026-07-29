import { Star, Quote } from "lucide-react"

const testimonials = [
    {
        name: "Wittaya Smart",
        role: "Senior Developer",
        company: "TechCorp Thailand",
        quote: "This course provided a deep understanding of AI-Native Development. Building real projects from day one, and ready to use immediately after completion.",
        rating: 5,
    },
    {
        name: "Parichat Digital",
        role: "Full Stack Developer",
        company: "Digital Innovation Co.",
        quote: "Loved the easy-to-understand teaching of RAG and pgVector. It really enabled me to build a Knowledge Base. Connecting it with LINE was also a huge plus. Very impressed.",
        rating: 5,
    },
    {
        name: "Thanapon Innovation",
        role: "Tech Lead",
        company: "AI Solutions Ltd.",
        quote: "Comprehensive content from Auth to Deployment with Podman. Our team could apply it in the office right away. Very high ROI.",
        rating: 5,
    },
]

export default function Testimonial() {
    return (
        <section id="testimonial" className="py-24">
            <div className="mx-auto max-w-7xl px-6">
                <div className="mb-16 text-center">
                    <h2 className="mb-4 text-3xl font-bold tracking-tight">
                        Student Reviews
                    </h2>
                    <p className="mx-auto max-w-2xl text-muted-foreground">
                        Feedback from developers who completed the AI-Native Developer Masterclass
                    </p>
                </div>

                <div className="grid gap-8 md:grid-cols-3">
                    {testimonials.map((item) => (
                        <div
                            key={item.name}
                            className="relative rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-lg hover:border-purple-500/50"
                        >
                            {/* Quote Icon */}
                            <Quote className="absolute right-6 top-6 h-8 w-8 text-purple-100 dark:text-purple-900/50" />

                            {/* Stars */}
                            <div className="mb-4 flex gap-1">
                                {Array.from({ length: item.rating }).map((_, i) => (
                                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                ))}
                            </div>

                            {/* Quote */}
                            <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                                &ldquo;{item.quote}&rdquo;
                            </p>

                            {/* Author */}
                            <div className="border-t pt-4">
                                <p className="font-semibold">{item.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {item.role} — {item.company}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}