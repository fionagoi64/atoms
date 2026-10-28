import { useEffect, useState } from "react";
import { LottieButton } from "./LottieButton";
import { cn } from "../utils/cn";

interface IntroScreenProps {
  isExploring: boolean;
  onExplore: () => void;
  onReset?: () => void;
}

export const IntroScreen = ({ isExploring, onExplore }: IntroScreenProps) => {
  const [hasEntered, setHasEntered] = useState(false);

  useEffect(() => {
    // Stagger letter reveals as in Atmos original
    const timer = setTimeout(() => {
      setHasEntered(true);
    }, 120);
    return () => clearTimeout(timer);
  }, []);

  const letters = [
    { char: "A", delay: 400 },
    { char: "T", delay: 200 },
    { char: "M", delay: 300 },
    { char: "O", delay: 100 },
    { char: "S", delay: 0 },
  ];

  return (
    <div className={cn("intro", isExploring && "is-leaving")}>
      {/* Title */}
      <div className="intro-title">
        <h1>
          {letters.map(({ char, delay }, idx) => (
            <span
              key={idx}
              className={cn(hasEntered && "is-visible")}
              style={{ transitionDelay: `${delay}ms` }}
            >
              {char}
            </span>
          ))}
        </h1>
        {/* Rotating Circular Badge attached to S */}
        <div className={cn("intro-badge", hasEntered && "is-visible")} />
      </div>

      {/* Lottie Explore CTA */}
      <div
        className={cn("intro-cta", hasEntered && !isExploring && "is-visible")}
      >
        <LottieButton
          animationPath="/lottie/cta_explore.json"
          onClick={onExplore}
          width={190}
        />
      </div>
    </div>
  );
};

export default IntroScreen;
