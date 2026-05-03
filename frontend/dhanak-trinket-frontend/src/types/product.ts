// API Response types
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message: string;
    errors: string[];
}

// Product related types
export enum ProductCategory {
    Bangles = 1,
    Necklaces = 2,
    Earrings = 3,
    Bracelets = 4,
    Rings = 5,
    Sets = 6,
    Anklets = 7,
    HairAccessories = 8,
    Pendants = 9,
    Chains = 10
}

export interface ProductImage {
    id: number;
    imageUrl: string;
    altText: string;
    isPrimary: boolean;
    displayOrder: number;
}

export interface Product {
    id: number;
    name: string;
    description: string;
    category: string; // String representation of ProductCategory
    price: number;
    isInStock: boolean;
    stockQuantity: number;
    likesCount: number;
    createdAt: string;
    images: ProductImage[];
}

export interface CreateProductRequest {
    name: string;
    description: string;
    category: ProductCategory;
    price: number;
    stockQuantity?: number;
    isInStock?: boolean;
}

export interface UpdateProductRequest {
    name: string;
    description: string;
    category: ProductCategory;
    price: number;
    stockQuantity: number;
    isInStock: boolean;
}

export interface ProductFilterRequest {
    category?: ProductCategory;
    searchTerm?: string;
    inStockOnly?: boolean;
    page?: number;
    pageSize?: number;
}

// Helper function to get category display name
export const getCategoryDisplayName = (category: ProductCategory): string => {
    const categoryNames: Record<ProductCategory, string> = {
        [ProductCategory.Bangles]: 'Bangles',
        [ProductCategory.Necklaces]: 'Necklaces',
        [ProductCategory.Earrings]: 'Earrings',
        [ProductCategory.Bracelets]: 'Bracelets',
        [ProductCategory.Rings]: 'Rings',
        [ProductCategory.Sets]: 'Jewelry Sets',
        [ProductCategory.Anklets]: 'Anklets',
        [ProductCategory.HairAccessories]: 'Hair Accessories',
        [ProductCategory.Pendants]: 'Pendants',
        [ProductCategory.Chains]: 'Chains'
    };
    return categoryNames[category] || 'Unknown';
};

// ─── Sales types ──────────────────────────────────────────────────────────────

export enum SaleType {
    Retail = 1,
    Wholesale = 2
}

export interface RecordSaleRequest {
    productId: number;
    productName: string;
    saleType: SaleType;
    quantitySold: number;
    sellingPrice: number;
    saleDate: string; // ISO string
    buyerName?: string;
    buyerPhone?: string;
    customerName?: string;
    customerPhone?: string;
    saleChannel?: string;
    notes?: string;
}

export interface SaleDto {
    id: number;
    productId?: number;
    productName: string;
    saleType: string;
    quantitySold: number;
    sellingPrice: number;
    totalAmount: number;
    saleDate: string;
    customerName?: string;
    customerPhone?: string;
    saleChannel?: string;
    notes?: string;
    wholesaleDealId?: number;
    createdAt: string;
}

export const SALE_CHANNELS = ['Website', 'WhatsApp', 'Instagram', 'In-Person', 'Other'] as const;

export interface SalesSummaryDto {
    year: number;
    month: number;
    monthName: string;
    totalRevenue: number;
    totalItemsSold: number;
    retailCount: number;
    wholesaleCount: number;
    sales: SaleDto[];
}

// ─── Expense types ───────────────────────────────────────────────────────────

export enum ExpenseCategory {
    InventoryPurchase = 1,
    Packaging = 2,
    Shipping = 3,
    Marketing = 4,
    Other = 5,
}

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
    [ExpenseCategory.InventoryPurchase]: 'Inventory Purchase',
    [ExpenseCategory.Packaging]: 'Packaging',
    [ExpenseCategory.Shipping]: 'Shipping',
    [ExpenseCategory.Marketing]: 'Marketing',
    [ExpenseCategory.Other]: 'Other',
};

export interface CreateExpenseRequest {
    expenseDate: string;       // ISO string
    description: string;
    amount: number;
    category: ExpenseCategory;
    vendorName?: string;
    notes?: string;
}

export interface ExpenseDto {
    id: number;
    expenseDate: string;
    description: string;
    amount: number;
    category: string;
    vendorName?: string;
    billImageUrl?: string;
    notes?: string;
    createdAt: string;
}