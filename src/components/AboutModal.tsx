import React, { useState, useEffect } from "react";
import { ATMOS_FACTS } from "../data/atmosData";
import { RollTitle } from "./RollTitle";

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal = ({ isOpen, onClose }: AboutModalProps) => {
  const [isClosing, setIsClosing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      setIsClosing(false);
      requestAnimationFrame(() => {
        const title = document.querySelector(".intro__title");
        const closeBtn = document.querySelector(".close-btn") as HTMLElement | null;
        if (title && closeBtn) {
          const n = title.getBoundingClientRect();
          const r = n.height / 2 + n.top;
          closeBtn.style.top = `calc(${r}px - 15px)`;
        }
      });
    } else {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setMounted(false);
        setIsClosing(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    onClose();
  };

  if (!isOpen && !mounted) return null;

  const showIn = isOpen && !isClosing;

  return (
    <>
      {/* Authentic Atmos 45deg Close Button with 2-line sequential draw animation */}
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

      {/* Slide & Fade About Content Panel (Placed strictly on the right half on desktop) */}
      <div
        className={`about ${showIn ? "about--in" : isClosing ? "about--out" : ""}`}
      >
        <div className="about__content">
          <p className="about__p">
            Want to further your experience and learn more about the aviation
            industry? Check out these resources that Atmos is based upon.
          </p>

          <h2 className="font-newyork">REFERENCES</h2>

          <div className="references">
            {ATMOS_FACTS.map((fact, idx) => (
              <a
                key={idx}
                href={fact.source}
                target="_blank"
                rel="noreferrer"
                className="reference"
              >
                <div className="reference__title">{fact.title}</div>
                <div className="source-link">
                  <RollTitle text="See the source" />
                  <span className="source-link__arrow" aria-hidden="true" />
                </div>
              </a>
            ))}
          </div>

          <h2 className="font-newyork">LEEROY'S PLAYGROUND</h2>
          <p className="about__p">
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
        </div>
      </div>
    </>
  );
};

export default AboutModal;
