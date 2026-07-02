import type { Order } from '@/@types';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { OrderBadge } from './Badge';

interface OrderCardProps {
  order: Order;
  onPress: () => void;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}min atrás`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h atrás`;
  return `${Math.floor(hrs / 24)}d atrás`;
}

export function OrderCard({ order, onPress }: OrderCardProps) {
  const colors = useColors();
  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.header}>
        <View style={styles.customer}>
          <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {order.customerName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
              {order.customerName}
            </Text>
            <Text style={[styles.time, { color: colors.mutedForeground }]}>
              {formatRelative(order.createdAt)}
            </Text>
          </View>
        </View>
        <OrderBadge status={order.status} size="sm" />
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.footer}>
        <View style={styles.meta}>
          <Feather name="shopping-bag" size={13} color={colors.mutedForeground} />
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
            {itemCount} {itemCount === 1 ? 'item' : 'itens'}
          </Text>
          {order.note ? (
            <>
              <View style={[styles.dot, { backgroundColor: colors.border }]} />
              <Feather name="message-square" size={13} color={colors.mutedForeground} />
            </>
          ) : null}
        </View>
        <Text style={[styles.total, { color: colors.foreground }]}>
          R$ {order.total.toFixed(2)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 12,
  },
  customer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  name: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  time: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 1,
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
  },
  total: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
});
