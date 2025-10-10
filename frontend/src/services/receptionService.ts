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
  category_id: string;
  weight: number;
  destination: 'MAGASIN' | 'RECYCLAGE' | 'DECHETERIE';
  notes?: string;
}

export interface UpdateTicketLineRequest {
  category_id?: string;
  weight?: number;
  destination?: 'MAGASIN' | 'RECYCLAGE' | 'DECHETERIE';
  notes?: string;
}

class ReceptionService {
  async openPoste(): Promise<Poste> {
    const response = await api.post('/v1/reception/postes/open');
    return response.data;
  }

  async closePoste(posteId: string): Promise<void> {
    await api.post(`/v1/reception/postes/${posteId}/close`);
  }

  async createTicket(posteId: string): Promise<Ticket> {
    const response = await api.post('/v1/reception/tickets', {
      poste_id: posteId
    });
    return response.data;
  }

  async closeTicket(ticketId: string): Promise<void> {
    await api.post(`/v1/reception/tickets/${ticketId}/close`);
  }

  async addLineToTicket(ticketId: string, line: CreateTicketLineRequest): Promise<TicketLine> {
    const response = await api.post('/v1/reception/lignes', {
      ticket_id: ticketId,
      category_id: line.category_id,
      poids_kg: line.weight,
      destination: line.destination,
      notes: line.notes
    });
    // Normaliser la réponse pour correspondre à l'interface TicketLine
    return {
      id: response.data.id,
      ticket_id: response.data.ticket_id,
      category: response.data.category_id, // Pour compatibilité
      dom_category_id: response.data.category_id,
      weight: response.data.poids_kg,
      poids_kg: response.data.poids_kg,
      destination: response.data.destination,
      notes: response.data.notes,
      created_at: response.data.created_at,
      updated_at: response.data.updated_at
    };
  }

  async updateTicketLine(ticketId: string, lineId: string, line: UpdateTicketLineRequest): Promise<TicketLine> {
    const response = await api.put(`/v1/reception/lignes/${lineId}`, {
      category_id: line.category_id,
      poids_kg: line.weight,
      destination: line.destination,
      notes: line.notes
    });
    // Normaliser la réponse pour correspondre à l'interface TicketLine
    return {
      id: response.data.id,
      ticket_id: response.data.ticket_id,
      category: response.data.category_id, // Pour compatibilité
      dom_category_id: response.data.category_id,
      weight: response.data.poids_kg,
      poids_kg: response.data.poids_kg,
      destination: response.data.destination,
      notes: response.data.notes,
      created_at: response.data.created_at,
      updated_at: response.data.updated_at
    };
  }

  async deleteTicketLine(ticketId: string, lineId: string): Promise<void> {
    await api.delete(`/v1/reception/lignes/${lineId}`);
  }

  async getTicket(ticketId: string): Promise<Ticket> {
    const response = await api.get(`/v1/reception/tickets/${ticketId}`);
    return response.data;
  }

  async getPoste(posteId: string): Promise<Poste> {
    const response = await api.get(`/v1/reception/postes/${posteId}`);
    return response.data;
  }

  async getCategories(): Promise<Array<{id: string, label: string, slug: string}>> {
    const response = await api.get('/v1/reception/categories');
    return response.data;
  }
}

export const receptionService = new ReceptionService();
