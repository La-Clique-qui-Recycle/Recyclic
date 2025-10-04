import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cashRegisterDashboardService, cashSessionService } from '../../services/cashSessionService';
import { Card, Badge, Group, Button, SimpleGrid, Title, Container, LoadingOverlay } from '@mantine/core';
import { useCashSessionStore } from '../../stores/cashSessionStore';

interface RegisterStatus {
  id: string;
  name: string;
  is_open: boolean;
}

const RegisterCard: React.FC<{ reg: RegisterStatus; onOpen: (id: string) => void; onResume: (id: string) => void }>
  = ({ reg, onOpen, onResume }) => {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Group position="apart" mb="xs">
        <Title order={4}>{reg.name}</Title>
        <Badge color={reg.is_open ? 'green' : 'gray'}>{reg.is_open ? 'Ouverte' : 'Fermée'}</Badge>
      </Group>
      <Group position="right">
        {reg.is_open ? (
          <Button color="green" onClick={() => onResume(reg.id)}>Reprendre</Button>
        ) : (
          <Button onClick={() => onOpen(reg.id)}>Ouvrir</Button>
        )}
      </Group>
    </Card>
  );
};

const CashRegisterDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { resumeSession } = useCashSessionStore();
  const [loading, setLoading] = useState(true);
  const [registers, setRegisters] = useState<RegisterStatus[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const list = await cashRegisterDashboardService.getRegistersStatus();
      setRegisters(list);
      setLoading(false);
    };
    load();
  }, []);

  const handleOpen = (registerId: string) => {
    navigate('/cash-register/session/open', { state: { register_id: registerId } });
  };

  const handleResume = async (registerId: string) => {
    // Récupérer l'ID de session ouverte et reprendre immédiatement
    const status = await cashSessionService.getRegisterSessionStatus(registerId);
    if (status.is_active && status.session_id) {
      const ok = await resumeSession(status.session_id);
      if (ok) {
        navigate('/cash-register/sale');
        return;
      }
    }
    // Fallback 1: essayer la session courante opérateur
    const current = await cashSessionService.getCurrentSession();
    if (current && current.status === 'open') {
      // Hydrater le store et naviguer
      // On réutilise resumeSession pour persistance + état
      const ok2 = await resumeSession(current.id);
      if (ok2) {
        navigate('/cash-register/sale');
        return;
      }
    }
    // Fallback: si pas de session détectée, aller à l'ouverture
    navigate('/cash-register/session/open', { state: { register_id: registerId } });
  };

  return (
    <Container size="lg" py="xl">
      <LoadingOverlay visible={loading} />
      <Title order={2} mb="lg">Sélection du Poste de Caisse</Title>
      <SimpleGrid cols={3} spacing="lg" breakpoints={[{ maxWidth: 'sm', cols: 1 }]}>
        {registers.map(reg => (
          <RegisterCard key={reg.id} reg={reg} onOpen={handleOpen} onResume={handleResume} />
        ))}
      </SimpleGrid>
    </Container>
  );
};

export default CashRegisterDashboard;


