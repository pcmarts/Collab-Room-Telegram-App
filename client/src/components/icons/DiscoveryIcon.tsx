import * as React from "react";

export interface DiscoveryIconProps extends React.SVGProps<SVGSVGElement> {}

const DiscoveryIcon = React.forwardRef<SVGSVGElement, DiscoveryIconProps>(
  ({ className, ...props }, ref) => {
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
        className={className}
        ref={ref}
        {...props}
      >
        <path d="M4 4L12 4L12 12L4 12z" />
        <path d="M14 8L20 8L20 14L14 14z" />
        <path d="M8 14L14 14L14 20L8 20z" />
      </svg>
    );
  }
);

DiscoveryIcon.displayName = "DiscoveryIcon";

export { DiscoveryIcon };