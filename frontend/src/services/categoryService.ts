import api from './api';

export interface Category {
  id: string;
  name: string;
  is_active: boolean;
  parent_id?: string | null;
  price?: number | null;
  min_price?: number | null;
  max_price?: number | null;
  created_at: string;
  updated_at: string;
}

export interface CategoryCreate {
  name: string;
  parent_id?: string | null;
  price?: number | null;
  min_price?: number | null;
  max_price?: number | null;
}

export interface CategoryUpdate {
  name?: string;
  is_active?: boolean;
  parent_id?: string | null;
  price?: number | null;
  min_price?: number | null;
  max_price?: number | null;
}

/**
 * Service for managing product categories
 */
class CategoryService {
  /**
   * Get all categories
   * @param isActive - Optional filter by active status
   */
  async getCategories(isActive?: boolean): Promise<Category[]> {
    const params = isActive !== undefined ? { is_active: isActive } : {};
    const response = await api.get('/api/v1/categories/', { params });
    return response.data;
  }

  /**
   * Get a single category by ID
   */
  async getCategoryById(id: string): Promise<Category> {
    const response = await api.get(`/api/v1/categories/${id}`);
    return response.data;
  }

  /**
   * Create a new category
   */
  async createCategory(data: CategoryCreate): Promise<Category> {
    const response = await api.post('/api/v1/categories/', data);
    return response.data;
  }

  /**
   * Update an existing category
   */
  async updateCategory(id: string, data: CategoryUpdate): Promise<Category> {
    const response = await api.put(`/api/v1/categories/${id}`, data);
    return response.data;
  }

  /**
   * Soft delete a category (sets is_active to false)
   */
  async deleteCategory(id: string): Promise<Category> {
    const response = await api.delete(`/api/v1/categories/${id}`);
    return response.data;
  }

  /**
   * Reactivate a category (sets is_active to true)
   */
  async reactivateCategory(id: string): Promise<Category> {
    return this.updateCategory(id, { is_active: true });
  }
}

export const categoryService = new CategoryService();
export default categoryService;
