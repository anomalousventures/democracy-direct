import { Children, cloneElement, isValidElement, type ReactNode, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface SlotProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
}

function Slot({ children, ...slotProps }: SlotProps) {
  const child = Children.only(children);
  if (!isValidElement(child)) return null;

  const childProps = child.props as Record<string, unknown>;
  return cloneElement(child, {
    ...slotProps,
    ...childProps,
    className: cn(slotProps.className as string, childProps.className as string),
  } as Record<string, unknown>);
}

export { Slot };
