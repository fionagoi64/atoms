import { useEffect, useRef } from "react";
import lottie, { AnimationItem } from "lottie-web";
import { cn } from "../utils/cn";

interface LottieButtonProps {
  animationPath: string;
  onClick: () => void;
  className?: string;
  width?: number | string;
}

export const LottieButton = ({
  animationPath,
  onClick,
  className = "",
  width = 190,
}: LottieButtonProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<AnimationItem | null>(null);
  const clickedRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer: "svg",
      loop: false,
      autoplay: false,
      path: animationPath,
    });
    animRef.current = anim;

    return () => {
      anim.destroy();
      animRef.current = null;
    };
  }, [animationPath]);

  const handleMouseEnter = () => {
    if (animRef.current) {
      animRef.current.setDirection(1);
      animRef.current.play();
    }
  };

  const handleMouseLeave = () => {
    if (animRef.current && !clickedRef.current) {
      animRef.current.setDirection(-1);
      animRef.current.play();
    }
  };

  const handleClick = () => {
    clickedRef.current = true;
    if (animRef.current) {
      animRef.current.setDirection(1);
      animRef.current.play();
    }
    onClick();
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      className={cn(
        "cursor-pointer inline-block transition-transform hover:scale-105 active:scale-95",
        className,
      )}
      style={{ width }}
      role="button"
      tabIndex={0}
    />
  );
};
