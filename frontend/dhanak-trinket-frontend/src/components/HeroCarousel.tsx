'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

interface HeroSlide {
    id: number;
    desktopImage?: string;
    mobileImage?: string;
    alt: string;
    // Fallback for slides without images
    title?: string;
    subtitle?: string;
    bgGradient?: string;
}

const SLIDES: HeroSlide[] = [
    {
        id: 1,
        desktopImage: '/hero/hero-1-desktop.webp',
        mobileImage: '/hero/hero-1-mobile.webp',
        alt: 'Timeless Elegance, Made for You — Ethnic finds for every day',
    },
    {
        id: 2,
        desktopImage: '/hero/hero-2-desktop.webp',
        mobileImage: '/hero/hero-2-mobile.webp',
        alt: 'Everyday Shine, Everyday You — Beautiful jewellery for every mood',
    },
    {
        id: 3,
        desktopImage: '/hero/hero-3-desktop.webp',
        mobileImage: '/hero/hero-3-mobile.webp',
        alt: 'Festive Glow, Made to Shine — Celebrate every moment with sparkle',
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
    const hasImage = slide.desktopImage && slide.mobileImage;

    const scrollToCatalog = () => {
        const el = document.getElementById('catalog');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <section
            className={`relative overflow-hidden ${hasImage ? 'bg-amber-50' : `bg-gradient-to-br ${slide.bgGradient}`} transition-colors duration-700`}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            {hasImage ? (
                /* Image-based slide — constrained height, full-width clickable */
                <div className="cursor-pointer" onClick={scrollToCatalog}>
                    {/* Desktop image */}
                    <Image
                        src={slide.desktopImage!}
                        alt={slide.alt}
                        width={985}
                        height={258}
                        priority={slide.id === 1}
                        className="hidden sm:block w-full h-auto"
                    />
                    {/* Mobile image */}
                    <Image
                        src={slide.mobileImage!}
                        alt={slide.alt}
                        width={986}
                        height={258}
                        priority={slide.id === 1}
                        className="block sm:hidden w-full h-auto"
                    />
                </div>
            ) : (
                /* Text-only fallback slide */
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 flex flex-col items-center text-center">
                    <div className="mb-4 text-amber-400/60 text-3xl">✦</div>
                    <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl text-gray-900 leading-tight whitespace-pre-line">
                        {slide.title}
                    </h2>
                    <p className="mt-4 text-base sm:text-lg text-gray-600 max-w-md">
                        {slide.subtitle}
                    </p>
                    <button
                        onClick={scrollToCatalog}
                        className="mt-8 px-8 py-3 bg-gray-900 text-white text-sm font-medium tracking-wider uppercase rounded-sm hover:bg-gray-800 transition-colors"
                    >
                        Explore Collection
                    </button>
                </div>
            )}

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
