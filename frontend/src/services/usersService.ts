import axiosClient from '../api/axiosClient'

export interface User {
  id: string
  telegram_id: string
  username?: string
  first_name?: string
  last_name?: string
  full_name?: string
  role: string
  status: string
  is_active: boolean
  site_id?: string
  created_at: string
  updated_at: string
}

/**
 * Service pour récupérer les utilisateurs
 */
export const getUsers = async (): Promise<User[]> => {
  try {
    const response = await axiosClient.get('/v1/admin/users')
    return response.data
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error)
    throw error
  }
}

/**
 * Récupère un utilisateur par son ID
 */
export const getUserById = async (userId: string): Promise<User> => {
  try {
    const response = await axiosClient.get(`/v1/admin/users/${userId}`)
    return response.data
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error)
    throw error
  }
}
