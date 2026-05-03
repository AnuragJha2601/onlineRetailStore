'use client';

import { useState, useEffect, useCallback } from 'react';
import ProductUploadForm from '@/components/ProductUploadForm';
import MarkAsSoldModal from '@/components/MarkAsSoldModal';
import { useAuth } from '@/contexts/AuthContext';
import { Product } from '@/types/product';
import { productApi } from '@/services/productApi';

export default function AdminPage() {
    const { isAdmin, isLoading, logout } = useAuth();
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [soldModalProduct, setSoldModalProduct] = useState<Product | null>(null);

    const loadProducts = useCallback(async () => {
        const res = await productApi.getProducts({ inStockOnly: false, pageSize: 100 });
        if (res.success && res.data) setProducts(res.data);
    }, []);

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!isLoading && !isAdmin) {
            window.location.href = '/login';
        }
    }, [isAdmin, isLoading]);

    useEffect(() => {
        if (isAdmin) loadProducts();
    }, [isAdmin, loadProducts]);

    const handleSuccess = (text: string) => {
        setMessage({ type: 'success', text });
        loadProducts(); // refresh stock counts
        setTimeout(() => setMessage(null), 5000);
    };

    const handleError = (text: string) => {
        setMessage({ type: 'error', text });
        // Auto-clear error message after 8 seconds
        setTimeout(() => setMessage(null), 8000);
    };

    if (isLoading || !isAdmin) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Dhanak Trinket</h1>
                            <p className="text-sm text-gray-600">Admin Dashboard</p>
                        </div>
                        <nav className="flex space-x-4 items-center">
                            <a
                                href="/"
                                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                            >
                                View Catalog
                            </a>
                            <span className="bg-indigo-600 text-white px-3 py-2 rounded-md text-sm font-medium">
                                Admin Panel
                            </span>
                            <button
                                onClick={logout}
                                className="text-gray-500 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium border border-gray-300 hover:border-red-300 transition-colors"
                            >
                                Logout
                            </button>
                        </nav>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Success/Error Messages */}
                {message && (
                    <div className={`mb-6 p-4 rounded-md ${message.type === 'success'
                        ? 'bg-green-50 border border-green-200 text-green-800'
                        : 'bg-red-50 border border-red-200 text-red-800'
                        }`}>
                        <div className="flex">
                            <div className="flex-shrink-0">
                                {message.type === 'success' ? (
                                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                )}
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
                )}

                {/* Welcome Section */}
                <div className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Welcome to your Admin Panel</h2>
                    <p className="text-gray-600">
                        Use this form to add new products to your Dhanak Trinket catalog. Upload high-quality images
                        and detailed descriptions to showcase your beautiful jewelry collection.
                    </p>
                </div>

                {/* Product Upload Form */}
                <ProductUploadForm
                    onSuccess={handleSuccess}
                    onError={handleError}
                />

                {/* Quick Tips */}
                <div className="mt-8 bg-blue-50 border border-blue-200 rounded-md p-4">
                    <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Quick Tips for Better Product Listings</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Use high-resolution images with good lighting to showcase jewelry details</li>
                        <li>• Include multiple angles - front, side, and detailed shots</li>
                        <li>• Write descriptive titles with material and style information</li>
                        <li>• Mention occasions (wedding, festival, daily wear) in descriptions</li>
                        <li>• Set competitive prices based on material and craftsmanship</li>
                        <li>• Keep stock quantities updated to avoid overselling</li>
                    </ul>
                </div>

                {/* ── Inventory — Mark as Sold ───────────────────────────── */}
                <div className="mt-10">
                    <h2 className="text-lg font-semibold text-gray-900 mb-1">Inventory</h2>
                    <p className="text-sm text-gray-500 mb-4">Click &quot;Mark as Sold&quot; on any item to record a sale and update stock.</p>

                    {products.length === 0 ? (
                        <p className="text-gray-400 text-sm">No products found.</p>
                    ) : (
                        <div className="overflow-hidden border border-gray-200 rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">Product</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">Category</th>
                                        <th className="px-4 py-3 text-right font-medium text-gray-500">Price</th>
                                        <th className="px-4 py-3 text-center font-medium text-gray-500">Stock</th>
                                        <th className="px-4 py-3 text-center font-medium text-gray-500">Status</th>
                                        <th className="px-4 py-3 text-center font-medium text-gray-500">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {products.map(p => (
                                        <tr key={p.id} className={`hover:bg-gray-50 ${!p.isInStock ? 'opacity-60' : ''}`}>
                                            <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate">{p.name}</td>
                                            <td className="px-4 py-3 text-gray-500">{p.category}</td>
                                            <td className="px-4 py-3 text-right text-gray-700">₹{p.price.toFixed(0)}</td>
                                            <td className="px-4 py-3 text-center text-gray-700">{p.stockQuantity}</td>
                                            <td className="px-4 py-3 text-center">
                                                {p.isInStock ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">In Stock</span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Sold Out</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => setSoldModalProduct(p)}
                                                    disabled={p.stockQuantity === 0}
                                                    className="px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    Mark as Sold
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>

            {/* Mark as Sold Modal */}
            {soldModalProduct && (
                <MarkAsSoldModal
                    product={soldModalProduct}
                    onClose={() => setSoldModalProduct(null)}
                    onSuccess={handleSuccess}
                    onError={handleError}
                />
            )}
        </div>
    );
}