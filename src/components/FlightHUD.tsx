import { useRef, useCallback, useState, useEffect } from "react";
import { SoundButton } from "./SoundButton";
import { RollTitle } from "./RollTitle";

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

  // Exact Leeroy header alignment: synchronizes sound-btn, about-btn, and close-btn to ATMOS title centerline
  useEffect(() => {
    const positionHeaderButtons = () => {
      const title = document.querySelector(".intro__title");
      const aboutBtn = document.querySelector(".about-btn") as HTMLElement | null;
      const soundBtn = document.querySelector(".sound-btn") as HTMLElement | null;
      const closeBtn = document.querySelector(".close-btn") as HTMLElement | null;
      if (!title) return;
      const n = title.getBoundingClientRect();
      const r = n.height / 2 + n.top;
      if (aboutBtn) aboutBtn.style.top = `calc(${r}px - 1rem)`;
      if (soundBtn) soundBtn.style.top = `calc(${r}px - 1rem)`;
      if (closeBtn) closeBtn.style.top = `calc(${r}px - 15px)`;
    };

    if (isExploring) {
      positionHeaderButtons();
      const t1 = setTimeout(positionHeaderButtons, 100);
      const t2 = setTimeout(positionHeaderButtons, 500);
      const t3 = setTimeout(positionHeaderButtons, 900);
      const handleResize = () => {
        positionHeaderButtons();
        setTimeout(positionHeaderButtons, 100);
      };
      window.addEventListener("resize", handleResize);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [isExploring, isAboutOpen]);

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
      <SoundButton isExploring={isExploring} />

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

      {/* Universal Atmos 2px vertical right scrollbar (shared by flight and about menu) */}
      <div
        ref={scrollbarRef}
        onClick={handleTrackClick}
        className={`vsh-scrollbar-0 ${showScrollbar ? "vsh-scrollbar-0--in" : ""}`}
      >
        <div
          onMouseDown={handleMouseDown}
          className="vsh-scrollbar__handle-0"
          style={{
            transform: `translate3d(0, ${Math.min(900, Math.max(0, currentRatio * 900))}%, 0)`,
          }}
        />
      </div>
    </>
  );
};

export default FlightHUD;
