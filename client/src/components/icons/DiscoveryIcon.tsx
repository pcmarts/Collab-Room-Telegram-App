import React, { forwardRef } from "react";
import { LuCopy } from "react-icons/lu";
import type { IconBaseProps } from "react-icons";

export const DiscoveryIcon = forwardRef<SVGSVGElement, IconBaseProps>((props, ref) => {
  // LuCopy's ref prop isn't typed for ForwardedRef, so widen the props bag.
  return <LuCopy {...(props as any)} ref={ref} />;
});