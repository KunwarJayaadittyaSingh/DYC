import React, { useEffect, useRef, useState } from "react";

const CinematicHero = ({ videoSrc, heroWord, belowText }) => {
  const sectionRef = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let ticking = false;

    const update = () => {
      if (!sectionRef.current) return;

      const rect = sectionRef.current.getBoundingClientRect();

      const raw = -rect.top / (rect.height * 0.8);

      setProgress(Math.min(Math.max(raw, 0), 1));

      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll);

    update();

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Video animation
  const videoScale = 1 - progress * 0.35;
  const videoSkew = progress * 6;
  const videoOpacityFade = 1 - progress * 0.15;

  // Main hero word animation
  const heroWordOpacity = 1 - Math.min(progress * 2.2, 1);
  const heroWordY = progress * -60;

  // Bottom text animation
  const belowTextOpacity = Math.min(progress * 2, 1);
  const belowTextY =
    (1 - Math.min(progress * 2, 1)) * 60;

  const belowTextBlur =
    (1 - Math.min(progress * 2, 1)) * 8;

  return (
    <section
      ref={sectionRef}
      className="relative h-[180vh] w-full bg-transparent"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">

        {/* Background Video */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `scale(${videoScale}) perspective(1200px) rotateX(${videoSkew}deg)`,
            opacity: videoOpacityFade,
            transformOrigin: "center top",
          }}
        >
          <video
            src={videoSrc}
            className="h-full w-full object-cover"
            autoPlay
            loop
            muted
            playsInline
          />
        </div>

        {/* Main Hero Word */}
        <h1
          className="pointer-events-none absolute inset-0 flex items-center justify-center text-[18vw] font-black uppercase text-white mix-blend-difference"
          style={{
            opacity: heroWordOpacity,
            transform: `translateY(${heroWordY}px)`,
          }}
        >
          {heroWord}
        </h1>

        {/* Bottom Text */}
        <div
          className="pointer-events-none absolute bottom-[12%] left-0 right-0 z-10 flex justify-center px-6"
          style={{
            opacity: belowTextOpacity,
            transform: `translateY(${belowTextY}px)`,
            filter: `blur(${belowTextBlur}px)`,
          }}
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