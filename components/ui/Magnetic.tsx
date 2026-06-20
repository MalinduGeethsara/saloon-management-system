"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";

interface MagneticProps {
  children: React.ReactNode;
  range?: number;
  strength?: number;
  className?: string;
}

export default function Magnetic({
  children,
  range = 50,
  strength = 0.35,
  className = "",
}: MagneticProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      const distanceX = e.clientX - x;
      const distanceY = e.clientY - y;
      const distance = Math.hypot(distanceX, distanceY);

      if (distance < range) {
        // Magnet effect: attract towards mouse coordinates
        gsap.to(el, {
          x: distanceX * strength,
          y: distanceY * strength,
          duration: 0.3,
          ease: "power2.out",
        });
      } else {
        // Smoothly return to center
        gsap.to(el, {
          x: 0,
          y: 0,
          duration: 0.5,
          ease: "power3.out",
        });
      }
    };

    const handleMouseLeave = () => {
      gsap.to(el, {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: "power3.out",
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [range, strength]);

  return (
    <div ref={containerRef} className={`inline-block ${className}`}>
      {children}
    </div>
  );
}
