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
        <path d="M3 3L10 10L3 17L10 10z" />
        <path d="M14 3L21 10L14 17L21 10z" />
      </svg>
    );
  }
);

DiscoveryIcon.displayName = "DiscoveryIcon";

export { DiscoveryIcon };