/**
 * Accessible tooltip component with keyboard support.
 * Shows contextual information on hover or focus.
 */

"use client";

import { useState, useRef, useEffect, useCallback, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type TooltipPosition = "top" | "bottom" | "left" | "right";

interface TooltipProps {
  /** Content to show in the tooltip */
  content: ReactNode;
  /** Element that triggers the tooltip */
  children: ReactNode;
  /** Position of the tooltip relative to trigger */
  position?: TooltipPosition;
  /** Delay before showing tooltip (ms) */
  delay?: number;
  /** Additional CSS classes for the tooltip */
  className?: string;
  /** Disable the tooltip */
  disabled?: boolean;
}

const positionClasses: Record<TooltipPosition, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

const arrowClasses: Record<TooltipPosition, string> = {
  top: "top-full left-1/2 -translate-x-1/2 border-t-zinc-800 border-x-transparent border-b-transparent",
  bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-zinc-800 border-x-transparent border-t-transparent",
  left: "left-full top-1/2 -translate-y-1/2 border-l-zinc-800 border-y-transparent border-r-transparent",
  right: "right-full top-1/2 -translate-y-1/2 border-r-zinc-800 border-y-transparent border-l-transparent",
};

/**
 * Displays contextual information when hovering or focusing an element.
 *
 * @example
 * ```tsx
 * <Tooltip content="Edit this item">
 *   <button>
 *     <EditIcon />
 *   </button>
 * </Tooltip>
 * ```
 */
export function Tooltip({
  content,
  children,
  position = "top",
  delay = 300,
  className,
  disabled = false,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipId = useRef(`tooltip-${Math.random().toString(36).slice(2, 9)}`);

  const showTooltip = useCallback(() => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => {
      setShouldRender(true);
      // Small delay for animation
      requestAnimationFrame(() => setIsVisible(true));
    }, delay);
  }, [delay, disabled]);

  const hideTooltip = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
    // Wait for fade out animation
    setTimeout(() => setShouldRender(false), 150);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isVisible) {
        hideTooltip();
      }
    };

    if (isVisible) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isVisible, hideTooltip]);

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {/* Trigger element */}
      <div aria-describedby={isVisible ? tooltipId.current : undefined}>
        {children}
      </div>

      {/* Tooltip */}
      {shouldRender && (
        <div
          id={tooltipId.current}
          role="tooltip"
          className={cn(
            "absolute z-50 pointer-events-none",
            "px-3 py-1.5 rounded-lg",
            "bg-zinc-800 text-zinc-200 text-sm font-medium",
            "shadow-lg shadow-black/20",
            "border border-zinc-700/50",
            "whitespace-nowrap",
            "transition-all duration-150 ease-out",
            isVisible
              ? "opacity-100 scale-100"
              : "opacity-0 scale-95",
            positionClasses[position],
            className
          )}
        >
          {content}
          {/* Arrow */}
          <span
            className={cn(
              "absolute w-0 h-0 border-[6px]",
              arrowClasses[position]
            )}
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  );
}

/**
 * Simple tooltip trigger that wraps an icon button.
 * Ensures proper accessibility for icon-only buttons.
 */
export function TooltipIconButton({
  tooltip,
  children,
  className,
  onClick,
  position = "top",
  disabled = false,
  ...props
}: {
  tooltip: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  position?: TooltipPosition;
  disabled?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <Tooltip content={tooltip} position={position} disabled={disabled}>
      <button
        type="button"
        className={cn(
          "inline-flex items-center justify-center",
          "h-9 w-9 rounded-lg",
          "text-zinc-400 hover:text-zinc-200",
          "hover:bg-white/[0.06] active:bg-white/10",
          "transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900",
          "disabled:opacity-50 disabled:pointer-events-none",
          className
        )}
        onClick={onClick}
        disabled={disabled}
        aria-label={tooltip}
        {...props}
      >
        {children}
      </button>
    </Tooltip>
  );
}
