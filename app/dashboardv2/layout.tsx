import type React from "react"
import { AppBar } from "@/components/ui/app-bar"

export default function DashboardV2Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <AppBar />
      <main className="pt-20 sm:pt-24 lg:pt-28 min-h-screen">
        {children}
      </main>
    </>
  )
}
