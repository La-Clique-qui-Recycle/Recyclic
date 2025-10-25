import React from 'react';
import { Paper, Stack, Text, Group, Loader } from '@mantine/core';

const StatWidget = ({ 
  title, 
  value, 
  unit, 
  icon, 
  color, 
  loading = false,
  description 
}) => {
  return (
    <Paper 
      p={{ base: 'sm', sm: 'md' }} 
      withBorder 
      bg={`${color}.0`}
      className="stat-card"
      style={{ 
        borderLeft: `4px solid ${color}`,
        borderRadius: '8px',
        transition: 'all 0.2s ease'
      }}
    >
      <Stack gap={{ base: 'xs', sm: 'sm' }} align="center">
        {icon}
        
        <Text size={{ base: 'sm', sm: 'md' }} fw={700} c="dark">
          {title}
        </Text>
        
        {loading ? (
          <Group gap="xs" align="center">
            <Loader size="sm" />
            <Text size={{ base: 'xs', sm: 'sm' }} c="dimmed">
              Chargement...
            </Text>
          </Group>
        ) : (
          <>
            <Text 
              size={{ base: 'lg', sm: 'xl' }} 
              fw={800} 
              c="dark"
              style={{ 
                fontSize: '1.5rem',
                fontWeight: 'bold'
              }}
            >
              {value || '0'}
            </Text>
            
            <Text size={{ base: 'xs', sm: 'sm' }} c="dimmed" ta="center">
              {unit}
            </Text>
            
            {description && (
              <Text size="xs" c="dimmed" ta="center" mt="xs">
                {description}
              </Text>
            )}
          </>
        )}
      </Stack>
    </Paper>
  );
};

export default StatWidget;
