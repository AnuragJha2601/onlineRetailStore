'use client';

import { useState } from 'react';
import Image from 'next/image';
import ProductCatalog from '@/components/ProductCatalog';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { isAdmin, logout } = useAuth();
  const [message, setMessage] = useState<{ type: 'error'; text: string } | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const handleError = (text: string) => {
    setMessage({ type: 'error', text });
    // Auto-clear error message after 8 seconds
    setTimeout(() => setMessage(null), 8000);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-2 sm:py-3 gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Image
                src="/logo.jpg"
                alt="Dhanak Trinket"
                width={40}
                height={40}
                className="rounded-full object-cover flex-shrink-0 sm:w-14 sm:h-14"
                priority
              />
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate font-serif tracking-wide">Dhanak Trinket</h1>
                <p className="text-[11px] sm:text-sm text-gray-500 tracking-wider uppercase">Ethnic Finds, Timeless Shine</p>
              </div>
            </div>
            {isAdmin && (
              <nav className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
                <span className="bg-indigo-600 text-white px-2 sm:px-3 py-1.5 rounded-md text-[11px] sm:text-sm font-medium">
                  Catalog
                </span>
                <a href="/admin"
                  className="text-gray-600 hover:text-gray-900 px-2 sm:px-3 py-1.5 text-[11px] sm:text-sm font-medium">
                  Admin
                </a>
                <button onClick={logout}
                  className="text-gray-500 hover:text-red-600 px-2 sm:px-3 py-1 text-[11px] sm:text-sm border border-gray-300 rounded-md">
                  Logout
                </button>
              </nav>
            )}
          </div>
        </div>
      </header>

      {/* Slim Contact Strip — dismissible */}
      {!bannerDismissed && (
        <div className="bg-gradient-to-r from-rose-50 via-amber-50 to-rose-50 border-b border-rose-100">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-2">
            <p className="text-xs sm:text-sm text-rose-700 font-medium flex-1 text-center">
              ✨ Order via <a href="https://chat.whatsapp.com/Bs6ue8BYGiY7xeZ7wk5EE8?mode=gi_t" target="_blank" rel="noopener noreferrer" className="underline font-semibold text-green-700">WhatsApp</a> or <a href="https://www.instagram.com/dhanaktrinket?igsh=dGRvb3R5YmpqbzJ5&utm_source=qr" target="_blank" rel="noopener noreferrer" className="underline font-semibold text-pink-600">Instagram</a> · Bulk orders welcome!
            </p>
            <button onClick={() => setBannerDismissed(true)} className="text-gray-400 hover:text-gray-600 text-lg leading-none flex-shrink-0" aria-label="Dismiss">×</button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main>
        {/* Error Message */}
        {message && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{message.text}</p>
                </div>
                <div className="ml-auto pl-3">
                  <div className="-mx-1.5 -my-1.5">
                    <button
                      onClick={() => setMessage(null)}
                      className="inline-flex rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
                    >
                      <span className="sr-only">Dismiss</span>
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hero Tagline */}
        <section className="bg-gradient-to-b from-amber-50/60 to-white py-8 sm:py-12 text-center">
          <h2 className="font-serif text-2xl sm:text-4xl text-gray-900 leading-snug">
            Timeless Elegance,<br className="sm:hidden" /> Made for You
          </h2>
          <p className="mt-2 text-sm sm:text-base text-gray-500 tracking-wide">
            Handcrafted ethnic jewelry — curated with love
          </p>
        </section>

        {/* Product Catalog */}
        <ProductCatalog onError={handleError} />
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24 sm:pb-8">
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-gray-500 text-center">
              Handcrafted jewelry — bangles, necklaces & ethnic accessories.
            </p>
            <a href="https://www.instagram.com/dhanaktrinket?igsh=dGRvb3R5YmpqbzJ5&utm_source=qr" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-pink-200 bg-white text-pink-600 hover:bg-pink-50 hover:text-pink-700 font-medium transition-colors text-sm" aria-label="Follow us on Instagram">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
              Follow us on Instagram
            </a>
            <p className="text-xs text-gray-400">© 2026 Dhanak Trinket. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <a
        href="https://chat.whatsapp.com/Bs6ue8BYGiY7xeZ7wk5EE8?mode=gi_t"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-5 right-5 z-40 w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full shadow-lg flex items-center justify-center transition-colors hover:scale-105 active:scale-95"
        aria-label="Chat on WhatsApp"
      >
        <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.554 4.121 1.522 5.851L0 24l6.335-1.492A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.808 9.808 0 01-5.003-1.371l-.36-.214-3.76.885.947-3.659-.235-.374A9.786 9.786 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z" />
        </svg>
      </a>
    </div>
  );
}
