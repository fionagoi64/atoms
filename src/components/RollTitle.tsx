import React, { useRef, useEffect } from "react";
import { cn } from "../utils/cn";
import gsap from "gsap";

interface RollTitleProps {
  text: string;
  className?: string;
  isHovered?: boolean;
  onClick?: () => void;
}

export const RollTitle = ({
  text,
  className = "",
  isHovered,
  onClick,
}: RollTitleProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const el1Ref = useRef<HTMLDivElement>(null);
  const el2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (el2Ref.current) {
      gsap.set(el2Ref.current, { opacity: 0, y: "50%", rotateX: -90 });
    }
  }, []);

  const rollIn = () => {
    if (!el1Ref.current || !el2Ref.current) return;
    gsap.to(el1Ref.current, {
      opacity: 0,
      y: "-50%",
      rotateX: 90,
      duration: 0.45,
      ease: "power2.inOut",
      overwrite: "auto",
    });
    gsap.to(el2Ref.current, {
      opacity: 1,
      y: "0%",
      rotateX: 0,
      duration: 0.45,
      ease: "power2.inOut",
      overwrite: "auto",
    });
  };

  const rollOut = () => {
    if (!el1Ref.current || !el2Ref.current) return;
    gsap.to(el1Ref.current, {
      opacity: 1,
      y: "0%",
      rotateX: 0,
      duration: 0.45,
      ease: "power2.inOut",
      overwrite: "auto",
    });
    gsap.to(el2Ref.current, {
      opacity: 0,
      y: "50%",
      rotateX: -90,
      duration: 0.45,
      ease: "power2.inOut",
      overwrite: "auto",
    });
  };

  useEffect(() => {
    if (isHovered !== undefined) {
      if (isHovered) {
        rollIn();
      } else {
        rollOut();
      }
    }
  }, [isHovered]);

  return (
    <div
      ref={containerRef}
      className={cn("roll-title", className)}
      onMouseEnter={isHovered === undefined ? rollIn : undefined}
      onMouseLeave={isHovered === undefined ? rollOut : undefined}
      onClick={onClick}
    >
      <div ref={el1Ref}>{text}</div>
      <div ref={el2Ref} data-content={text} />
    </div>
  );
};

export default RollTitle;
