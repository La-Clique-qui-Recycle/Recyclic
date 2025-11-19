import api from './api';

export interface PresetButton {
  id: string;
  name: string;
  category_id: string;
  preset_price: number;
  button_type: 'donation' | 'recycling';
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PresetButtonWithCategory extends PresetButton {
  category_name: string;
}

/**
 * Service for managing preset buttons
 */
class PresetService {
  /**
   * Get all preset buttons with optional filtering
   */
  async getPresets(params?: {
    category_id?: string;
    button_type?: 'donation' | 'recycling';
    is_active?: boolean;
  }): Promise<PresetButtonWithCategory[]> {
    const response = await api.get('/v1/presets/', { params });
    return response.data;
  }

  /**
   * Get all active preset buttons (optimized endpoint)
   */
  async getActivePresets(): Promise<PresetButtonWithCategory[]> {
    const response = await api.get('/v1/presets/active');
    return response.data;
  }

  /**
   * Get a single preset button by ID
   */
  async getPresetById(id: string): Promise<PresetButtonWithCategory> {
    const response = await api.get(`/v1/presets/${id}`);
    return response.data;
  }

  /**
   * Create a new preset button
   */
  async createPreset(preset: Omit<PresetButton, 'id' | 'created_at' | 'updated_at'>): Promise<PresetButton> {
    const response = await api.post('/v1/presets/', preset);
    return response.data;
  }

  /**
   * Update an existing preset button
   */
  async updatePreset(id: string, preset: Partial<PresetButton>): Promise<PresetButton> {
    const response = await api.put(`/v1/presets/${id}`, preset);
    return response.data;
  }

  /**
   * Delete a preset button (soft delete)
   */
  async deletePreset(id: string): Promise<void> {
    await api.delete(`/v1/presets/${id}`);
  }
}

export const presetService = new PresetService();
export default presetService;
