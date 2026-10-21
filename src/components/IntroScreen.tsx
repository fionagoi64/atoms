import React, { useEffect, useState } from "react";
import { LottieButton } from "./LottieButton";

interface IntroScreenProps {
  isExploring: boolean;
  onExplore: () => void;
  onReset: () => void;
}

export const IntroScreen = ({
  isExploring,
  onExplore,
  onReset,
}: IntroScreenProps) => {
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
    <div className={`intro ${isExploring ? "intro--out" : ""}`}>
      {/* Title */}
      <div className="intro__title" onClick={isExploring ? onReset : undefined}>
        <h1>
          {letters.map(({ char, delay }, idx) => (
            <span
              key={idx}
              className={hasEntered ? "in" : ""}
              style={{ transitionDelay: `${delay}ms` }}
            >
              {char}
            </span>
          ))}
        </h1>
        {/* Rotating Circular Badge attached to S */}
        <div
          className={`intro__subtitle ${hasEntered ? "intro__subtitle--in" : ""}`}
        />
      </div>

      {/* Lottie Explore CTA */}
      <div
        className={`intro__cta ${hasEntered && !isExploring ? "intro__cta--in" : ""}`}
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
