import React, { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CollaborationTypePill } from "../CollaborationTypePill";

interface StepContainerProps {
  title: string;
  description?: string;
  children: ReactNode;
  selectedTypeId?: string; // Add prop for showing collaboration type pill
}

/**
 * Container component for each form step
 * Provides consistent UI with title and description
 * Shows collaboration type pill when a type is selected
 */
export const StepContainer: React.FC<StepContainerProps> = ({
  title,
  description,
  children,
  selectedTypeId,
}) => {
  return (
    <Card className="shadow-sm border-0">
      <CardHeader className="py-3 px-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{title}</CardTitle>
            {description && (
              <CardDescription className="text-sm mt-1">{description}</CardDescription>
            )}
          </div>
          {selectedTypeId && (
            <div className="ml-4">
              <CollaborationTypePill typeId={selectedTypeId} />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
};