"use client";

import { useEffect, useState } from "react";

export default function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      const totalHeight = scrollHeight - clientHeight;
      
      if (totalHeight > 0) {
        const scrolled = (window.scrollY / totalHeight) * 100;
        setProgress(scrolled);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-[3px] bg-transparent z-[999999] pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 transition-all duration-75 ease-out shadow-[0_0_10px_rgba(217,119,6,0.6)]"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
