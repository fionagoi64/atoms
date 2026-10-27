import React, { useState, useEffect, useRef } from "react";
import { ATMOS_FACTS } from "../data/atmosData";
import { RollTitle } from "./RollTitle";
import gsap from "gsap";

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  seekRatio?: number | null;
  onScrollRatioChange?: (ratio: number) => void;
}

export const AboutModal = ({
  isOpen,
  onClose,
  seekRatio,
  onScrollRatioChange,
}: AboutModalProps) => {
  const [isClosing, setIsClosing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const aboutContainerRef = useRef<HTMLDivElement>(null);

  // Position the close button aligned to ATMOS title centerline
  const positionCloseBtn = () => {
    const title = document.querySelector(".intro__title");
    const closeBtn = document.querySelector(".close-btn") as HTMLElement | null;
    if (title && closeBtn) {
      const n = title.getBoundingClientRect();
      const r = n.height / 2 + n.top;
      closeBtn.style.top = `calc(${r}px - 15px)`;
    }
  };

  // External seek from the universal scrollbar
  useEffect(() => {
    if (
      seekRatio !== null &&
      seekRatio !== undefined &&
      aboutContainerRef.current
    ) {
      const target = aboutContainerRef.current;
      const maxScroll = target.scrollHeight - target.clientHeight;
      if (maxScroll > 0) {
        target.scrollTop = seekRatio * maxScroll;
      }
    }
  }, [seekRatio]);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      setIsClosing(false);
      if (onScrollRatioChange) {
        onScrollRatioChange(0);
      }

      // Reset scroll position to top
      if (aboutContainerRef.current) {
        aboutContainerRef.current.scrollTop = 0;
      }

      requestAnimationFrame(() => {
        positionCloseBtn();

        // Exact Leeroy domIntro() GSAP Animation:
        // Set initial positions
        gsap.set(aboutContainerRef.current, { opacity: 1 });
        gsap.set(
          [
            ".about__p",
            ".about__h2-ref",
            ".reference",
            ".about__h2-leeroy",
            ".about__p-leeroy",
            ".about__p-music",
          ],
          {
            opacity: 0,
            y: 20,
          },
        );
        gsap.set(".source-link", {
          opacity: 0,
          x: 20,
        });

        // Exact Leeroy domIntro(): starts at delay: 1.0s (halfway through the 2.0s background wave transition)
        const tl = gsap.timeline({
          delay: 1.0,
          defaults: {
            ease: "power2.out",
            duration: 1.0,
            y: 0,
            x: 0,
            opacity: 1,
          },
        });
        tl.to(".about__p", {}, "<+=.2");
        tl.to(".about__h2-ref", {}, "<+=.2");
        tl.to(".reference", { stagger: 0.05, duration: 1.0 }, "<+=.2");
        tl.to(".source-link", { stagger: 0.05, duration: 1.0 }, "<+=.5");
        tl.to(".about__h2-leeroy", {}, ">-=1");
        tl.to(".about__p-leeroy", {}, "<+=.2");
        tl.to(".about__p-music", {}, "<+=.2");
      });
    } else if (mounted) {
      setIsClosing(true);
      // Fade out About DOM cleanly
      if (aboutContainerRef.current) {
        gsap.to(aboutContainerRef.current, {
          opacity: 0,
          duration: 0.6,
          ease: "power2.inOut",
        });
      }

      // Smoothly restore ATMOS title opacity
      const title = document.querySelector(
        ".intro__title",
      ) as HTMLElement | null;
      if (title) {
        gsap.to(title, { opacity: 1, duration: 1, delay: 0.4, ease: "none" });
      }

      const timer = setTimeout(() => {
        setMounted(false);
        setIsClosing(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle scroll in About container:
  // Dynamically fades out ATMOS title: opacity = Math.max(0, 1 - 10 * completion)
  // And informs the single universal scrollbar
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const maxScroll = target.scrollHeight - target.clientHeight;
    const comp = maxScroll > 0 ? target.scrollTop / maxScroll : 0;
    if (onScrollRatioChange) {
      onScrollRatioChange(comp);
    }

    const title = document.querySelector(".intro__title") as HTMLElement | null;
    if (title && !isClosing) {
      title.style.opacity = String(Math.max(0, 1 - 10 * comp));
    }
  };

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    onClose();
  };

  if (!isOpen && !mounted) return null;

  const showIn = isOpen && !isClosing;

  return (
    <>
      {/* Authentic Atmos 45deg Close Button with 2-line sequential draw animation and hover spin */}
      <div
        onClick={handleClose}
        className={`close-btn ${showIn ? "close-btn--in" : isClosing ? "close-btn--out" : ""}`}
        aria-label="Close About"
        role="button"
        tabIndex={0}
      >
        <div />
        <div />
      </div>

      {/* Slide & Fade About Content Panel */}
      <div
        ref={aboutContainerRef}
        onScroll={handleScroll}
        className={`about ${showIn ? "about--in" : isClosing ? "about--out" : ""}`}
      >
        <div className="about__content">
          <p className="about__p">
            Want to further your experience and learn more about the aviation
            industry? Check out these resources that Atmos is based upon.
          </p>

          <h2 className="about__h2-ref font-newyork">REFERENCES</h2>

          <div className="references">
            {ATMOS_FACTS.map((fact, idx) => (
              <a
                key={idx}
                href={fact.source}
                target="_blank"
                rel="noreferrer"
                className="reference"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <div className="reference__title">{fact.title}</div>
                <div className="source-link">
                  <RollTitle
                    text="See the source"
                    isHovered={hoveredIdx === idx}
                  />
                  <span className="source-link__arrow" aria-hidden="true" />
                </div>
              </a>
            ))}
          </div>

          <h2 className="about__h2-leeroy font-newyork">LEEROY'S PLAYGROUND</h2>
          <p className="about__p-leeroy">
            This experiment is part of{" "}
            <a
              href="https://play.leeroy.ca/"
              target="_blank"
              rel="noreferrer"
              className="inline underline hover:opacity-80"
            >
              Leeroy's Playground
            </a>
            , a creative space used to experiment technically, visually, while
            pushing boundaries of artistry and inventiveness.{" "}
            <a
              href="https://leeroy.ca/en"
              target="_blank"
              rel="noreferrer"
              className="inline ml-1 underline hover:opacity-80"
            >
              Web Agency
            </a>
          </p>

          <p className="about__p-music">
            Music by{" "}
            <a
              href="https://freemusicarchive.org/music/independent-music-licensing-collective-imlc/emotive-ambience-licensing-pack-ketsa"
              target="_blank"
              rel="noreferrer"
              className="inline underline hover:opacity-80"
            >
              Ketsa
            </a>
          </p>

          {/* Generous bottom spacing matching Leeroy: allows comfortable scrolling past Ketsa with ~35vh empty breathing room */}
          <div
            className="about__bottom-spacer"
            style={{ height: "35vh", pointerEvents: "none" }}
          />
        </div>
      </div>
    </>
  );
};

export default AboutModal;
