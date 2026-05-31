'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import InventoryScreen from '@/components/InventoryScreen';
import ExpensesScreen from '@/components/ExpensesScreen';
import SalesScreen from '@/components/SalesScreen';
import CategoriesScreen from '@/components/CategoriesScreen';
import { useAuth } from '@/contexts/AuthContext';
import { productApi } from '@/services/productApi';

type Tab = 'inventory' | 'expenses' | 'sales' | 'categories';

const TABS: { id: Tab; label: string }[] = [
    { id: 'inventory', label: 'Inventory' },
    { id: 'expenses', label: 'Expenses' },
    { id: 'sales', label: 'Sales' },
    { id: 'categories', label: 'Categories' },
];

export default function AdminPage() {
    const { isAdmin, isLoading, logout } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('inventory');
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [togglingMaintenance, setTogglingMaintenance] = useState(false);

    useEffect(() => {
        if (!isLoading && !isAdmin) {
            window.location.href = '/login';
        }
    }, [isAdmin, isLoading]);

    useEffect(() => {
        productApi.getMaintenanceMode().then(res => {
            if (res.success && res.data !== undefined) setMaintenanceMode(res.data);
        });
    }, []);

    const handleToggleMaintenance = async () => {
        setTogglingMaintenance(true);
        const res = await productApi.setMaintenanceMode(!maintenanceMode);
        if (res.success) setMaintenanceMode(!maintenanceMode);
        setTogglingMaintenance(false);
    };

    if (isLoading || !isAdmin) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
                    {/* Top bar */}
                    <div className="flex items-center justify-between py-2 gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                            <Image src="/logo.jpg" alt="Dhanak Trinket" width={36} height={36}
                                className="rounded-full object-cover flex-shrink-0" priority />
                            <div className="min-w-0">
                                <h1 className="text-sm sm:text-xl font-bold text-gray-900 truncate">Dhanak Trinket</h1>
                                <p className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">Admin Dashboard</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
                            <button
                                onClick={handleToggleMaintenance}
                                disabled={togglingMaintenance}
                                className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-md text-[11px] sm:text-sm font-medium border transition-colors ${maintenanceMode
                                    ? 'bg-amber-50 text-amber-700 border-amber-300'
                                    : 'bg-green-50 text-green-700 border-green-300'
                                }`}
                            >
                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${maintenanceMode ? 'bg-amber-500' : 'bg-green-500'}`} />
                                <span className="hidden sm:inline">{togglingMaintenance ? '...' : maintenanceMode ? 'Maintenance ON' : 'Site Live'}</span>
                                <span className="sm:hidden">{togglingMaintenance ? '...' : maintenanceMode ? 'Maint' : 'Live'}</span>
                            </button>
                            <a href="/" className="text-gray-500 hover:text-gray-900 px-1.5 py-1.5 text-[11px] sm:text-sm">
                                <span className="hidden sm:inline">View Catalog</span>
                                <span className="sm:hidden">Catalog</span>
                            </a>
                            <button onClick={logout}
                                className="text-gray-500 hover:text-red-600 px-1.5 sm:px-2 py-1 text-[11px] sm:text-sm border border-gray-300 rounded-md">
                                Logout
                            </button>
                        </div>
                    </div>
                    {/* Tabs — equal width on mobile */}
                    <div className="flex -mb-px overflow-x-auto">
                        {TABS.map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 sm:flex-none px-3 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap text-center ${activeTab === tab.id
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-gray-500'
                                }`}>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
                {activeTab === 'inventory' && <InventoryScreen />}
                {activeTab === 'expenses' && <ExpensesScreen />}
                {activeTab === 'sales' && <SalesScreen />}
                {activeTab === 'categories' && <CategoriesScreen />}
            </main>
        </div>
    );
}
