import { useRef, useCallback, useState, useEffect } from "react";
import { SoundButton } from "./SoundButton";
import { RollTitle } from "./RollTitle";

interface FlightHUDProps {
  progress: number;
  completion: number;
  isExploring: boolean;
  isAboutOpen: boolean;
  isEnded: boolean;
  onOpenAbout: () => void;
  onSeek?: (ratio: number) => void;
}

export const FlightHUD = ({
  progress,
  completion,
  isExploring,
  isAboutOpen,
  isEnded,
  onOpenAbout,
  onSeek,
}: FlightHUDProps) => {
  const scrollbarRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const [aboutBtnVisible, setAboutBtnVisible] = useState(true);

useEffect(() => {
    if (isAboutOpen) {
      setAboutBtnVisible(false);
    } else if (isExploring) {
      const timer = setTimeout(() => {
        setAboutBtnVisible(true);
      }, 1400);
      return () => clearTimeout(timer);
    }
  }, [isAboutOpen, isExploring]);

  const showScrollbar = isExploring && !isEnded && !isAboutOpen;
  const showHint = isExploring && progress < 0.02 && !isEnded && !isAboutOpen;

  // Handle clicking or dragging along the scrollbar track
  const handleSeekFromEvent = useCallback(
    (clientY: number) => {
      if (!scrollbarRef.current || !onSeek) return;
      const rect = scrollbarRef.current.getBoundingClientRect();
      const ratio = Math.max(
        0,
        Math.min(1, (clientY - rect.top) / rect.height),
      );
      onSeek(ratio);
    },
    [onSeek],
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
      {/* Sound button on top-left */}
      <div className={`sound-btn ${isExploring ? "sound-btn--in" : ""}`}>
        <SoundButton />
      </div>

      {/* About button on top-right with 3D flip text */}
      <button
        onClick={onOpenAbout}
        className={`about-btn ${isExploring && !isAboutOpen && aboutBtnVisible ? "about-btn--in" : ""}`}
        aria-label="Open About"
      >
        <RollTitle text="About" />
      </button>

      {/* Center hint: "Scroll to begin the journey" */}
      <div className={`hint ${showHint ? "hint--in" : "hint--out"}`}>
        Scroll to begin the journey
      </div>

      {/* Authentic Atmos 2px vertical right scrollbar */}
      <div
        ref={scrollbarRef}
        onClick={handleTrackClick}
        className={`vsh-scrollbar-0 ${showScrollbar ? "vsh-scrollbar-0--in" : ""}`}
      >
        <div
          onMouseDown={handleMouseDown}
          className="vsh-scrollbar__handle-0"
          style={{
            transform: `translate3d(0, ${Math.min(900, Math.max(0, completion * 900))}%, 0)`,
          }}
        />
      </div>
    </>
  );
};

export default FlightHUD;
