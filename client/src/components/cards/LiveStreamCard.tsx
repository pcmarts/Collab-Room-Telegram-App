import { BaseCollabCard, BaseCollabCardProps } from "./BaseCollabCard";
import { Video } from "lucide-react";

export function LiveStreamCard({ data }: BaseCollabCardProps) {
  return <BaseCollabCard data={data} />;
}