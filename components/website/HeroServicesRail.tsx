"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRightOutlined } from '@ant-design/icons';

export interface RailService {
  id: string;
  name: string;
  price: number;
  duration: number;
  imageUrl?: string | null;
}

// Phone-only strip of services shown on top of the hero video, so visitors see what the salon
// offers on the very first screen instead of scrolling past a full-height video.
export default function HeroServicesRail({ services }: { services: RailService[] }) {
  if (services.length === 0) return null;

  return (
    <div className="relative z-20 w-full md:hidden pb-5">
      <div className="flex items-center justify-between px-1 mb-3">
        <span className="text-[11px] font-bold tracking-[0.25em] uppercase text-amber-400">Our Services</span>
        <Link href="/services" className="text-[11px] font-bold tracking-widest uppercase text-white/80 flex items-center gap-1.5">
          View all <ArrowRightOutlined className="text-[10px]" />
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory hide-scrollbar -mx-6 px-6 pb-1">
        {services.map((service) => (
          <Link
            key={service.id}
            href="/booking"
            className="snap-start shrink-0 w-[9.5rem] bg-black/45 backdrop-blur-md border border-white/15 text-left active:scale-[0.98] transition-transform"
          >
            <div className="relative h-20 bg-zinc-800 overflow-hidden">
              {service.imageUrl ? (
                <Image
                  src={service.imageUrl}
                  alt={service.name}
                  fill
                  sizes="152px"
                  className="object-cover"
                />
              ) : null}
            </div>
            <div className="p-2.5">
              <h4 className="text-[13px] font-bold text-white leading-tight line-clamp-1">{service.name}</h4>
              <div className="mt-1 flex items-center justify-between text-[11px] font-mono">
                <span className="text-amber-400">LKR {service.price.toLocaleString()}</span>
                <span className="text-white/60">{service.duration}m</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
