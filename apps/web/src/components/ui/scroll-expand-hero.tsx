'use client';

import {
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { motion } from 'framer-motion';
import { EtheralShadow } from '@/components/ui/etheral-shadow';

interface ScrollExpandHeroProps {
  title: string;
  subtitle?: string;
  scrollHint?: string;
  children?: ReactNode;
}

export function ScrollExpandHero({
  title,
  subtitle,
  scrollHint = 'Scroll to explore',
  children,
}: ScrollExpandHeroProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const [fullyExpanded, setFullyExpanded] = useState(false);
  const [touchStartY, setTouchStartY] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (fullyExpanded && e.deltaY < 0 && window.scrollY <= 5) {
        setFullyExpanded(false);
        setShowContent(false);
        e.preventDefault();
      } else if (!fullyExpanded) {
        e.preventDefault();
        const delta = e.deltaY * 0.001;
        const next = Math.min(Math.max(scrollProgress + delta, 0), 1);
        setScrollProgress(next);
        if (next >= 1) {
          setFullyExpanded(true);
          setShowContent(true);
        } else if (next < 0.75) {
          setShowContent(false);
        }
      }
    };

    const handleTouchStart = (e: globalThis.TouchEvent) => {
      setTouchStartY(e.touches[0].clientY);
    };

    const handleTouchMove = (e: globalThis.TouchEvent) => {
      if (!touchStartY) return;
      const touchY = e.touches[0].clientY;
      const deltaY = touchStartY - touchY;

      if (fullyExpanded && deltaY < -20 && window.scrollY <= 5) {
        setFullyExpanded(false);
        setShowContent(false);
        e.preventDefault();
      } else if (!fullyExpanded) {
        e.preventDefault();
        const factor = deltaY < 0 ? 0.008 : 0.005;
        const next = Math.min(Math.max(scrollProgress + deltaY * factor, 0), 1);
        setScrollProgress(next);
        if (next >= 1) {
          setFullyExpanded(true);
          setShowContent(true);
        } else if (next < 0.75) {
          setShowContent(false);
        }
        setTouchStartY(touchY);
      }
    };

    const handleTouchEnd = () => setTouchStartY(0);

    const handleScroll = () => {
      if (!fullyExpanded) window.scrollTo(0, 0);
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [scrollProgress, fullyExpanded, touchStartY]);

  const panelWidth = 320 + scrollProgress * (isMobile ? 600 : 1200);
  const panelHeight = 380 + scrollProgress * (isMobile ? 220 : 420);
  const textSlide = scrollProgress * (isMobile ? 150 : 120);
  const borderRadius = Math.max(24 - scrollProgress * 24, 0);

  const words = title.split(' ');
  const firstLine = words.slice(0, Math.ceil(words.length / 2)).join(' ');
  const secondLine = words.slice(Math.ceil(words.length / 2)).join(' ');

  return (
    <div className="overflow-x-hidden">
      <section className="relative flex flex-col items-center justify-start min-h-[100dvh]">
        <div className="relative w-full flex flex-col items-center min-h-[100dvh]">
          {/* Dark background that fades */}
          <motion.div
            className="absolute inset-0 z-0"
            animate={{ opacity: 1 - scrollProgress * 0.8 }}
            transition={{ duration: 0.05 }}
          >
            <div className="w-full h-full bg-surface-950" />
            <div className="absolute inset-0 bg-gradient-to-b from-primary-900/20 via-transparent to-accent-900/10" />
          </motion.div>

          <div className="w-full flex flex-col items-center justify-start relative z-10">
            <div className="flex flex-col items-center justify-center w-full h-[100dvh] relative">
              {/* Expanding panel with EtheralShadow */}
              <div
                className="absolute z-0 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden"
                style={{
                  width: `${panelWidth}px`,
                  height: `${panelHeight}px`,
                  maxWidth: '100vw',
                  maxHeight: '100vh',
                  borderRadius: `${borderRadius}px`,
                  boxShadow: scrollProgress < 0.95
                    ? `0 0 ${60 + scrollProgress * 40}px rgba(99, 102, 241, ${0.15 + scrollProgress * 0.1})`
                    : 'none',
                }}
              >
                <EtheralShadow
                  color="rgba(99, 102, 241, 0.6)"
                  animation={{ scale: 50, speed: 40 }}
                  noise={{ opacity: 0.4, scale: 1.2 }}
                  sizing="fill"
                />
                {/* Gradient overlay on expanding panel */}
                <div className="absolute inset-0 bg-gradient-to-br from-surface-950/80 via-surface-950/40 to-surface-950/80" />
              </div>

              {/* Title text that splits apart */}
              <div className="flex items-center justify-center text-center gap-3 md:gap-4 w-full relative z-10 flex-col mix-blend-difference pointer-events-none">
                <motion.h1
                  className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white font-[family-name:var(--font-display)]"
                  style={{ transform: `translateX(-${textSlide}vw)` }}
                >
                  {firstLine}
                </motion.h1>
                <motion.h1
                  className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white font-[family-name:var(--font-display)]"
                  style={{ transform: `translateX(${textSlide}vw)` }}
                >
                  {secondLine}
                </motion.h1>
              </div>

              {/* Subtitle and scroll hint below the panel */}
              <div className="flex flex-col items-center text-center relative z-10 mt-6">
                {subtitle && (
                  <motion.p
                    className="text-lg text-surface-400 max-w-md px-4"
                    animate={{ opacity: 1 - scrollProgress * 2 }}
                    transition={{ duration: 0.05 }}
                  >
                    {subtitle}
                  </motion.p>
                )}
                {scrollHint && (
                  <motion.div
                    className="mt-4 flex flex-col items-center gap-2"
                    animate={{ opacity: 1 - scrollProgress * 3 }}
                    transition={{ duration: 0.05 }}
                  >
                    <p className="text-sm text-surface-500 font-medium tracking-wider uppercase">
                      {scrollHint}
                    </p>
                    <motion.div
                      className="w-5 h-8 rounded-full border-2 border-surface-600 flex items-start justify-center p-1"
                      animate={{ opacity: 1 - scrollProgress * 3 }}
                    >
                      <motion.div
                        className="w-1 h-2 rounded-full bg-surface-400"
                        animate={{ y: [0, 8, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      />
                    </motion.div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Content revealed after expansion */}
            <motion.div
              className="flex flex-col w-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: showContent ? 1 : 0 }}
              transition={{ duration: 0.7 }}
            >
              {children}
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
