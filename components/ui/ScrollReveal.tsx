"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

interface ScrollRevealProps {
  children: React.ReactNode;
  direction?: "up" | "down" | "left" | "right" | "fade";
  delay?: number;
  duration?: number;
  distance?: number;
  triggerHook?: string;
  className?: string;
}

export default function ScrollReveal({
  children,
  direction = "down", // Defaults to "down" so elements fall down into place
  delay = 0,
  duration = 1.2,
  distance = 40,
  triggerHook = "top 85%",
  className = "",
}: ScrollRevealProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Register GSAP ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    const el = elementRef.current;
    if (!el) return;

    let x = 0;
    let y = 0;

    switch (direction) {
      case "up":
        y = distance;
        break;
      case "down":
        y = -distance; // Negative starts it higher, so it falls down
        break;
      case "left":
        x = distance;
        break;
      case "right":
        x = -distance;
        break;
      default:
        break;
    }

    // Set initial position
    gsap.set(el, {
      opacity: 0,
      x: x,
      y: y,
    });

    // Create scroll trigger animation
    const anim = gsap.to(el, {
      opacity: 1,
      x: 0,
      y: 0,
      duration: duration,
      delay: delay,
      ease: "power3.out",
      scrollTrigger: {
        trigger: el,
        start: triggerHook,
        toggleActions: "play none none none", // Animate once
      },
    });

    return () => {
      anim.kill();
      if (anim.scrollTrigger) {
        anim.scrollTrigger.kill();
      }
    };
  }, [direction, delay, duration, distance, triggerHook]);

  return (
    <div ref={elementRef} className={`w-full ${className}`}>
      {children}
    </div>
  );
}
