import React, { ReactNode } from "react";
import { CollaborationTypePill } from "../CollaborationTypePill";

interface StepContainerProps {
  title: string;
  description?: string;
  children: ReactNode;
  selectedTypeId?: string;
}

export const StepContainer: React.FC<StepContainerProps> = ({
  title,
  description,
  children,
  selectedTypeId,
}) => {
  return (
    <section className="py-2">
      <header className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold tracking-tight text-text leading-tight">
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-sm text-text-muted leading-snug">
              {description}
            </p>
          )}
        </div>
        {selectedTypeId && (
          <div className="shrink-0">
            <CollaborationTypePill typeId={selectedTypeId} />
          </div>
        )}
      </header>
      <div>{children}</div>
    </section>
  );
};
