import React from "react";
import AuthTest from "@/components/AuthTest";

// Simple page component that wraps the AuthTest component
export default function AuthTestPage() {
  return (
    <div className="container max-w-4xl mx-auto pt-6 pb-16 px-4">
      <h1 className="text-2xl font-bold mb-4">Authentication Fallback Test</h1>
      <p className="mb-6 text-muted-foreground">
        This test verifies that the application can still authenticate you even when session cookies change.
        The auth fallback mechanism uses a cached Telegram user ID to maintain authentication.
      </p>
      <AuthTest />
    </div>
  );
}