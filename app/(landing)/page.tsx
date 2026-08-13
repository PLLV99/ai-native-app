import { Metadata } from "next"
import Navbar from "@/app/(landing)/Navbar"
import Hero from "@/app/(landing)/Hero"
import Features from "@/app/(landing)/Features"
import About from "@/app/(landing)/About"
import TechStack from "@/app/(landing)/TechStack"
import Team from "@/app/(landing)/Team"
import Testimonial from "@/app/(landing)/Testimonial"
import Footer from "@/app/(landing)/Footer"
import ChatButton from "@/components/chat/ChatButton"
import LeadForm from "@/app/(landing)/LeadForm"
import ContactForm from "./ContactForm"

export const metadata: Metadata = {
    title: "AI Native App",
    description:
        "Comprehensive AI-Native Application — Authentication, RAG Chatbot, Knowledge Base, LINE Integration, and Production Deployment using Next.js 16, Better Auth, Prisma v7, and OpenAI.",
    keywords: [
        "AI Native App",
        "Next.js 16",
        "Better Auth",
        "RAG Chatbot",
        "Knowledge Base",
        "LINE Integration",
        "Prisma v7",
        "pgVector",
        "OpenAI",
        "AI Application",
    ],
}

export default function Home() {
    return (
        <div className="min-h-screen">
            <Navbar />
            <Hero />
            <Features />
            <About />
            <TechStack />
            <Team />
            <Testimonial />
            <LeadForm />
            <ContactForm/>
            <Footer />
            <ChatButton />
        </div>
    )
}



