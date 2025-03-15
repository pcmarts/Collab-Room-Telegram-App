import * as React from "react"
import { Button } from "@/components/ui/button"

export default function MatchesPage() {
  return (
    <div className="container py-6 pb-20">
      <h1 className="text-2xl font-bold mb-4">My Matches</h1>
      <div className="space-y-4">
        {/* Placeholder for matches list */}
        <div className="p-6 rounded-lg border border-border text-center">
          <p className="mb-4">No matches yet</p>
          <Button variant="outline">Start Chat</Button>
        </div>
      </div>
    </div>
  )
}
