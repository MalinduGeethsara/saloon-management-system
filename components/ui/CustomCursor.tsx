"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

export default function CustomCursor() {
  const cursorDotRef = useRef<HTMLDivElement>(null);
  const cursorOuterRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(true);

  useEffect(() => {
    // Check if device supports fine pointers (desktops with mouse)
    const mediaQuery = window.matchMedia("(pointer: coarse)");
    
    const checkTouchDevice = () => {
      setIsTouchDevice(mediaQuery.matches);
      if (!mediaQuery.matches) {
        setIsVisible(true);
      }
    };

    checkTouchDevice();
    
    // Listen for media query changes (e.g. resizing or toggling emulation mode)
    mediaQuery.addEventListener("change", checkTouchDevice);

    if (mediaQuery.matches) {
      return () => {
        mediaQuery.removeEventListener("change", checkTouchDevice);
      };
    }

    const dot = cursorDotRef.current;
    const outer = cursorOuterRef.current;

    if (!dot || !outer) return;

    // Center the origin points
    gsap.set(dot, { xPercent: -50, yPercent: -50 });
    gsap.set(outer, { xPercent: -50, yPercent: -50 });

    // GSAP quickTo provides smooth interpolation for trailing effects
    const dotXTo = gsap.quickTo(dot, "x", { duration: 0.08, ease: "power3.out" });
    const dotYTo = gsap.quickTo(dot, "y", { duration: 0.08, ease: "power3.out" });

    const outerXTo = gsap.quickTo(outer, "x", { duration: 0.35, ease: "power3.out" });
    const outerYTo = gsap.quickTo(outer, "y", { duration: 0.35, ease: "power3.out" });

    const handleMouseMove = (e: MouseEvent) => {
      // Fade in cursor elements on first move
      if (dot.style.opacity === "0" || !dot.style.opacity) {
        gsap.to([dot, outer], { opacity: 1, duration: 0.3 });
      }
      dotXTo(e.clientX);
      dotYTo(e.clientY);
      outerXTo(e.clientX);
      outerYTo(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Keep cursor hidden initially until first movement
    gsap.set([dot, outer], { opacity: 0 });

    // Event delegation for hover states
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const isInteractive =
        target.closest("a") ||
        target.closest("button") ||
        target.closest(".interactive-hover") ||
        target.closest('[role="button"]') ||
        target.closest('input') ||
        target.closest('textarea') ||
        target.closest('select');

      if (isInteractive) {
        gsap.to(outer, {
          scale: 1.8,
          borderColor: "#d97706", // amber-600
          backgroundColor: "rgba(217, 119, 6, 0.12)",
          duration: 0.3,
          ease: "power2.out",
        });
        gsap.to(dot, {
          scale: 0,
          duration: 0.25,
        });
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const relatedTarget = e.relatedTarget as HTMLElement;
      const wasInteractive =
        target.closest("a") ||
        target.closest("button") ||
        target.closest(".interactive-hover") ||
        target.closest('[role="button"]') ||
        target.closest('input') ||
        target.closest('textarea') ||
        target.closest('select');

      const isStillInteractive =
        relatedTarget && (
          relatedTarget.closest("a") ||
          relatedTarget.closest("button") ||
          relatedTarget.closest(".interactive-hover") ||
          relatedTarget.closest('[role="button"]') ||
          relatedTarget.closest('input') ||
          relatedTarget.closest('textarea') ||
          relatedTarget.closest('select')
        );

      if (wasInteractive && !isStillInteractive) {
        gsap.to(outer, {
          scale: 1,
          borderColor: "rgba(217, 119, 6, 0.6)",
          backgroundColor: "transparent",
          duration: 0.3,
          ease: "power2.out",
        });
        gsap.to(dot, {
          scale: 1,
          duration: 0.25,
        });
      }
    };

    // Click micro-animations
    const handleMouseDown = () => {
      gsap.to(outer, {
        scale: 0.7,
        borderColor: "#d97706",
        duration: 0.12,
        ease: "power2.out",
      });
    };

    const handleMouseUp = () => {
      gsap.to(outer, {
        scale: 1,
        borderColor: "rgba(217, 119, 6, 0.6)",
        duration: 0.12,
        ease: "power2.out",
      });
    };

    // Hide cursor when leaving window
    const handleMouseLeave = () => {
      gsap.to([dot, outer], { opacity: 0, duration: 0.3 });
    };

    const handleMouseEnter = () => {
      gsap.to([dot, outer], { opacity: 1, duration: 0.3 });
    };

    window.addEventListener("mouseover", handleMouseOver);
    window.addEventListener("mouseout", handleMouseOut);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    // Apply custom cursor class to disable native cursors via CSS
    document.documentElement.classList.add("has-custom-cursor");

    return () => {
      mediaQuery.removeEventListener("change", checkTouchDevice);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
      window.removeEventListener("mouseout", handleMouseOut);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
      
      document.documentElement.classList.remove("has-custom-cursor");
    };
  }, [isTouchDevice]);

  if (isTouchDevice || !isVisible) return null;

  return (
    <>
      {/* Inner precise dot */}
      <div
        ref={cursorDotRef}
        className="fixed top-0 left-0 w-1.5 h-1.5 bg-amber-600 rounded-full pointer-events-none z-[99999] transition-[opacity] duration-300"
      />
      {/* Trailing larger ring */}
      <div
        ref={cursorOuterRef}
        className="fixed top-0 left-0 w-9 h-9 border border-amber-600/60 rounded-full pointer-events-none z-[99998] transition-[opacity] duration-300"
      />
    </>
  );
}
