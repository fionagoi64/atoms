import React, { useRef, useCallback } from "react";
import { cn } from "../utils/cn";

export interface FlightHUDProps {
  progress: number;
  completion: number;
  aboutScrollRatio?: number;
  isExploring: boolean;
  isAboutOpen: boolean;
  isEnded: boolean;
  onSeek?: (ratio: number) => void;
  onSeekAbout?: (ratio: number) => void;
}

export const FlightHUD = ({
  progress,
  completion,
  aboutScrollRatio = 0,
  isExploring,
  isAboutOpen,
  isEnded,
  onSeek,
  onSeekAbout,
}: FlightHUDProps) => {
  const scrollbarRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const showScrollbar = (isExploring || isAboutOpen) && !isEnded;
  const currentRatio = isAboutOpen ? aboutScrollRatio : completion;
  const showHint = isExploring && progress < 0.02 && !isEnded && !isAboutOpen;

  // Handle clicking or dragging along the scrollbar track
  const handleSeekFromEvent = useCallback(
    (clientY: number) => {
      if (!scrollbarRef.current) return;
      const rect = scrollbarRef.current.getBoundingClientRect();
      const ratio = Math.max(
        0,
        Math.min(1, (clientY - rect.top) / rect.height),
      );
      if (isAboutOpen && onSeekAbout) {
        onSeekAbout(ratio);
      } else if (onSeek) {
        onSeek(ratio);
      }
    },
    [isAboutOpen, onSeek, onSeekAbout],
  );

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    handleSeekFromEvent(e.clientY);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    isDraggingRef.current = true;

    const onMouseMove = (ev: MouseEvent) => {
      if (isDraggingRef.current) {
        handleSeekFromEvent(ev.clientY);
      }
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  return (
    <>
      {/* Center hint: "Scroll to begin the journey" */}
      <div className={cn("hint", showHint ? "is-visible" : "is-hidden")}>
        Scroll to begin the journey
      </div>

      {/* Universal Atmos 2px vertical right scrollbar (shared by flight and about menu) */}
      <div
        ref={scrollbarRef}
        onClick={handleTrackClick}
        className={cn("scrollbar", showScrollbar && "is-visible")}
      >
        <div
          onMouseDown={handleMouseDown}
          className="scrollbar-handle"
          style={{
            transform: `translate3d(0, ${Math.min(900, Math.max(0, currentRatio * 900))}%, 0)`,
          }}
        />
      </div>
    </>
  );
};

export default FlightHUD;
