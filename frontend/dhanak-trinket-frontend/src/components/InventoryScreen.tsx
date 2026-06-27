'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { AdminProduct, SaleDto, Category, SubCategory } from '@/types/product';
import { productApi, formatPrice } from '@/services/productApi';
import MarkAsSoldModal from '@/components/MarkAsSoldModal';
import EditProductModal from '@/components/EditProductModal';
import ProductUploadForm from '@/components/ProductUploadForm';

type StockStatus = 'all' | 'in-stock' | 'sold-out';
type SortBy = 'newest' | 'oldest' | 'stock-asc' | 'stock-desc' | 'price-asc' | 'price-desc';

export default function InventoryScreen() {
    const [products, setProducts] = useState<AdminProduct[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<number | 'all'>('all');
    const [subCategoryFilter, setSubCategoryFilter] = useState<number | 'all'>('all');
    const [stockStatusFilter, setStockStatusFilter] = useState<StockStatus>('in-stock');
    const [sortBy, setSortBy] = useState<SortBy>('newest');
    const [soldModalProduct, setSoldModalProduct] = useState<AdminProduct | null>(null);
    const [editProduct, setEditProduct] = useState<AdminProduct | null>(null);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [showAddProduct, setShowAddProduct] = useState(false);

    const showToast = (type: 'success' | 'error', text: string) => {
        setToast({ type, text });
        setTimeout(() => setToast(null), 5000);
    };

    const loadProducts = useCallback(async () => {
        setLoading(true);
        const res = await productApi.getAdminProducts({ inStockOnly: false, pageSize: 500 });
        if (res.success && res.data) setProducts(res.data);
        setLoading(false);
    }, []);

    const loadCategories = useCallback(async () => {
        const res = await productApi.getCategories();
        if (res.success && res.data) setCategories(res.data);
    }, []);

    const loadSubCategories = useCallback(async (catId: number) => {
        const res = await productApi.getSubCategories(catId);
        if (res.success && res.data) setSubCategories(res.data);
        else setSubCategories([]);
    }, []);

    useEffect(() => {
        loadProducts();
        loadCategories();
    }, [loadProducts, loadCategories]);

    // When category changes, load its sub-categories and reset sub-category filter
    useEffect(() => {
        if (categoryFilter !== 'all' && typeof categoryFilter === 'number') {
            loadSubCategories(categoryFilter);
            setSubCategoryFilter('all');
        } else {
            setSubCategories([]);
            setSubCategoryFilter('all');
        }
    }, [categoryFilter, loadSubCategories]);

    // Apply filters and sorting
    const filtered = useMemo(() => {
        let result = [...products];

        // Search filter
        const q = searchQuery.trim().toLowerCase();
        if (q) {
            result = result.filter(p =>
                p.name.toLowerCase().includes(q) ||
                (p.productCode?.toLowerCase().includes(q))
            );
        }

        // Category filter
        if (categoryFilter !== 'all' && typeof categoryFilter === 'number') {
            result = result.filter(p => p.categoryId === categoryFilter);
        }

        // Sub-category filter
        if (subCategoryFilter !== 'all' && typeof subCategoryFilter === 'number') {
            result = result.filter(p => p.subCategoryId === subCategoryFilter);
        }

        // Stock status filter
        if (stockStatusFilter === 'in-stock') {
            result = result.filter(p => p.isInStock);
        } else if (stockStatusFilter === 'sold-out') {
            result = result.filter(p => !p.isInStock);
        }

        // Sorting
        result.sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                case 'oldest':
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                case 'stock-asc':
                    return a.stockQuantity - b.stockQuantity;
                case 'stock-desc':
                    return b.stockQuantity - a.stockQuantity;
                case 'price-asc':
                    return a.price - b.price;
                case 'price-desc':
                    return b.price - a.price;
                default:
                    return 0;
            }
        });

        return result;
    }, [products, searchQuery, categoryFilter, subCategoryFilter, stockStatusFilter, sortBy]);

    // Helper: Calculate profit tier based on available prices
    const getProfitIndicator = (product: AdminProduct) => {
        const prices: number[] = [];
        if (product.price) prices.push(product.price);
        if (product.pariFestPrice) prices.push(product.pariFestPrice);
        if (product.wholesalePrice) prices.push(product.wholesalePrice);

        if (prices.length < 2) return { color: 'bg-gray-100 text-gray-800', label: 'Single Price' };

        const max = Math.max(...prices);
        const min = Math.min(...prices);
        const spread = max - min;
        const spreadPercent = (spread / min) * 100;

        if (spreadPercent >= 50) return { color: 'bg-green-100 text-green-800', label: 'High Margin' };
        if (spreadPercent >= 25) return { color: 'bg-blue-100 text-blue-800', label: 'Good Margin' };
        return { color: 'bg-gray-100 text-gray-800', label: 'Standard' };
    };

    const handleSaleSuccess = (sale: SaleDto) => {
        setProducts(prev => prev.map(p => {
            if (p.id !== sale.productId) return p;
            const newStock = Math.max(0, p.stockQuantity - sale.quantitySold);
            return { ...p, stockQuantity: newStock, isInStock: newStock > 0 };
        }));
        showToast('success',
            `Sale #${sale.id} recorded — ${sale.productName} × ${sale.quantitySold} = ${formatPrice(sale.totalAmount)}`
        );
        setSoldModalProduct(null);
    };

    const handleEditSaved = (updated: AdminProduct) => {
        setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
        setEditProduct(null);
        showToast('success', `"${updated.name}" updated.`);
    };

    const handleDelete = async (productId: number) => {
        setDeleting(true);
        const res = await productApi.deleteProduct(productId);
        if (res.success) {
            setProducts(prev => prev.filter(p => p.id !== productId));
            showToast('success', 'Product deleted.');
        } else {
            showToast('error', res.message || 'Failed to delete product.');
        }
        setDeleting(false);
        setDeleteConfirmId(null);
    };

    return (
        <div className="space-y-4">
            {/* Toast */}
            {toast && (
                <div className={`rounded-lg px-4 py-3 text-sm flex items-start gap-3 ${toast.type === 'success'
                    ? 'bg-green-50 border border-green-200 text-green-800'
                    : 'bg-red-50 border border-red-200 text-red-700'
                    }`}>
                    <span className="flex-1">{toast.text}</span>
                    <button onClick={() => setToast(null)} className="text-current opacity-60 hover:opacity-100">✕</button>
                </div>
            )}

            {/* Header row */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center justify-between sm:flex-1">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Inventory</h2>
                        <p className="text-sm text-gray-500">
                            {filtered.length !== products.length
                                ? `${filtered.length} of ${products.length} products`
                                : `${products.length} products`}
                        </p>
                    </div>
                    {/* + Add Product — always visible */}
                    <button onClick={() => setShowAddProduct(true)}
                        className="sm:hidden px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1">
                        <span className="text-base leading-none">+</span> Add
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={loadProducts} disabled={loading}
                        className="text-sm text-indigo-600 hover:underline disabled:opacity-50 whitespace-nowrap">
                        {loading ? 'Loading…' : 'Refresh'}
                    </button>
                    <button onClick={() => setShowAddProduct(true)}
                        className="hidden sm:flex px-3 py-1.5 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors items-center gap-1">
                        <span className="text-lg leading-none">+</span> Add Product
                    </button>
                </div>
            </div>

            {/* Filters Panel */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
                {/* Search */}
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Search</label>
                    <input
                        type="search"
                        placeholder="Search by name or code…"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                </div>

                {/* Filters Row */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {/* Category Filter */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        >
                            <option value="all">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Sub-Category Filter */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Sub-Category</label>
                        <select
                            value={subCategoryFilter}
                            onChange={(e) => setSubCategoryFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                            disabled={categoryFilter === 'all' || subCategories.length === 0}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-gray-100 disabled:text-gray-400"
                        >
                            <option value="all">All Sub-Categories</option>
                            {subCategories.map(subCat => (
                                <option key={subCat.id} value={subCat.id}>{subCat.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Stock Status Filter */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Stock Status</label>
                        <select
                            value={stockStatusFilter}
                            onChange={(e) => setStockStatusFilter(e.target.value as StockStatus)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        >
                            <option value="all">All Items</option>
                            <option value="in-stock">In Stock</option>
                            <option value="sold-out">Sold Out</option>
                        </select>
                    </div>

                    {/* Sort By */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Sort By</label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortBy)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="stock-desc">Stock: High to Low</option>
                            <option value="stock-asc">Stock: Low to High</option>
                            <option value="price-desc">Price: High to Low</option>
                            <option value="price-asc">Price: Low to High</option>
                        </select>
                    </div>

                    {/* Clear Filters Button */}
                    <div className="flex items-end">
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setCategoryFilter('all');
                                setSubCategoryFilter('all');
                                setStockStatusFilter('in-stock');
                                setSortBy('newest');
                            }}
                            className="w-full px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
                        >
                            Clear All
                        </button>
                    </div>
                </div>
            </div>

            {/* Product list */}
            {loading ? (
                <div className="text-center py-16 text-gray-400 text-sm">Loading products…</div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 text-gray-400 text-sm">
                    {searchQuery ? `No products match "${searchQuery}".` : 'No products found.'}
                </div>
            ) : (
                <>
                    {/* Mobile: Card layout */}
                    <div className="sm:hidden space-y-2">
                        {filtered.map(p => {
                            const primaryImg = p.images.find(i => i.isPrimary) || p.images[0];
                            const thumbSrc = primaryImg?.thumbnailUrl || primaryImg?.imageUrl;
                            return (
                                <div key={p.id} className={`bg-white rounded-lg border border-gray-200 p-3 ${!p.isInStock ? 'opacity-60' : ''}`}>
                                    <div className="flex gap-3">
                                        {thumbSrc ? (
                                            <img src={thumbSrc} alt={p.name}
                                                className="w-14 h-14 rounded-md object-cover flex-shrink-0 border border-gray-200" />
                                        ) : (
                                            <div className="w-14 h-14 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-400 text-xs border border-gray-200">📷</div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 flex-wrap">
                                                <p className="font-medium text-gray-900 text-sm truncate">{p.name}</p>
                                                <div className="flex gap-1 flex-wrap justify-end">
                                                    <span className={`inline-block px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getProfitIndicator(p).color} flex-shrink-0`}>
                                                        {getProfitIndicator(p).label}
                                                    </span>
                                                    {p.isInStock
                                                        ? <span className="inline-block px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-800 flex-shrink-0">In Stock</span>
                                                        : <span className="inline-block px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-700 flex-shrink-0">Sold Out</span>}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                                                {p.productCode && <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">{p.productCode}</span>}
                                                <span>{p.categoryName}</span>
                                                <span>•</span>
                                                <span>Qty: {p.stockQuantity}</span>
                                            </div>
                                            <div className="flex items-center gap-3 mt-1 text-xs">
                                                <span className="font-medium text-gray-800">{formatPrice(p.price)}</span>
                                                {p.pariFestPrice && <span className="text-gray-500">Pari: {formatPrice(p.pariFestPrice)}</span>}
                                                {p.wholesalePrice && <span className="text-gray-500">WS: {formatPrice(p.wholesalePrice)}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    {/* Actions row */}
                                    <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-gray-100">
                                        {deleteConfirmId === p.id ? (
                                            <>
                                                <span className="text-xs text-red-600">Delete this product?</span>
                                                <div className="flex-1" />
                                                <button onClick={() => handleDelete(p.id)} disabled={deleting}
                                                    className="px-3 py-1 text-xs font-medium bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50">
                                                    {deleting ? '…' : 'Yes'}
                                                </button>
                                                <button onClick={() => setDeleteConfirmId(null)}
                                                    className="px-3 py-1 text-xs font-medium border border-gray-300 text-gray-600 rounded">
                                                    No
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => setEditProduct(p)}
                                                    className="flex-1 py-1.5 text-xs font-medium border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
                                                    Edit
                                                </button>
                                                <button onClick={() => setSoldModalProduct(p)} disabled={p.stockQuantity === 0}
                                                    className="flex-1 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-40">
                                                    Sold
                                                </button>
                                                <button onClick={() => setDeleteConfirmId(p.id)}
                                                    className="py-1.5 px-3 text-xs font-medium border border-red-300 text-red-600 rounded-md hover:bg-red-50">
                                                    Delete
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Desktop: Table layout */}
                    <div className="hidden sm:block overflow-x-auto rounded-xl border border-gray-200">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                                <tr>
                                    <th className="px-4 py-3 text-left">Product</th>
                                    <th className="px-4 py-3 text-left">Code</th>
                                    <th className="px-4 py-3 text-left">Category</th>
                                    <th className="px-4 py-3 text-right">MRP</th>
                                    <th className="px-4 py-3 text-right">PariFest</th>
                                    <th className="px-4 py-3 text-right">Wholesale</th>
                                    <th className="px-4 py-3 text-center">Stock</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                    <th className="px-4 py-3 text-center">Margin</th>
                                    <th className="px-4 py-3 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {filtered.map(p => {
                                    const primaryImg = p.images.find(i => i.isPrimary) || p.images[0];
                                    const thumbSrc = primaryImg?.thumbnailUrl || primaryImg?.imageUrl;
                                    return (
                                        <tr key={p.id} className={`hover:bg-gray-50 ${!p.isInStock ? 'opacity-60' : ''}`}>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    {thumbSrc ? (
                                                        <img src={thumbSrc} alt={p.name}
                                                            className="w-10 h-10 rounded-md object-cover flex-shrink-0 border border-gray-200" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-400 text-xs border border-gray-200">📷</div>
                                                    )}
                                                    <span className="font-medium text-gray-900 truncate max-w-[150px]" title={p.name}>{p.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {p.productCode
                                                    ? <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{p.productCode}</span>
                                                    : <span className="text-gray-300">—</span>}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500">{p.categoryName}</td>
                                            <td className="px-4 py-3 text-right font-medium text-gray-800">{formatPrice(p.price)}</td>
                                            <td className="px-4 py-3 text-right text-gray-600">{p.pariFestPrice ? formatPrice(p.pariFestPrice) : <span className="text-gray-300">—</span>}</td>
                                            <td className="px-4 py-3 text-right text-gray-600">{p.wholesalePrice ? formatPrice(p.wholesalePrice) : <span className="text-gray-300">—</span>}</td>
                                            <td className="px-4 py-3 text-center text-gray-700 font-medium">{p.stockQuantity}</td>
                                            <td className="px-4 py-3 text-center">
                                                {p.isInStock
                                                    ? <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">In Stock</span>
                                                    : <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Sold Out</span>}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getProfitIndicator(p).color}`}>
                                                    {getProfitIndicator(p).label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {deleteConfirmId === p.id ? (
                                                    <div className="flex items-center justify-center gap-1">
                                                        <span className="text-xs text-red-600 mr-1">Delete?</span>
                                                        <button onClick={() => handleDelete(p.id)} disabled={deleting}
                                                            className="px-2 py-1 text-xs font-medium bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-colors">
                                                            {deleting ? '…' : 'Yes'}
                                                        </button>
                                                        <button onClick={() => setDeleteConfirmId(null)}
                                                            className="px-2 py-1 text-xs font-medium border border-gray-300 text-gray-600 rounded hover:bg-gray-50 transition-colors">
                                                            No
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button onClick={() => setEditProduct(p)}
                                                            className="px-3 py-1.5 text-xs font-medium border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
                                                            Edit
                                                        </button>
                                                        <button onClick={() => setSoldModalProduct(p)} disabled={p.stockQuantity === 0}
                                                            className="px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                                                            Sold
                                                        </button>
                                                        <button onClick={() => setDeleteConfirmId(p.id)}
                                                            className="px-3 py-1.5 text-xs font-medium border border-red-300 text-red-600 rounded-md hover:bg-red-50 transition-colors">
                                                            Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {soldModalProduct && (
                <MarkAsSoldModal
                    product={soldModalProduct}
                    onClose={() => setSoldModalProduct(null)}
                    onSaleRecorded={handleSaleSuccess}
                    onError={msg => showToast('error', msg)}
                />
            )}

            {editProduct && (
                <EditProductModal
                    product={editProduct}
                    onClose={() => setEditProduct(null)}
                    onSaved={handleEditSaved}
                />
            )}

            {/* Add Product Modal */}
            {showAddProduct && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm overflow-y-auto py-8">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 relative">
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Add New Product</h2>
                                <p className="text-sm text-gray-500 mt-0.5">Upload images and fill in product details.</p>
                            </div>
                            <button onClick={() => setShowAddProduct(false)}
                                className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
                        </div>
                        <div className="px-6 py-5 max-h-[75vh] overflow-y-auto">
                            <ProductUploadForm
                                onSuccess={text => {
                                    setShowAddProduct(false);
                                    showToast('success', text);
                                    loadProducts();
                                }}
                                onError={text => showToast('error', text)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
