import axiosClient from '../api/axiosClient'

export interface SaleItem {
  id: string
  sale_id: string
  category: string
  quantity: number
  weight: number
  unit_price: number
  total_price: number
  // Story 1.1.2: Champs ajoutés pour preset et notes par item
  preset_id?: string | null
  notes?: string | null
}

export interface SaleDetail {
  id: string
  cash_session_id: string
  total_amount: number
  donation?: number
  payment_method?: string
  created_at: string
  operator_id?: string
  // Story 1.1.2: notes et preset_id déplacés vers sale_items (par item individuel)
  items: SaleItem[]
}

/**
 * Service pour récupérer les détails d'une vente avec ses articles
 */
export const getSaleDetail = async (saleId: string): Promise<SaleDetail> => {
  try {
    const response = await axiosClient.get(`/v1/sales/${saleId}`)
    return response.data
  } catch (error) {
    console.error('Erreur lors de la récupération des détails de la vente:', error)
    throw error
  }
}
