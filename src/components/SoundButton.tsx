import { useState, useRef, useEffect } from "react";

export const SoundButton = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio("/audio/bg_music.mp3");
    audio.loop = true;
    audio.volume = 0.4;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  const toggleSound = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((e) => {
          console.warn("Audio play error:", e);
        });
    }
  };

  return (
    <button
      onClick={toggleSound}
      title={isPlaying ? "Mute audio" : "Play ambient audio"}
      className="flex items-end gap-0.75 h-5 px-2 py-1 cursor-pointer transition-opacity hover:opacity-80 focus:outline-none"
      aria-label="Toggle Sound"
    >
      {[6, 12, 18, 10, 16, 20, 14, 8, 12, 6].map((h, i) => (
        <span
          key={i}
          className={`w-[1.5px] bg-white rounded-full transition-all duration-300 ${
            isPlaying ? "sound-bar" : "opacity-40"
          }`}
          style={{
            height: isPlaying ? `${h}px` : "4px",
            animationDelay: `${i * 0.12}s`,
          }}
        />
      ))}
    </button>
  );
};
