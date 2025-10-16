import axiosClient from '../api/axiosClient'

export interface Category {
  id: string
  name: string
  is_active: boolean
  parent_id?: string
  price?: number
  max_price?: number
  created_at: string
  updated_at: string
}

/**
 * Service pour récupérer les catégories
 */
export const getCategories = async (): Promise<Category[]> => {
  try {
    const response = await axiosClient.get('/v1/categories/')
    return response.data
  } catch (error) {
    console.error('Erreur lors de la récupération des catégories:', error)
    throw error
  }
}

/**
 * Récupère une catégorie par son ID
 */
export const getCategoryById = async (categoryId: string): Promise<Category> => {
  try {
    const response = await axiosClient.get(`/v1/categories/${categoryId}`)
    return response.data
  } catch (error) {
    console.error('Erreur lors de la récupération de la catégorie:', error)
    throw error
  }
}
