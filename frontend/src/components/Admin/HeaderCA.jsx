import React, { useState, useEffect } from 'react';
import { Paper, Text, Group, Badge, Loader } from '@mantine/core';
import { IconCurrencyEuro, IconTrendingUp } from '@tabler/icons-react';
import axiosClient from '../../api/axiosClient';

const HeaderCA = () => {
  const [caMois, setCaMois] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCAMois();
    // Auto-refresh toutes les 30 secondes
    const interval = setInterval(fetchCAMois, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchCAMois = async () => {
    try {
      setLoading(true);
      
      // Récupérer les stats du mois en cours
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const response = await axiosClient.get(`/v1/cash-sessions/stats/summary?date_from=${firstDayOfMonth.toISOString()}`);
      
      console.log('Stats récupérées:', response.data);
      
      if (response.data) {
        // Utiliser directement les stats du mois
        const ca = parseFloat(response.data.total_sales) || 0;
        const dons = parseFloat(response.data.total_donations) || 0;
        const caTotal = ca + dons;
        
        console.log(`CA: ${ca}, Dons: ${dons}, Total: ${caTotal}`);
        setCaMois(caTotal);
      } else {
        console.log('Aucune donnée de stats trouvée');
        setCaMois(0);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du CA:', error);
      setCaMois(0);
    } finally {
      setLoading(false);
    }
  };

  const formatCA = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Paper p="sm" withBorder bg="gray.0" style={{ borderRadius: '8px' }}>
      <Group gap="xs" align="center" justify="center">
        <IconCurrencyEuro size={16} color="#64748b" />
        <Text size="sm" c="dimmed" fw={500}>CA Mois:</Text>
        
        {loading ? (
          <Group gap="xs" align="center">
            <Loader size="sm" />
            <Text size="sm" c="dimmed">Calcul...</Text>
          </Group>
        ) : (
          <Group gap="xs" align="center">
            <Text size="sm" fw={600} c="dark">
              {formatCA(caMois)}
            </Text>
            {caMois > 0 && (
              <Badge size="sm" color="green" variant="light">
                <IconTrendingUp size={12} />
              </Badge>
            )}
          </Group>
        )}
      </Group>
    </Paper>
  );
};

export default HeaderCA;
