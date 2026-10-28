import { useState, useEffect, useCallback } from "react";
import { SoundButton } from "./SoundButton";
import { RollTitle } from "./RollTitle";
import { cn } from "../utils/cn";

export interface HeaderProps {
  isExploring: boolean;
  isAboutOpen: boolean;
  isEnded: boolean;
  onOpenAbout: () => void;
}

export const Header = ({
  isExploring,
  isAboutOpen,
  isEnded,
  onOpenAbout,
}: HeaderProps) => {
  const [headerButtonsVisible, setHeaderButtonsVisible] = useState(false);
  const [aboutBtnVisible, setAboutBtnVisible] = useState(false);

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

  useEffect(() => {
    if (!isExploring) {
      setHeaderButtonsVisible(false);
      setAboutBtnVisible(false);
      const title = document.querySelector(".intro-title");
      if (title) title.classList.remove("no-transition");
      return;
    }

    const timer = setTimeout(() => {
      positionHeaderButtons();
      setHeaderButtonsVisible(true);
      setAboutBtnVisible(true);
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
      const timer = setTimeout(() => {
        positionHeaderButtons();
        setAboutBtnVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isAboutOpen, headerButtonsVisible, positionHeaderButtons]);

  return (
    <header className="header-nav pointer-events-none fixed top-0 left-0 w-full z-40">
      <SoundButton
        isExploring={isExploring}
        isVisible={headerButtonsVisible && !isEnded}
      />

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
    </header>
  );
};

export default Header;
