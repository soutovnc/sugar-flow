import type { OrderStatus } from '@/@types';
import { useColors } from '@/hooks/useColors';
import { StyleSheet, Text, View } from 'react-native';

interface BadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md';
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; bg: string; text: string }> = {
  pending: { label: 'Pendente', bg: '#FEF3C7', text: '#92400E' },
  in_progress: { label: 'Em Preparo', bg: '#DBEAFE', text: '#1E40AF' },
  ready: { label: 'Pronto', bg: '#D1FAE5', text: '#065F46' },
  completed: { label: 'Concluído', bg: '#F3F4F6', text: '#374151' },
  cancelled: { label: 'Cancelado', bg: '#FEE2E2', text: '#991B1B' },
};

export function OrderBadge({ status, size = 'md' }: BadgeProps) {
  const colors = useColors()
  const config = STATUS_CONFIG[status];
  const isSmall = size === 'sm';

  return (
    <View style={[
      styles.badge,
      { backgroundColor: config.bg },
      isSmall && styles.badgeSm,
    ]}>
      <Text style={[
        styles.label,
        { color: config.text },
        isSmall && styles.labelSm,
      ]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  badgeSm: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  labelSm: {
    fontSize: 11,
  },
});
