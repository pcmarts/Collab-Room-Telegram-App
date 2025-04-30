import React, { useEffect, useRef } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { CollaborationFormV2 } from "@/components/CollaborationFormV2";

/**
 * Create Collaboration V2 Page
 * New implementation with improved validation and limits
 * Added custom scrolling behavior similar to the matches page
 */
export default function CreateCollaborationV2() {
  // Store the original overflow to restore it on unmount
  const originalOverflowRef = useRef<string>("");
  const rootElementRef = useRef<HTMLElement | null>(null);
  
  // Set up scrolling behavior on mount
  useEffect(() => {
    // This disables the default fixed positioning and overflow hidden
    // that Telegram's WebApp applies to the document body
    rootElementRef.current = document.documentElement;
    originalOverflowRef.current = document.body.style.overflow;
    
    // Enable smooth scrolling for the page
    document.body.style.overflow = "auto";
    if (rootElementRef.current) {
      rootElementRef.current.style.overflow = "auto";
    }
    
    // Clean up and restore original settings on unmount
    return () => {
      document.body.style.overflow = originalOverflowRef.current;
      if (rootElementRef.current) {
        rootElementRef.current.style.overflow = "";
      }
    };
  }, []);
  
  return (
    <div className="container py-6 max-w-5xl">
      <div className="mb-6">
        <PageHeader
          title="🤝 Create Your Collab"
        />
      </div>
      
      <div className="bg-card rounded-lg border shadow p-6">
        <CollaborationFormV2 />
      </div>
    </div>
  );
}