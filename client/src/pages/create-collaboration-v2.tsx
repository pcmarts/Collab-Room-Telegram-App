import React from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { CollaborationFormV2 } from "@/components/CollaborationFormV2";

/**
 * Create Collaboration V2 Page
 * New implementation with improved validation and limits
 */
export default function CreateCollaborationV2() {
  return (
    <div className="container py-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <PageHeader
          title="Create Collaboration V2"
          subtitle="Find collaborators for your next web3 project"
        />
        <div className="flex space-x-2">
          <Button variant="outline" asChild>
            <Link href="/create-collaboration-steps">
              Use Original Form
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/collaborations">
              My Collaborations
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="bg-card rounded-lg border shadow p-6">
        <CollaborationFormV2 />
      </div>
    </div>
  );
}