'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

interface HeroSlide {
    id: number;
    desktopImage: string;
    mobileImage: string;
    alt: string;
}

const SLIDES: HeroSlide[] = [
    {
        id: 1,
        desktopImage: '/hero/hero-1-desktop.webp',
        mobileImage: '/hero/hero-1-mobile.webp',
        alt: 'Timeless Elegance, Made for You — Ethnic finds for every day',
    },
];

const AUTO_PLAY_MS = 5000;

export default function HeroCarousel() {
    const [current, setCurrent] = useState(0);
    const [paused, setPaused] = useState(false);

    const next = useCallback(() => {
        setCurrent((prev) => (prev + 1) % SLIDES.length);
    }, []);

    const goTo = (index: number) => setCurrent(index);

    useEffect(() => {
        if (paused) return;
        const timer = setInterval(next, AUTO_PLAY_MS);
        return () => clearInterval(timer);
    }, [paused, next]);

    const slide = SLIDES[current];

    const scrollToCatalog = () => {
        const el = document.getElementById('catalog');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <section
            className="relative overflow-hidden bg-amber-50 transition-colors duration-700"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            <div className="cursor-pointer max-h-[55vh] sm:max-h-[65vh] overflow-hidden" onClick={scrollToCatalog}>
                {/* Desktop image */}
                <Image
                    src={slide.desktopImage}
                    alt={slide.alt}
                    width={1672}
                    height={941}
                    priority={slide.id === 1}
                    className="hidden sm:block w-full h-auto object-cover object-top -mt-[55px]"
                />
                {/* Mobile image */}
                <Image
                    src={slide.mobileImage}
                    alt={slide.alt}
                    width={750}
                    height={500}
                    priority={slide.id === 1}
                    className="block sm:hidden w-full h-auto object-cover object-top"
                />
            </div>

            {/* Dots — only show if multiple slides */}
            {SLIDES.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {SLIDES.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => goTo(i)}
                            className={`h-2 rounded-full transition-all duration-300 ${i === current
                                ? 'w-6 bg-white/90 shadow-sm'
                                : 'w-2 bg-white/40 hover:bg-white/60'
                                }`}
                            aria-label={`Go to slide ${i + 1}`}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
