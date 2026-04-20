import { useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { CollaborationFormV2 } from "@/components/CollaborationFormV2";
import "./scroll-styles.css";

export default function CreateCollaborationV2() {
  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow;
    const originalBodyPosition = document.body.style.position;
    const originalBodyTop = document.body.style.top;
    const originalBodyWidth = document.body.style.width;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "auto";
    document.body.style.position = "static";
    document.body.style.top = "0";
    document.body.style.width = "100%";
    document.documentElement.style.overflow = "auto";
    window.scrollTo(0, 0);

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.position = originalBodyPosition;
      document.body.style.top = originalBodyTop;
      document.body.style.width = originalBodyWidth;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PageHeader title="New collab" backUrl="/my-collaborations" />
      <div className="mx-auto w-full max-w-xl px-4 py-6">
        <CollaborationFormV2 />
      </div>
    </div>
  );
}
