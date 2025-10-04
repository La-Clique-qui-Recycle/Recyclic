import api from './api';

export interface PinSetRequest {
  pin: string;
}

export interface PinAuthRequest {
  user_id: string;
  pin: string;
}

export interface PinAuthResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  username: string;
  role: string;
}

class PinService {
  async setPin(pin: string): Promise<{ message: string }> {
    const response = await api.put('/users/me/pin', { pin });
    return response.data;
  }

  async authenticateWithPin(userId: string, pin: string): Promise<PinAuthResponse> {
    const response = await api.post('/auth/pin', {
      user_id: userId,
      pin
    });
    return response.data;
  }
}

export default new PinService();
