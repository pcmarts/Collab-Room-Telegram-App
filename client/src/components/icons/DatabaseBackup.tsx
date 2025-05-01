
import { LucideProps } from 'lucide-react';

export default function DatabaseBackup(props: LucideProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <ellipse cx="12" cy="5" rx="9" ry="3"/>
      <path d="M3 5v14c0 1.4 3 3 9 3"/>
      <path d="M21 5v8"/>
      <path d="M3 12c0 1.4 3 3 9 3"/>
      <path d="M18 16.5V18"/>
      <path d="M15 19h6"/>
      <path d="m18 22-3-3 3-3"/>
    </svg>
  );
}
