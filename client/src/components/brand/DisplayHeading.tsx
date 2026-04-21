import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

interface DisplayHeadingProps {
  children: ReactNode;
  /** The accented word/phrase that gets the underline swoosh. Rendered after `children`. */
  accent?: ReactNode;
  className?: string;
  size?: "lg" | "xl" | "2xl";
  as?: "h1" | "h2";
}

/**
 * DisplayHeading — extrabold, tight tracking, display leading. The accented phrase
 * gets a hand-drawn underline swoosh, matching the "Web3 Collabs." treatment on
 * collabroom.xyz. Reserved for hero/celebration moments — do NOT use for section headers.
 */
export function DisplayHeading({
  children,
  accent,
  className,
  size = "xl",
  as: Tag = "h1",
}: DisplayHeadingProps) {
  const sizeClass = {
    lg: "text-2xl",
    xl: "text-3xl",
    "2xl": "text-4xl",
  }[size];

  return (
    <Tag
      className={cn(
        "font-extrabold tracking-tight text-text",
        "leading-[1.05]",
        sizeClass,
        className,
      )}
    >
      {children}
      {accent && (
        <>
          {children ? " " : null}
          <span className="relative inline-block text-brand">
            {accent}
            <svg
              className="absolute -bottom-1 left-0 h-2 w-full text-brand opacity-30"
              viewBox="0 0 200 9"
              preserveAspectRatio="none"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M2 6 C 50 2, 100 8, 198 4"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </>
      )}
    </Tag>
  );
}
