import React, { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface StepContainerProps {
  title: string;
  description?: string;
  children: ReactNode;
}

/**
 * Container component for each form step
 * Provides consistent UI with title and description
 */
export const StepContainer: React.FC<StepContainerProps> = ({
  title,
  description,
  children,
}) => {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && (
          <CardDescription className="text-sm">{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
};