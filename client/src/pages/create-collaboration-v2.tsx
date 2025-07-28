import React, { useEffect, useRef } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { CollaborationFormV2 } from "@/components/CollaborationFormV2";
import "./scroll-styles.css";

/**
 * Create Collaboration V2 Page
 * New implementation with improved validation and limits
 * Added custom scrolling behavior similar to the matches page
 * This page is preloaded to reduce apparent loading times
 */
export default function CreateCollaborationV2() {
  // Store the original overflow to restore it on unmount
  const originalOverflowRef = useRef<string>("");
  const rootElementRef = useRef<HTMLElement | null>(null);
  
  // Set up scrolling behavior on mount
  useEffect(() => {
    // Store original values
    const originalBodyOverflow = document.body.style.overflow;
    const originalBodyPosition = document.body.style.position;
    const originalBodyTop = document.body.style.top;
    const originalBodyWidth = document.body.style.width;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    
    // Apply scrolling fixes immediately to prevent flicker
    document.body.style.overflow = "auto";
    document.body.style.position = "static";
    document.body.style.top = "0";
    document.body.style.width = "100%";
    document.documentElement.style.overflow = "auto";
    
    // Make sure the page can scroll
    window.scrollTo(0, 0);
    
    // Clean up and restore original settings on unmount
    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.position = originalBodyPosition;
      document.body.style.top = originalBodyTop;
      document.body.style.width = originalBodyWidth;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, []);
  
  return (
    <div className="container py-4 max-w-5xl">
      <div className="mb-2">
        <PageHeader
          title="🤝 Create Your Collab"
          backUrl="/my-collaborations"
        />
      </div>
      
      <div className="bg-card rounded-lg shadow p-4">
        <CollaborationFormV2 />
      </div>
    </div>
  );
}