import api from './api';

export interface Poste {
  id: string;
  status: 'open' | 'closed';
  opened_at: string;
  closed_at?: string;
}

export interface Ticket {
  id: string;
  poste_id: string;
  created_at: string;
  status: 'draft' | 'closed';
  lines: TicketLine[];
}

export interface TicketLine {
  id: string;
  ticket_id: string;
  category: string;
  weight: number;
  destination: 'MAGASIN' | 'RECYCLAGE' | 'DECHETERIE';
  notes?: string;
}

export interface CreateTicketRequest {
  poste_id: string;
}

export interface CreateTicketLineRequest {
  category: string;
  weight: number;
  destination: 'MAGASIN' | 'RECYCLAGE' | 'DECHETERIE';
  notes?: string;
}

export interface UpdateTicketLineRequest {
  category?: string;
  weight?: number;
  destination?: 'MAGASIN' | 'RECYCLAGE' | 'DECHETERIE';
  notes?: string;
}

class ReceptionService {
  async openPoste(): Promise<Poste> {
    const response = await api.post('/api/v1/reception/postes/open');
    return response.data;
  }

  async closePoste(posteId: string): Promise<void> {
    await api.post(`/api/v1/reception/postes/${posteId}/close`);
  }

  async createTicket(posteId: string): Promise<Ticket> {
    const response = await api.post('/api/v1/reception/tickets', {
      poste_id: posteId
    });
    return response.data;
  }

  async closeTicket(ticketId: string): Promise<void> {
    await api.post(`/api/v1/reception/tickets/${ticketId}/close`);
  }

  async addLineToTicket(ticketId: string, line: CreateTicketLineRequest): Promise<TicketLine> {
    const response = await api.post(`/api/v1/reception/tickets/${ticketId}/lines`, line);
    return response.data;
  }

  async updateTicketLine(ticketId: string, lineId: string, line: UpdateTicketLineRequest): Promise<TicketLine> {
    const response = await api.put(`/api/v1/reception/tickets/${ticketId}/lines/${lineId}`, line);
    return response.data;
  }

  async deleteTicketLine(ticketId: string, lineId: string): Promise<void> {
    await api.delete(`/api/v1/reception/tickets/${ticketId}/lines/${lineId}`);
  }

  async getTicket(ticketId: string): Promise<Ticket> {
    const response = await api.get(`/api/v1/reception/tickets/${ticketId}`);
    return response.data;
  }

  async getPoste(posteId: string): Promise<Poste> {
    const response = await api.get(`/api/v1/reception/postes/${posteId}`);
    return response.data;
  }
}

export const receptionService = new ReceptionService();
