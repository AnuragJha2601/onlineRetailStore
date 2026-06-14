import {
    Product,
    AdminProduct,
    CreateProductRequest,
    UpdateProductRequest,
    ProductFilterRequest,
    ApiResponse,
    PaginatedResponse,
    RecordSaleRequest,
    SaleDto,
    SalesSummaryDto,
    CreateExpenseRequest,
    ExpenseDto,
    ExpenseCategory,
    Category,
    CreateCategoryRequest,
    SubCategory,
    CreateSubCategoryRequest,
} from '@/types/product';

// Base API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

// Get stored JWT token for admin requests
const TOKEN_KEY = 'dhanak_admin_token'; // must match AuthContext.tsx

function getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
}

// Build Authorization header for admin endpoints
function authHeader(): Record<string, string> {
    const token = getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}

// Generic API request helper
async function apiRequest<T>(
    endpoint: string,
    options?: RequestInit
): Promise<ApiResponse<T>> {
    try {
        const url = `${API_BASE_URL}${endpoint}`;
        // Spread options first, then override headers — this ensures our Content-Type
        // default isn't silently overwritten by the spread. Skip Content-Type for
        // FormData bodies (browser must set the multipart boundary itself).
        const isFormData = options?.body instanceof FormData;
        const response = await fetch(url, {
            ...options,
            headers: {
                ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
                ...options?.headers,
            },
        });

        if (response.status === 401) {
            // Token expired or invalid — redirect to login
            if (typeof window !== 'undefined') {
                localStorage.removeItem(TOKEN_KEY);
                window.location.href = '/login';
            }
            // Return early so we don't fall through to !response.ok and throw
            return { success: false, message: 'Session expired. Please log in again.', errors: [] };
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: ApiResponse<T> = await response.json();
        return data;
    } catch (error) {
        console.error('API request failed:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error occurred',
            errors: [error instanceof Error ? error.message : 'Unknown error'],
        };
    }
}

// Product API functions
export const productApi = {
    // Get products with server-side filtering, sorting, and pagination
    async getProducts(filters?: ProductFilterRequest): Promise<ApiResponse<PaginatedResponse<Product>>> {
        const params = new URLSearchParams();

        if (filters?.categoryId) params.append('categoryId', filters.categoryId.toString());
        if (filters?.searchTerm) params.append('searchTerm', filters.searchTerm);
        if (filters?.inStockOnly !== undefined) params.append('inStockOnly', filters.inStockOnly.toString());
        if (filters?.sortBy) params.append('sortBy', filters.sortBy);
        if (filters?.page) params.append('page', filters.page.toString());
        if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString());

        const queryString = params.toString();
        const endpoint = `/products${queryString ? `?${queryString}` : ''}`;

        return apiRequest<PaginatedResponse<Product>>(endpoint);
    },

    // Get single product by ID
    async getProduct(id: number): Promise<ApiResponse<Product>> {
        return apiRequest<Product>(`/products/${id}`);
    },

    // Get admin product list with cost/pari/wholesale prices (Admin only)
    async getAdminProducts(filters?: ProductFilterRequest): Promise<ApiResponse<AdminProduct[]>> {
        const params = new URLSearchParams();
        if (filters?.categoryId) params.append('categoryId', filters.categoryId.toString());
        if (filters?.searchTerm) params.append('searchTerm', filters.searchTerm);
        if (filters?.productCode) params.append('productCode', filters.productCode);
        if (filters?.inStockOnly !== undefined) params.append('inStockOnly', filters.inStockOnly.toString());
        if (filters?.page) params.append('page', filters.page.toString());
        if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString());
        const queryString = params.toString();
        return apiRequest<AdminProduct[]>(`/products/admin${queryString ? `?${queryString}` : ''}`, {
            headers: authHeader(),
        });
    },

    // Create new product (Admin only)
    async createProduct(product: CreateProductRequest): Promise<ApiResponse<Product>> {
        return apiRequest<Product>('/products', {
            method: 'POST',
            headers: authHeader(),
            body: JSON.stringify(product),
        });
    },

    // Update existing product (Admin only)
    async updateProduct(id: number, product: UpdateProductRequest): Promise<ApiResponse<Product>> {
        return apiRequest<Product>(`/products/${id}`, {
            method: 'PUT',
            headers: authHeader(),
            body: JSON.stringify(product),
        });
    },

    // Delete product (Admin only)
    async deleteProduct(id: number): Promise<ApiResponse<null>> {
        return apiRequest<null>(`/products/${id}`, {
            method: 'DELETE',
            headers: authHeader(),
        });
    },

    // Like a product (Customer feature)
    async likeProduct(id: number): Promise<ApiResponse<null>> {
        return apiRequest<null>(`/products/${id}/like`, {
            method: 'POST',
        });
    },

    // Upload product image (Admin only)
    async uploadProductImage(productId: number, file: File): Promise<ApiResponse<unknown>> {
        try {
            const formData = new FormData();
            formData.append('image', file);

            const response = await fetch(`${API_BASE_URL}/products/${productId}/images`, {
                method: 'POST',
                headers: authHeader(),
                body: formData,
            });

            if (response.status === 401) {
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('auth_token');
                    window.location.href = '/login';
                }
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Image upload failed:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Image upload failed',
                errors: [error instanceof Error ? error.message : 'Unknown error'],
            };
        }
    },

    async deleteProductImage(productId: number, imageId: number): Promise<ApiResponse<object>> {
        return apiRequest<object>(`/products/${productId}/images/${imageId}`, {
            method: 'DELETE',
            headers: authHeader(),
        });
    },

    async setPrimaryImage(productId: number, imageId: number): Promise<ApiResponse<object>> {
        return apiRequest<object>(`/products/${productId}/images/${imageId}/primary`, {
            method: 'PUT',
            headers: authHeader(),
        });
    },

    // Record a sale (Admin only) — called from "Mark as Sold" modal
    async recordSale(request: RecordSaleRequest): Promise<ApiResponse<SaleDto>> {
        return apiRequest<SaleDto>('/sales', {
            method: 'POST',
            headers: authHeader(),
            body: JSON.stringify(request),
        });
    },

    // Get sales list with optional filters (Admin only)
    async getSales(year?: number, month?: number): Promise<ApiResponse<SaleDto[]>> {
        const params = new URLSearchParams();
        if (year) params.append('year', year.toString());
        if (month) params.append('month', month.toString());
        const qs = params.toString();
        return apiRequest<SaleDto[]>(`/sales${qs ? `?${qs}` : ''}`, {
            headers: authHeader(),
        });
    },

    // Get monthly P&L summary (Admin only)
    async getSalesSummary(year?: number): Promise<ApiResponse<SalesSummaryDto[]>> {
        const qs = year ? `?year=${year}` : '';
        return apiRequest<SalesSummaryDto[]>(`/sales/summary${qs}`, {
            headers: authHeader(),
        });
    },

    // ─── Expenses ─────────────────────────────────────────────────────────────

    async createExpense(request: CreateExpenseRequest): Promise<ApiResponse<ExpenseDto>> {
        return apiRequest<ExpenseDto>('/expenses', {
            method: 'POST',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(request),
        });
    },

    async uploadExpenseBill(expenseId: number, file: File): Promise<ApiResponse<ExpenseDto>> {
        const formData = new FormData();
        formData.append('file', file);
        return apiRequest<ExpenseDto>(`/expenses/${expenseId}/bill`, {
            method: 'POST',
            headers: authHeader(),   // No Content-Type: browser sets multipart boundary
            body: formData,
        });
    },

    async getExpenses(year?: number, month?: number, category?: ExpenseCategory): Promise<ApiResponse<ExpenseDto[]>> {
        const params = new URLSearchParams();
        if (year) params.set('year', String(year));
        if (month) params.set('month', String(month));
        if (category !== undefined) params.set('category', String(category));
        const qs = params.toString() ? `?${params.toString()}` : '';
        return apiRequest<ExpenseDto[]>(`/expenses${qs}`, {
            headers: authHeader(),
        });
    },

    async deleteExpense(id: number): Promise<ApiResponse<object>> {
        return apiRequest<object>(`/expenses/${id}`, {
            method: 'DELETE',
            headers: authHeader(),
        });
    },

    async deleteSale(id: number): Promise<ApiResponse<object>> {
        return apiRequest<object>(`/sales/${id}`, {
            method: 'DELETE',
            headers: authHeader(),
        });
    },

    // ─── Categories ────────────────────────────────────────────────────────────

    async getCategories(): Promise<ApiResponse<Category[]>> {
        return apiRequest<Category[]>('/categories');
    },

    async createCategory(request: CreateCategoryRequest): Promise<ApiResponse<Category>> {
        return apiRequest<Category>('/categories', {
            method: 'POST',
            headers: authHeader(),
            body: JSON.stringify(request),
        });
    },

    async updateCategory(id: number, request: CreateCategoryRequest): Promise<ApiResponse<Category>> {
        return apiRequest<Category>(`/categories/${id}`, {
            method: 'PUT',
            headers: authHeader(),
            body: JSON.stringify(request),
        });
    },

    async deleteCategory(id: number): Promise<ApiResponse<object>> {
        return apiRequest<object>(`/categories/${id}`, {
            method: 'DELETE',
            headers: authHeader(),
        });
    },

    // ─── SubCategories ─────────────────────────────────────────────────────────

    async getSubCategories(categoryId: number): Promise<ApiResponse<SubCategory[]>> {
        return apiRequest<SubCategory[]>(`/subcategories?categoryId=${categoryId}`);
    },

    async createSubCategory(request: CreateSubCategoryRequest): Promise<ApiResponse<SubCategory>> {
        return apiRequest<SubCategory>('/subcategories', {
            method: 'POST',
            headers: authHeader(),
            body: JSON.stringify(request),
        });
    },

    async updateSubCategory(id: number, request: CreateSubCategoryRequest): Promise<ApiResponse<SubCategory>> {
        return apiRequest<SubCategory>(`/subcategories/${id}`, {
            method: 'PUT',
            headers: authHeader(),
            body: JSON.stringify(request),
        });
    },

    async deleteSubCategory(id: number): Promise<ApiResponse<object>> {
        return apiRequest<object>(`/subcategories/${id}`, {
            method: 'DELETE',
            headers: authHeader(),
        });
    },

    // ─── Site Settings ─────────────────────────────────────────────────────────

    async getMaintenanceMode(): Promise<ApiResponse<boolean>> {
        return apiRequest<boolean>('/settings/maintenance');
    },

    async setMaintenanceMode(enabled: boolean): Promise<ApiResponse<boolean>> {
        return apiRequest<boolean>('/settings/maintenance', {
            method: 'PUT',
            headers: authHeader(),
            body: JSON.stringify({ enabled }),
        });
    },
};

// Helper functions
export const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price);
};

export const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};