import React, { forwardRef } from "react";
import { LuCopy } from "react-icons/lu";

export const DiscoveryIcon = forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>((props, ref) => {
  return <LuCopy ref={ref} {...props} />;
});