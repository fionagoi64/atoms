import React from "react";
import { ATMOS_FACTS } from "../data/atmosData";

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal= ({ isOpen, onClose }:AboutModalProps) => {
  return (
    <>
      {/* Authentic Atmos Close Button */}
      <div
        onClick={onClose}
        className={`close-btn ${isOpen ? "close-btn--in" : ""}`}
        aria-label="Close About"
        role="button"
        tabIndex={0}
      >
        <div />
        <div />
      </div>

      {/* Slide & Fade About Content Panel */}
      <div className={`about ${isOpen ? "about--in" : ""}`}>
        <div className="about__content">
          <p className="about__p text-lg sm:text-xl font-light mb-12">
            Want to further your experience and learn more about the aviation
            industry? Check out these resources that Atmos is based upon.
          </p>

          <h2 className="font-newyork text-4xl sm:text-5xl uppercase tracking-wider font-normal mb-8 border-b border-white/20 pb-4">
            References
          </h2>

          <div className="divide-y divide-white/20 mb-16 border-t">
            {ATMOS_FACTS.map((fact, idx) => (
              <a
                key={idx}
                href={fact.source}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between py-4 group hover:opacity-75 transition-opacity"
              >
                <span className="font-medium tracking-wide text-sm sm:text-base uppercase">
                  {fact.title}
                </span>
                <span className="text-xs sm:text-sm text-white/80 font-light flex items-center gap-1">
                  See the source ↗
                </span>
              </a>
            ))}
          </div>

          <h2 className="font-newyork text-3xl sm:text-4xl uppercase tracking-wider font-normal mt-12 mb-6">
            Leeroy's Playground
          </h2>
          <p className="about__p text-base sm:text-lg font-light leading-relaxed mb-6">
            This experiment is part of{" "}
            <a
              href="https://play.leeroy.ca/"
              target="_blank"
              rel="noreferrer"
              className="underline font-medium inline-block hover:opacity-80"
            >
              Leeroy's Playground
            </a>
            , a creative space used to experiment technically, visually, while
            pushing boundaries of artistry and inventiveness.{" "}
            <a
              href="https://leeroy.ca/en"
              target="_blank"
              rel="noreferrer"
              className="underline font-medium ml-1 hover:opacity-80"
            >
              Web Agency
            </a>
          </p>

          <p className="about__p-music text-sm text-white/60 pt-4">
            Music by{" "}
            <a
              href="https://freemusicarchive.org/music/independent-music-licensing-collective-imlc/emotive-ambience-licensing-pack-ketsa"
              target="_blank"
              rel="noreferrer"
              className="underline text-white/80 hover:opacity-80"
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
