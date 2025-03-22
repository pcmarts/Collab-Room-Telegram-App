import { BaseCollabCard, BaseCollabCardProps } from "./BaseCollabCard";
import { Mail } from "lucide-react";

export function NewsletterCard({ data }: BaseCollabCardProps) {
  return <BaseCollabCard data={data} />;
}