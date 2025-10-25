import api from './api';

export interface Category {
  id: string;
  name: string;
  is_active: boolean;
  parent_id?: string | null;
  price?: number | null;
  max_price?: number | null;
  created_at: string;
  updated_at: string;
}

export interface CategoryCreate {
  name: string;
  parent_id?: string | null;
  price?: number | null;
  max_price?: number | null;
}

export interface CategoryUpdate {
  name?: string;
  is_active?: boolean;
  parent_id?: string | null;
  price?: number | null;
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
    const response = await api.get('/v1/categories/', { params });
    return response.data;
  }

  /**
   * Get a single category by ID
   */
  async getCategoryById(id: string): Promise<Category> {
    const response = await api.get(`/v1/categories/${id}`);
    return response.data;
  }

  /**
   * Create a new category
   */
  async createCategory(data: CategoryCreate): Promise<Category> {
    const response = await api.post('/v1/categories/', data);
    return response.data;
  }

  /**
   * Update an existing category
   */
  async updateCategory(id: string, data: CategoryUpdate): Promise<Category> {
    const response = await api.put(`/v1/categories/${id}`, data);
    return response.data;
  }

  /**
   * Soft delete a category (sets is_active to false)
   */
  async deleteCategory(id: string): Promise<Category> {
    const response = await api.delete(`/v1/categories/${id}`);
    return response.data;
  }

  /**
   * Hard delete category (permanent, only if no children)
   */
  async hardDeleteCategory(id: string): Promise<void> {
    await api.delete(`/v1/categories/${id}/hard`);
  }

  /**
   * Reactivate a category (sets is_active to true)
   */
  async reactivateCategory(id: string): Promise<Category> {
    return this.updateCategory(id, { is_active: true });
  }

  /**
   * Get direct children of a category
   */
  async getCategoryChildren(id: string): Promise<Category[]> {
    const response = await api.get(`/v1/categories/${id}/children`);
    return response.data;
  }

  /**
   * Export categories to PDF format
   * Downloads a PDF file with all categories
   */
  async exportToPdf(): Promise<void> {
    const response = await api.get('/v1/categories/actions/export', {
      params: { format: 'pdf' },
      responseType: 'blob'
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `categories_export_${new Date().toISOString().split('T')[0]}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Export categories to Excel format
   * Downloads an Excel file with all categories
   */
  async exportToExcel(): Promise<void> {
    const response = await api.get('/v1/categories/actions/export', {
      params: { format: 'xls' },
      responseType: 'blob'
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `categories_export_${new Date().toISOString().split('T')[0]}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Export categories to CSV format (re-importable)
   */
  async exportToCsv(): Promise<void> {
    const response = await api.get('/v1/categories/actions/export', {
      params: { format: 'csv' },
      responseType: 'blob'
    });

    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `categories_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Download CSV template for categories import
   */
  async downloadImportTemplate(): Promise<void> {
    const response = await api.get('/v1/categories/import/template', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'categories_import_template.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Analyze CSV file for categories import
   */
  async importAnalyze(file: File): Promise<{ session_id: string | null; summary: any; sample: any[]; errors: string[]; }> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/v1/categories/import/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  /**
   * Execute categories import from analyzed session
   */
  async importExecute(sessionId: string, deleteExisting: boolean = false): Promise<{ imported: number; updated: number; errors: string[]; }> {
    const response = await api.post('/v1/categories/import/execute', { 
      session_id: sessionId,
      delete_existing: deleteExisting
    });
    return response.data;
  }
}

export const categoryService = new CategoryService();
export default categoryService;
