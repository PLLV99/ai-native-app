"use client"

import { usePathname } from "next/navigation"
import { sidebarData, bottomNavItems } from "../sidebar/sidebar-data"
import UserMenu from "./UserMenu"
import { ImpersonationBanner } from "./impersonation-banner"

export function Header() {
    const pathname = usePathname()

    // Pages not in the sidebar that require a title
    const pageTitles: Record<string, string> = {
        "/profile": "My Profile",
    }

    // Combine all items from the sidebar and find the title that matches the pathname
    const allItems = [
        ...sidebarData.flatMap((section) => section.items),
        ...bottomNavItems,
    ]
    const matched = allItems.find((item) => pathname === item.href)
    const title = pageTitles[pathname] ?? matched?.title ?? "Dashboard"

    return (
        <>
            {/* Impersonation Banner — Displayed when an Admin is impersonating */}
            <ImpersonationBanner />

            <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/80 backdrop-blur-xl px-6">
                <div className="flex items-center gap-4">
                    <h1 className="text-lg font-semibold text-foreground">
                        {title}
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    <UserMenu />
                </div>
            </header>
        </>
    )
}