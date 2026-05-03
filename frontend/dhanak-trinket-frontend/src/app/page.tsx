'use client';

import { useState } from 'react';
import Image from 'next/image';
import ProductCatalog from '@/components/ProductCatalog';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { isAdmin, logout } = useAuth();
  const [message, setMessage] = useState<{ type: 'error'; text: string } | null>(null);

  const handleError = (text: string) => {
    setMessage({ type: 'error', text });
    // Auto-clear error message after 8 seconds
    setTimeout(() => setMessage(null), 8000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-3">
            <div className="flex items-center gap-3">
                <Image
                  src="/logo.jpg"
                  alt="Dhanak Trinket"
                  width={56}
                  height={56}
                  className="rounded-full object-cover"
                  priority
                />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Dhanak Trinket</h1>
                  <p className="text-sm text-gray-500">Ethnic Finds, Timeless Shine</p>
                </div>
              </div>
            <nav className="flex space-x-4 items-center">
              <span className="bg-indigo-600 text-white px-3 py-2 rounded-md text-sm font-medium">
                Catalog
              </span>
              {isAdmin ? (
                <>
                  <a
                    href="/admin"
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Admin
                  </a>
                  <button
                    onClick={logout}
                    className="text-gray-500 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium border border-gray-300 hover:border-red-300 transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <a
                  href="/login"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Login
                </a>
              )}
            </nav>
          </div>
        </div>
      </header>

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

        {/* Product Catalog */}
        <ProductCatalog onError={handleError} />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-600 mb-2">© 2026 Dhanak Trinket. All rights reserved.</p>
            <p className="text-sm text-gray-500">
              Handcrafted jewelry collection featuring bangles, necklaces, and ethnic accessories.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
