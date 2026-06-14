'use client';

import { useState, useEffect, useCallback } from 'react';

interface HeroSlide {
    id: number;
    title: string;
    subtitle: string;
    cta: string;
    bgGradient: string;
    // When real images are ready, add: desktopImage, mobileImage
}

const SLIDES: HeroSlide[] = [
    {
        id: 1,
        title: 'Timeless Elegance,\nMade for You',
        subtitle: "Ethnic finds you'll reach for every day.",
        cta: 'Explore Collection',
        bgGradient: 'from-amber-50 via-orange-50 to-rose-50',
    },
    {
        id: 2,
        title: 'Everyday Shine ✦',
        subtitle: 'Effortless jewellery for every moment.',
        cta: 'Explore Collection',
        bgGradient: 'from-rose-50 via-pink-50 to-amber-50',
    },
    {
        id: 3,
        title: 'Festive Glow ✨',
        subtitle: 'Shine brighter in every celebration.',
        cta: 'Explore Collection',
        bgGradient: 'from-amber-100/60 via-yellow-50 to-orange-50',
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

    // Auto-play
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
            className={`relative bg-gradient-to-br ${slide.bgGradient} transition-colors duration-700 overflow-hidden`}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32 flex flex-col items-center text-center">
                {/* Decorative element */}
                <div className="mb-4 text-amber-400/60 text-3xl">✦</div>

                <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl text-gray-900 leading-tight whitespace-pre-line transition-opacity duration-500">
                    {slide.title}
                </h2>
                <p className="mt-4 text-base sm:text-lg text-gray-600 max-w-md transition-opacity duration-500">
                    {slide.subtitle}
                </p>
                <button
                    onClick={scrollToCatalog}
                    className="mt-8 px-8 py-3 bg-gray-900 text-white text-sm font-medium tracking-wider uppercase rounded-sm hover:bg-gray-800 transition-colors"
                >
                    {slide.cta}
                </button>

                {/* Dots */}
                <div className="flex gap-2 mt-10">
                    {SLIDES.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => goTo(i)}
                            className={`h-2 rounded-full transition-all duration-300 ${i === current ? 'w-6 bg-gray-800' : 'w-2 bg-gray-400/40 hover:bg-gray-400'
                                }`}
                            aria-label={`Go to slide ${i + 1}`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
