'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import ProductUploadForm from '@/components/ProductUploadForm';
import InventoryScreen from '@/components/InventoryScreen';
import ExpensesScreen from '@/components/ExpensesScreen';
import SalesScreen from '@/components/SalesScreen';
import { useAuth } from '@/contexts/AuthContext';

type Tab = 'inventory' | 'expenses' | 'sales' | 'add-product';

const TABS: { id: Tab; label: string }[] = [
    { id: 'inventory', label: 'Inventory' },
    { id: 'expenses', label: 'Expenses' },
    { id: 'sales', label: 'Sales' },
    { id: 'add-product', label: 'Add Product' },
];

export default function AdminPage() {
    const { isAdmin, isLoading, logout } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('inventory');
    const [addProductMessage, setAddProductMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        if (!isLoading && !isAdmin) {
            window.location.href = '/login';
        }
    }, [isAdmin, isLoading]);

    if (isLoading || !isAdmin) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-2">
                        <div className="flex items-center gap-3">
                            <Image src="/logo.jpg" alt="Dhanak Trinket" width={48} height={48} className="rounded-full object-cover" priority />
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Dhanak Trinket</h1>
                                <p className="text-xs text-gray-500">Admin Dashboard</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <a href="/" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                                View Catalog
                            </a>
                            <button onClick={logout}
                                className="text-gray-500 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium border border-gray-300 hover:border-red-300 transition-colors">
                                Logout
                            </button>
                        </div>
                    </div>
                    <div className="flex gap-1 -mb-px">
                        {TABS.map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === 'inventory' && <InventoryScreen />}

                {activeTab === 'expenses' && <ExpensesScreen />}

                {activeTab === 'sales' && <SalesScreen />}

                {activeTab === 'add-product' && (
                    <div className="max-w-3xl">
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold text-gray-900">Add New Product</h2>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Upload high-quality images and detailed descriptions to showcase your jewelry.
                            </p>
                        </div>
                        {addProductMessage && (
                            <div className={`mb-5 rounded-lg px-4 py-3 text-sm flex items-start gap-3 ${addProductMessage.type === 'success'
                                ? 'bg-green-50 border border-green-200 text-green-800'
                                : 'bg-red-50 border border-red-200 text-red-700'
                                }`}>
                                <span className="flex-1">{addProductMessage.text}</span>
                                <button onClick={() => setAddProductMessage(null)} className="opacity-60 hover:opacity-100">✕</button>
                            </div>
                        )}
                        <ProductUploadForm
                            onSuccess={text => {
                                setAddProductMessage({ type: 'success', text });
                                setTimeout(() => setAddProductMessage(null), 6000);
                            }}
                            onError={text => {
                                setAddProductMessage({ type: 'error', text });
                                setTimeout(() => setAddProductMessage(null), 8000);
                            }}
                        />
                    </div>
                )}
            </main>
        </div>
    );
}
