// API Response types
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message: string;
    errors: string[];
}

export interface PaginatedResponse<T> {
    items: T[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasMore: boolean;
}

// ─── Category & SubCategory types ────────────────────────────────────────────

export interface Category {
    id: number;
    name: string;
}

export interface CreateCategoryRequest {
    name: string;
}

export interface SubCategory {
    id: number;
    name: string;
    categoryId: number;
}

export interface CreateSubCategoryRequest {
    name: string;
    categoryId: number;
}

// ─── Product types ───────────────────────────────────────────────────────────

export interface ProductImage {
    id: number;
    imageUrl: string;
    thumbnailUrl?: string;
    altText: string;
    isPrimary: boolean;
    displayOrder: number;
}

export interface Product {
    id: number;
    name: string;
    description: string;
    categoryId: number;
    categoryName: string;
    subCategoryId?: number;
    subCategoryName?: string;
    productCode?: string;
    price: number;
    isInStock: boolean;
    stockQuantity: number;
    likesCount: number;
    createdAt: string;
    images: ProductImage[];
}

/** Admin-only: includes channel prices (PariFest, Wholesale). Returned by GET /api/products/admin. */
export interface AdminProduct extends Product {
    pariFestPrice?: number;
    wholesalePrice?: number;
}

export interface CreateProductRequest {
    productCode?: string;
    name: string;
    description: string;
    categoryId: number;
    subCategoryId?: number;
    price: number;
    pariFestPrice?: number;
    wholesalePrice?: number;
    stockQuantity?: number;
    isInStock?: boolean;
}

export interface UpdateProductRequest {
    productCode?: string;
    name: string;
    description: string;
    categoryId: number;
    subCategoryId?: number;
    price: number;
    pariFestPrice?: number;
    wholesalePrice?: number;
    stockQuantity: number;
    isInStock: boolean;
}

export interface ProductFilterRequest {
    categoryId?: number;
    subCategoryId?: number;
    searchTerm?: string;
    productCode?: string;
    inStockOnly?: boolean;
    sortBy?: string;
    page?: number;
    pageSize?: number;
}

// ─── Sales types ──────────────────────────────────────────────────────────────

export enum SaleType {
    Retail = 1,
    BulkSale = 2
}

export interface BulkSaleItemRequest {
    description: string;
    quantity: number;
    unitPrice: number;
}

export interface RecordSaleRequest {
    productId?: number;        // omit for custom items / bulk sales
    productName: string;
    saleType: SaleType;
    quantitySold: number;
    sellingPrice: number;      // ignored by backend when items are provided
    saleDate: string;          // ISO string
    buyerName?: string;
    buyerPhone?: string;
    customerName?: string;
    customerPhone?: string;
    saleChannel?: string;
    notes?: string;
    items?: BulkSaleItemRequest[];  // line items for bulk sales (optional)
}

export interface BulkSaleItemDto {
    id: number;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
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
    buyerName?: string;
    buyerPhone?: string;
    notes?: string;
    createdAt: string;
    items: BulkSaleItemDto[];
}

export const SALE_CHANNELS = ['Website', 'WhatsApp', 'Instagram', 'In-Person', 'Other'] as const;

export interface SalesSummaryDto {
    year: number;
    month: number;
    monthName: string;
    totalRevenue: number;
    totalItemsSold: number;
    retailCount: number;
    bulkSaleCount: number;
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