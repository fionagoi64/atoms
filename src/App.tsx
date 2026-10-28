import React, { useState, useEffect, useCallback } from "react";
import { AtmosCanvas } from "./components/AtmosCanvas";
import { Header } from "./components/Header";
import { IntroScreen } from "./components/IntroScreen";
import { FlightHUD } from "./components/FlightHUD";
import { AboutModal } from "./components/AboutModal";
import { OutroScreen } from "./components/OutroScreen";
import { cn } from "./utils/cn";
import gsap from "gsap";

export const App = () => {
  const [isExploring, setIsExploring] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [isOutroVisible, setIsOutroVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completion, setCompletion] = useState(0);
  const [seekRatio, setSeekRatio] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = -(e.clientY / window.innerHeight) * 2 + 1;
    setMousePos({ x, y });
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  const handleStartExplore = () => {
    setIsExploring(true);
  };

  const handleProgressChange = useCallback(
    (prog: number, comp: number) => {
      setProgress(prog);
      setCompletion(comp);
      if (prog >= 0.95 && !isEnded) {
        setIsEnded(true);
      }
    },
    [isEnded],
  );

  const handleSeek = (ratio: number) => {
    setSeekRatio(ratio);
  };

  // Atmos Ending Restart Flow: Fades body to white/transparent and reloads page
  const handleRestart = () => {
    gsap.to(document.body, {
      opacity: 0,
      duration: 1.0,
      ease: "none",
      onComplete: () => {
        window.location.reload();
      },
    });
  };

  const [aboutScrollRatio, setAboutScrollRatio] = useState(0);
  const [aboutSeekRatio, setAboutSeekRatio] = useState<number | null>(null);

  const handleSeekAbout = (ratio: number) => {
    setAboutSeekRatio(ratio);
  };

  const handleResetFlight = () => {
    setIsExploring(false);
    setIsAboutOpen(false);
    setIsEnded(false);
    setIsOutroVisible(false);
    setSeekRatio(0);
    setAboutScrollRatio(0);
    setAboutSeekRatio(0);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden select-none">
      <AtmosCanvas
        isExploring={isExploring}
        isAboutOpen={isAboutOpen}
        mousePos={mousePos}
        seekRatio={seekRatio}
        onProgressChange={handleProgressChange}
        onExploreStart={handleStartExplore}
        onEndReached={() => setIsOutroVisible(true)}
      />

      <div
        className={cn(
          "flight-glow pointer-events-none transition-opacity duration-1000",
          isExploring && !isEnded && !isAboutOpen ? "opacity-100" : "opacity-0",
        )}
      />

      <IntroScreen
        isExploring={isExploring}
        onExplore={handleStartExplore}
        onReset={handleResetFlight}
      />

      <Header
        isExploring={isExploring}
        isAboutOpen={isAboutOpen}
        isEnded={isEnded}
        onOpenAbout={() => setIsAboutOpen(true)}
      />

      <FlightHUD
        progress={progress}
        completion={completion}
        aboutScrollRatio={aboutScrollRatio}
        isExploring={isExploring}
        isAboutOpen={isAboutOpen}
        isEnded={isEnded}
        onSeek={handleSeek}
        onSeekAbout={handleSeekAbout}
      />

      <OutroScreen isVisible={isOutroVisible} onRestart={handleRestart} />

      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
        seekRatio={aboutSeekRatio}
        onScrollRatioChange={setAboutScrollRatio}
      />
    </div>
  );
};

export default App;
