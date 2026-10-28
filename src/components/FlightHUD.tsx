import { useRef, useCallback, useState, useEffect } from "react";
import { SoundButton } from "./SoundButton";
import { RollTitle } from "./RollTitle";
import { cn } from "../utils/cn";

interface FlightHUDProps {
  progress: number;
  completion: number;
  aboutScrollRatio?: number;
  isExploring: boolean;
  isAboutOpen: boolean;
  isEnded: boolean;
  onOpenAbout: () => void;
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
  onOpenAbout,
  onSeek,
  onSeekAbout,
}: FlightHUDProps) => {
  const scrollbarRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const [headerButtonsVisible, setHeaderButtonsVisible] = useState(false);
  const [aboutBtnVisible, setAboutBtnVisible] = useState(false);

  // Exact Leeroy header alignment: synchronizes sound-btn, about-btn, and close-btn to ATMOS title centerline
  const positionHeaderButtons = useCallback(() => {
    const title = document.querySelector(".intro-title");
    const aboutBtn = document.querySelector(".about-btn") as HTMLElement | null;
    const soundBtn = document.querySelector(".sound-btn") as HTMLElement | null;
    const closeBtn = document.querySelector(".close-btn") as HTMLElement | null;
    if (!title) return;
    const n = title.getBoundingClientRect();
    const r = n.height / 2 + n.top;
    if (aboutBtn) aboutBtn.style.top = `calc(${r}px - 1rem)`;
    if (soundBtn) soundBtn.style.top = `calc(${r}px - 1rem)`;
    if (closeBtn) closeBtn.style.top = `calc(${r}px - 15px)`;
  }, []);

  // 1:1 Authentic Leeroy Atmos header button entrance:
  // Buttons wait 1500ms until the ATMOS title has completely finished its transition
  // and settled at the top. At 1500ms, they are measured & positioned at the exact centerline,
  // and then fade in stationary directly at that position without jumping or sliding.
  useEffect(() => {
    if (!isExploring) {
      setHeaderButtonsVisible(false);
      setAboutBtnVisible(false);
      const title = document.querySelector(".intro-title");
      if (title) title.classList.remove("no-transition");
      return;
    }

    const timer = setTimeout(() => {
      // 1. Position buttons directly at the settled title centerline
      positionHeaderButtons();
      // 2. Make them visible so they fade in smoothly from this settled position
      setHeaderButtonsVisible(true);
      setAboutBtnVisible(true);
      // 3. Mark title as no-transition to prevent accidental transition on window resize
      const title = document.querySelector(".intro-title");
      if (title) title.classList.add("no-transition");
    }, 1500);

    const handleResize = () => {
      setTimeout(positionHeaderButtons, 100);
      setTimeout(positionHeaderButtons, 300);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
    };
  }, [isExploring, positionHeaderButtons]);

  // Handle About button visibility during About modal open/close
  useEffect(() => {
    if (!headerButtonsVisible) return;
    if (isAboutOpen) {
      setAboutBtnVisible(false);
    } else {
      // Fade About button back in stationary when modal closes
      const timer = setTimeout(() => {
        positionHeaderButtons();
        setAboutBtnVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isAboutOpen, headerButtonsVisible, positionHeaderButtons]);

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
      {/* Sound button on top-left (8 spans with authentic GSAP wave animation) */}
      <SoundButton
        isExploring={isExploring}
        isVisible={headerButtonsVisible && !isEnded}
      />

      {/* About button on top-right with 3D flip text */}
      <button
        onClick={onOpenAbout}
        className={cn(
          "about-btn",
          headerButtonsVisible &&
            !isAboutOpen &&
            aboutBtnVisible &&
            !isEnded &&
            "is-visible",
        )}
        aria-label="Open About"
      >
        <RollTitle text="About" />
      </button>

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
