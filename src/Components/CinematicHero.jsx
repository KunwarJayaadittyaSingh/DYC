import React, { useRef } from "react";
import useScrollLinked from "../hooks/useScrollLinked";
import LazyVideo from "./LazyVideo";

const clamp = (v) => Math.min(Math.max(v, 0), 1);

const CinematicHero = ({ videoSrc, heroWord, belowText }) => {
  const sectionRef = useRef(null);
  const videoWrapRef = useRef(null);
  const heroWordRef = useRef(null);
  const belowTextRef = useRef(null);

  // Scroll animation: writes styles straight to the elements (no React re-render)
  useScrollLinked(sectionRef, (rect) => {
    const progress = clamp(-rect.top / (rect.height * 0.8));

    // Video animation
    const videoScale = 1 - progress * 0.35;
    const videoSkew = progress * 6;
    const videoOpacityFade = 1 - progress * 0.15;

    // Main hero word animation
    const heroWordOpacity = 1 - Math.min(progress * 2.2, 1);
    const heroWordY = progress * -60;

    // Bottom text animation
    const belowTextOpacity = Math.min(progress * 2, 1);
    const belowTextY = (1 - Math.min(progress * 2, 1)) * 60;
    const belowTextBlur = (1 - Math.min(progress * 2, 1)) * 8;

    if (videoWrapRef.current) {
      videoWrapRef.current.style.transform = `perspective(1200px) scale(${videoScale}) rotateX(${videoSkew}deg)`;
      videoWrapRef.current.style.opacity = videoOpacityFade;
    }

    if (heroWordRef.current) {
      heroWordRef.current.style.opacity = heroWordOpacity;
      heroWordRef.current.style.transform = `translate3d(0, ${heroWordY}px, 0)`;
    }

    if (belowTextRef.current) {
      belowTextRef.current.style.opacity = belowTextOpacity;
      belowTextRef.current.style.transform = `translate3d(0, ${belowTextY}px, 0)`;
      belowTextRef.current.style.filter = `blur(${belowTextBlur}px)`;
    }
  });

  return (
    <section
      ref={sectionRef}
      className="relative h-[180vh] w-full bg-transparent"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">

        {/* Background Video */}
        <div
          ref={videoWrapRef}
          className="absolute inset-0 flex items-center justify-center will-change-transform"
          style={{ transformOrigin: "center top" }}
        >
          <LazyVideo
            eager
            src={videoSrc}
            className="h-full w-full object-cover"
          />
        </div>

        {/* Main Hero Word */}
        <h1
          ref={heroWordRef}
          className="pointer-events-none absolute inset-0 flex items-center justify-center text-[18vw] font-black uppercase text-white mix-blend-difference will-change-transform"
        >
          {heroWord}
        </h1>

        {/* Bottom Text */}
        <div
          ref={belowTextRef}
          className="pointer-events-none absolute bottom-[12%] left-0 right-0 z-10 flex justify-center px-6 will-change-transform"
          style={{ opacity: 0 }}
        >
          <h2 className="text-center text-[7vw] font-sans font-bold uppercase leading-[0.95] text-white md:text-[3.5vw]">
            {belowText}
          </h2>
        </div>

      </div>
    </section>
  );
};

export default CinematicHero;