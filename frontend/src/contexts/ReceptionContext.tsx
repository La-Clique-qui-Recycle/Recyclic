import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { receptionService } from '../services/receptionService';

interface Poste {
  id: string;
  status: 'open' | 'closed';
  opened_at: string;
  closed_at?: string;
}

interface Ticket {
  id: string;
  poste_id: string;
  created_at: string;
  status: 'draft' | 'closed';
  lines: TicketLine[];
}

interface TicketLine {
  id: string;
  ticket_id: string;
  category: string;
  weight: number;
  destination: 'MAGASIN' | 'RECYCLAGE' | 'DECHETERIE';
  notes?: string;
}

interface ReceptionContextType {
  poste: Poste | null;
  currentTicket: Ticket | null;
  isLoading: boolean;
  error: string | null;
  openPoste: () => Promise<void>;
  closePoste: () => Promise<void>;
  createTicket: () => Promise<string>;
  closeTicket: (ticketId: string) => Promise<void>;
  addLineToTicket: (ticketId: string, line: Omit<TicketLine, 'id' | 'ticket_id'>) => Promise<void>;
  updateTicketLine: (ticketId: string, lineId: string, line: Partial<TicketLine>) => Promise<void>;
  deleteTicketLine: (ticketId: string, lineId: string) => Promise<void>;
}

const ReceptionContext = createContext<ReceptionContextType | undefined>(undefined);

interface ReceptionProviderProps {
  children: ReactNode;
}

export const ReceptionProvider: React.FC<ReceptionProviderProps> = ({ children }) => {
  const [poste, setPoste] = useState<Poste | null>(null);
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openPoste = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const newPoste = await receptionService.openPoste();
      setPoste(newPoste);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'ouverture du poste');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const closePoste = useCallback(async () => {
    if (!poste) return;
    
    try {
      setIsLoading(true);
      setError(null);
      await receptionService.closePoste(poste.id);
      setPoste(null);
      setCurrentTicket(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la fermeture du poste');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [poste]);

  const createTicket = useCallback(async () => {
    if (!poste) throw new Error('Aucun poste ouvert');
    
    try {
      setIsLoading(true);
      setError(null);
      const newTicket = await receptionService.createTicket(poste.id);
      // newTicket is { id: string }
      const ticketId = (newTicket as any).id;
      setCurrentTicket({ id: ticketId, poste_id: poste.id, created_at: new Date().toISOString(), status: 'opened' as any, lines: [] } as any);
      return ticketId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création du ticket');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [poste]);

  const closeTicket = async (ticketId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await receptionService.closeTicket(ticketId);
      setCurrentTicket(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la fermeture du ticket');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const addLineToTicket = async (ticketId: string, line: Omit<TicketLine, 'id' | 'ticket_id'>) => {
    try {
      setIsLoading(true);
      setError(null);
      const newLine = await receptionService.addLineToTicket(ticketId, line);
      // Mettre à jour localement les lignes
      setCurrentTicket((prev) => {
        if (!prev) return prev;
        const prevLines = Array.isArray((prev as any).lines) ? (prev as any).lines : [];
        return { ...prev, lines: [...prevLines, newLine] } as any;
      });
      return newLine;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'ajout de la ligne');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateTicketLine = async (ticketId: string, lineId: string, line: Partial<TicketLine>) => {
    try {
      setIsLoading(true);
      setError(null);
      const updatedLine = await receptionService.updateTicketLine(ticketId, lineId, line);
      
      if (currentTicket && currentTicket.id === ticketId) {
        setCurrentTicket(prev => prev ? {
          ...prev,
          lines: prev.lines.map(l => l.id === lineId ? updatedLine : l)
        } : null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour de la ligne');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTicketLine = async (ticketId: string, lineId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await receptionService.deleteTicketLine(ticketId, lineId);
      
      if (currentTicket && currentTicket.id === ticketId) {
        setCurrentTicket(prev => prev ? {
          ...prev,
          lines: prev.lines.filter(l => l.id !== lineId)
        } : null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression de la ligne');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ReceptionContext.Provider
      value={{
        poste,
        currentTicket,
        isLoading,
        error,
        openPoste,
        closePoste,
        createTicket,
        closeTicket,
        addLineToTicket,
        updateTicketLine,
        deleteTicketLine,
      }}
    >
      {children}
    </ReceptionContext.Provider>
  );
};

export const useReception = () => {
  const context = useContext(ReceptionContext);
  if (context === undefined) {
    throw new Error('useReception must be used within a ReceptionProvider');
  }
  return context;
};
