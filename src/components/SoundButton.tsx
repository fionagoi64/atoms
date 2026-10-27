import { useState, useRef, useEffect } from "react";
import gsap from "gsap";

interface SoundButtonProps {
  isExploring: boolean;
}

export const SoundButton = ({ isExploring }: SoundButtonProps) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const spansRef = useRef<(HTMLSpanElement | null)[]>([]);
  const tweensRef = useRef<gsap.core.Tween[]>([]);

  // 1:1 Authentic Leeroy Atmos GSAP Wave Animation:
  // Each span animates from scaleY: 0.1 to 1.0 with staggered delay = index / 5,
  // yoyo: true, repeat: -1, duration: 1.5, ease: "power1.inOut" creating the iconic smooth wave.
  const startBtnAnimation = () => {
    tweensRef.current.forEach((t) => t.kill());
    tweensRef.current = [];
    spansRef.current.forEach((span, t) => {
      if (!span) return;
      const tween = gsap.fromTo(
        span,
        { scaleY: 0.1 },
        {
          scaleY: 1,
          delay: t / 5,
          yoyo: true,
          repeat: -1,
          duration: 1.5,
          ease: "power1.inOut",
        },
      );
      tweensRef.current.push(tween);
    });
  };

  // 1:1 Authentic Leeroy Stop Animation:
  // Smoothly animates all 8 spans down to scaleY: 0.1
  const stopBtnAnimation = () => {
    tweensRef.current.forEach((t) => t.kill());
    tweensRef.current = [];
    spansRef.current.forEach((span) => {
      if (!span) return;
      const tween = gsap.to(span, {
        scaleY: 0.1,
        duration: 1,
        ease: "power1.inOut",
      });
      tweensRef.current.push(tween);
    });
  };

  useEffect(() => {
    const audio = new Audio("/audio/bg_music.mp3");
    audio.loop = true;
    audio.volume = 0.3;
    audioRef.current = audio;

    const isMuted = localStorage.getItem("atmos-mute") === "true";
    if (isMuted) {
      setIsPlaying(false);
    }

    return () => {
      audio.pause();
      tweensRef.current.forEach((t) => t.kill());
    };
  }, []);

  useEffect(() => {
    if (!audioRef.current) return;
    if (isExploring && isPlaying) {
      audioRef.current.play().catch(() => {});
      startBtnAnimation();
    } else if (!isPlaying) {
      stopBtnAnimation();
    }
  }, [isExploring, isPlaying]);

  const toggleSound = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      localStorage.setItem("atmos-mute", "true");
      audioRef.current.pause();
      stopBtnAnimation();
      setIsPlaying(false);
    } else {
      localStorage.setItem("atmos-mute", "false");
      audioRef.current.play().catch(() => {});
      startBtnAnimation();
      setIsPlaying(true);
    }
  };

  return (
    <div
      onClick={toggleSound}
      className={`sound-btn ${isExploring ? "sound-btn--in" : ""} ${isPlaying ? "sound-btn--on" : ""}`}
      title={isPlaying ? "Mute audio" : "Play ambient audio"}
      aria-label="Toggle Sound"
    >
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
        <span
          key={i}
          ref={(el) => {
            spansRef.current[i] = el;
          }}
        />
      ))}
    </div>
  );
};
