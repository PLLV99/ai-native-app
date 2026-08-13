import LineGroupsContent from "@/app/(main)/admin/line-groups/LineGroupsContent"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "LINE Groups",
    description: "Manage LINE groups the Bot has joined — Enable/Disable notifications",
}

export default async function LineGroupsPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    })

    if (!session) {
        redirect("/dashboard")
    }

    // Ensure only Admins can access this page
    const userRoles = (session.user.role ?? "user").split(",").map((r: string) => r.trim())
    if (!userRoles.includes("admin")) {
        redirect("/dashboard")
    }

    return <LineGroupsContent />
}