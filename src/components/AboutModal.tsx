import {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
} from "react";
import { ATMOS_FACTS } from "../data/facts";
import { RollTitle } from "./RollTitle";
import { cn } from "../utils/cn";
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
  const aboutContentRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  // Exact Leeroy Virtual Scroller Physics:
  // range: [0, 2500], lerpAmount: 0.1
  const targetYRef = useRef(0);
  const currentYRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);

  // Position the close button aligned to ATMOS title centerline
  const positionCloseBtn = () => {
    const title = document.querySelector(".intro-title");
    const closeBtn = document.querySelector(".close-btn") as HTMLElement | null;
    if (title && closeBtn) {
      const n = title.getBoundingClientRect();
      const r = n.height / 2 + n.top;
      closeBtn.style.top = `calc(${r}px - 15px)`;
    }
  };

  // Reposition close button on resize
  useEffect(() => {
    if (!isOpen) return;
    const handleResize = () => {
      positionCloseBtn();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen]);

  // External seek from the universal scrollbar track
  useEffect(() => {
    if (seekRatio !== null && seekRatio !== undefined) {
      targetYRef.current = seekRatio * 2500;
    }
  }, [seekRatio]);

  // Main Virtual Scroll animation loop
  const updateScroll = useCallback(() => {
    // Exact Leeroy lerpAmount: 0.1 (weighted, viscous damping)
    currentYRef.current += (targetYRef.current - currentYRef.current) * 0.1;
    const completion = Math.max(0, Math.min(1, currentYRef.current / 2500));

    // Translate .about-content element
    if (aboutContentRef.current) {
      const domHeight = aboutContentRef.current.offsetHeight;
      const windowHeight = window.innerHeight;
      const maxTranslate = Math.max(0, domHeight - windowHeight);
      const translateY = -completion * maxTranslate;
      aboutContentRef.current.style.transform = `translate3d(0, ${translateY}px, 0)`;
    }

    // Dynamic title opacity formula from Leeroy:
    // opacity = Math.max(0, 1 - 10 * completion)
    const title = document.querySelector(".intro-title") as HTMLElement | null;
    if (title && !isClosing) {
      title.style.opacity = String(Math.max(0, 1 - 10 * completion));
    }

    // Inform universal scrollbar of current thumb position
    if (onScrollRatioChange) {
      onScrollRatioChange(completion);
    }

    if (isOpen || Math.abs(targetYRef.current - currentYRef.current) > 0.05) {
      rafIdRef.current = requestAnimationFrame(updateScroll);
    }
  }, [isOpen, isClosing, onScrollRatioChange]);

  // Synchronous mount & animation setup before initial paint
  useLayoutEffect(() => {
    if (isOpen) {
      setMounted(true);
      setIsClosing(false);
      targetYRef.current = 0;
      currentYRef.current = 0;
      if (onScrollRatioChange) {
        onScrollRatioChange(0);
      }

      if (aboutContentRef.current) {
        aboutContentRef.current.style.transform = "translate3d(0, 0px, 0)";
      }

      // Start virtual scroll RAF loop
      rafIdRef.current = requestAnimationFrame(updateScroll);

      positionCloseBtn();

      // Cancel any ongoing timelines/tweens
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
      if (aboutContainerRef.current) {
        gsap.killTweensOf(aboutContainerRef.current);
        gsap.set(aboutContainerRef.current, { opacity: 1 });
      }

      // Exact Leeroy domIntro() GSAP Animation:
      // Synchronously set elements to invisible and shifted BEFORE first browser paint
      gsap.set(
        [
          ".about-intro",
          ".about-heading-ref",
          ".about-reference",
          ".about-heading-credits",
          ".about-text-credits",
          ".about-text-music",
        ],
        {
          opacity: 0,
          y: 20,
        },
      );
      gsap.set(".about-source-link", {
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
      tl.to(".about-intro", {}, "<+=.2");
      tl.to(".about-heading-ref", {}, "<+=.2");
      tl.to(".about-reference", { stagger: 0.05, duration: 1.0 }, "<+=.2");
      tl.to(".about-source-link", { stagger: 0.05, duration: 1.0 }, "<+=.5");
      tl.to(".about-heading-credits", {}, ">-=1");
      tl.to(".about-text-credits", {}, "<+=.2");
      tl.to(".about-text-music", {}, "<+=.2");
      timelineRef.current = tl;
    } else if (mounted) {
      setIsClosing(true);
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
      // Fade out About DOM cleanly
      if (aboutContainerRef.current) {
        gsap.killTweensOf(aboutContainerRef.current);
        gsap.to(aboutContainerRef.current, {
          opacity: 0,
          duration: 0.6,
          ease: "power2.inOut",
        });
      }

      // Smoothly restore ATMOS title opacity
      const title = document.querySelector(
        ".intro-title",
      ) as HTMLElement | null;
      if (title) {
        gsap.to(title, { opacity: 1, duration: 1, delay: 0.4, ease: "none" });
      }

      const timer = setTimeout(() => {
        setMounted(false);
        setIsClosing(false);
        if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      }, 1500);
      return () => clearTimeout(timer);
    }

    return () => {
      if (timelineRef.current) timelineRef.current.kill();
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [isOpen, updateScroll]);

  // Intercept wheel events with Leeroy scroll delta
  useEffect(() => {
    if (!isOpen || isClosing) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      let dy = e.deltaY;
      if (e.deltaMode === 1) dy *= 20;
      else if (e.deltaMode === 2) dy *= 100;

      // Authentic Leeroy wheel delta sensitivity
      targetYRef.current = Math.max(
        0,
        Math.min(2500, targetYRef.current + dy * 0.9),
      );

      if (!rafIdRef.current) {
        rafIdRef.current = requestAnimationFrame(updateScroll);
      }
    };

    let touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touchY = e.touches[0].clientY;
      const dy = touchStartY - touchY;
      touchStartY = touchY;
      targetYRef.current = Math.max(
        0,
        Math.min(2500, targetYRef.current + dy * 2.5),
      );
      if (!rafIdRef.current) {
        rafIdRef.current = requestAnimationFrame(updateScroll);
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [isOpen, isClosing, updateScroll]);

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
        className={cn(
          "close-btn",
          showIn ? "is-visible" : isClosing && "is-hidden",
        )}
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
        className={cn("about", showIn ? "is-open" : isClosing && "is-closing")}
      >
        <div ref={aboutContentRef} className="about-content">
          <p className="about-intro">
            Want to further your experience and learn more about the aviation
            industry? Check out these resources that Atmos is based upon.
          </p>

          <h2 className="about-heading-ref font-newyork">REFERENCES</h2>

          <div className="about-references">
            {ATMOS_FACTS.map((fact, idx) => (
              <a
                key={idx}
                href={fact.source}
                target="_blank"
                rel="noreferrer"
                className="about-reference"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <div className="about-reference-title">{fact.title}</div>
                <div className="about-source-link">
                  <RollTitle
                    text="See the source"
                    isHovered={hoveredIdx === idx}
                  />
                  <span className="about-source-arrow" aria-hidden="true" />
                </div>
              </a>
            ))}
          </div>

          <h2 className="about-heading-credits font-newyork">
            LEEROY'S PLAYGROUND
          </h2>
          <p className="about-text-credits">
            This experiment is part of{" "}
            <a
              href="https://play.leeroy.ca/"
              target="_blank"
              rel="noreferrer"
              style={{ display: "inline-block" }}
              className="underline hover:opacity-80"
            >
              Leeroy's Playground
            </a>
            , a creative space used to experiment technically, visually, while
            pushing boundaries of artistry and inventiveness.{" "}
            <a
              href="https://leeroy.ca/en"
              target="_blank"
              rel="noreferrer"
              className="underline hover:opacity-80"
            >
              Web Agency
            </a>
          </p>

          <p className="about-text-music">
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
