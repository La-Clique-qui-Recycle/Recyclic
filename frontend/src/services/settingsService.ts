import api from './api';

export interface Setting {
  id: string;
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
}

export interface SettingCreate {
  key: string;
  value: string;
}

export interface SettingUpdate {
  value: string;
}

class SettingsService {
  async getSettings(): Promise<Setting[]> {
    const response = await api.get('/settings/');
    return response.data;
  }

  async getSetting(key: string): Promise<Setting> {
    const response = await api.get(`/settings/${key}`);
    return response.data;
  }

  async createSetting(data: SettingCreate): Promise<Setting> {
    const response = await api.post('/settings/', data);
    return response.data;
  }

  async updateSetting(key: string, data: SettingUpdate): Promise<Setting> {
    const response = await api.put(`/settings/${key}`, data);
    return response.data;
  }

  async deleteSetting(key: string): Promise<void> {
    await api.delete(`/settings/${key}`);
  }

  async getPinModeEnabled(): Promise<boolean> {
    try {
      const setting = await this.getSetting('pin_mode_enabled');
      return setting.value === 'true';
    } catch (error) {
      // Si le paramètre n'existe pas, le mode PIN est désactivé par défaut
      return false;
    }
  }

  async setPinModeEnabled(enabled: boolean): Promise<void> {
    try {
      await this.updateSetting('pin_mode_enabled', { value: enabled.toString() });
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Si le paramètre n'existe pas, le créer
        await this.createSetting({ key: 'pin_mode_enabled', value: enabled.toString() });
      } else {
        throw error;
      }
    }
  }
}

export default new SettingsService();
