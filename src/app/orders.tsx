import type { Order, OrderStatus } from '@/@types';
import { OrderBadge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type FilterTab = 'all' | OrderStatus;

const FILTERS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'pending', label: 'Pendentes' },
  { key: 'in_progress', label: 'Em Preparo' },
  { key: 'ready', label: 'Prontos' },
  { key: 'completed', label: 'Concluídos' },
];

const STATUS_FLOW: Partial<Record<OrderStatus, { next: OrderStatus; label: string }>> = {
  pending: { next: 'in_progress', label: 'Iniciar preparo' },
  in_progress: { next: 'ready', label: 'Marcar pronto' },
  ready: { next: 'completed', label: 'Concluir' },
};

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatCurrency(v: number) {
  return `R$ ${v.toFixed(2)}`;
}

interface OrderDetailModalProps {
  order: Order | null;
  visible: boolean;
  onClose: () => void;
  onUpdateStatus: (id: string, status: OrderStatus) => void;
  onDelete: (id: string) => void;
}

function OrderDetailModal({ order, visible, onClose, onUpdateStatus, onDelete }: OrderDetailModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  if (!order) return null;
  const flow = STATUS_FLOW[order.status];

  const handleNext = () => {
    if (!flow) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onUpdateStatus(order.id, flow.next);
    onClose();
  };

  const handleDelete = () => {
    Alert.alert('Cancelar pedido?', 'Esta ação não pode ser desfeita.', [
      { text: 'Voltar', style: 'cancel' },
      {
        text: 'Cancelar pedido',
        style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          onDelete(order.id);
          onClose();
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />

        <View style={styles.modalHeader}>
          <View>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Pedido #{order.id.slice(-4)}</Text>
            <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>{formatTime(order.createdAt)}</Text>
          </View>
          <OrderBadge status={order.status} />
        </View>

        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.infoRow}>
              <Feather name="user" size={15} color={colors.mutedForeground} />
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Cliente</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>{order.customerName}</Text>
            </View>
            {order.note ? (
              <View style={[styles.infoRow, { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 10, paddingTop: 10 }]}>
                <Feather name="message-square" size={15} color={colors.mutedForeground} />
                <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Obs.</Text>
                <Text style={[styles.infoValue, { color: colors.foreground }]}>{order.note}</Text>
              </View>
            ) : null}
          </View>

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Itens</Text>
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {order.items.map((item, idx) => (
              <View
                key={`${item.productId}-${idx}`}
                style={[
                  styles.itemRow,
                  idx > 0 && { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 10, paddingTop: 10 },
                ]}
              >
                <View style={[styles.qtyBadge, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.qtyText, { color: colors.foreground }]}>{item.quantity}x</Text>
                </View>
                <Text style={[styles.itemName, { color: colors.foreground }]}>{item.productName}</Text>
                <Text style={[styles.itemPrice, { color: colors.mutedForeground }]}>
                  {formatCurrency(item.price * item.quantity)}
                </Text>
              </View>
            ))}
            <View style={[styles.totalRow, { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 14, paddingTop: 14 }]}>
              <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>Total</Text>
              <Text style={[styles.totalValue, { color: colors.foreground }]}>{formatCurrency(order.total)}</Text>
            </View>
          </View>
        </ScrollView>

        <View style={[styles.modalActions, { paddingBottom: insets.bottom + 16, borderTopColor: colors.border }]}>
          {order.status !== 'completed' && order.status !== 'cancelled' && (
            <TouchableOpacity
              style={[styles.deleteBtn, { borderColor: colors.destructive }]}
              onPress={handleDelete}
              activeOpacity={0.7}
            >
              <Feather name="x-circle" size={18} color={colors.destructive} />
            </TouchableOpacity>
          )}
          {flow ? (
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary, flex: 1 }]}
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>{flow.label}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.secondary, flex: 1 }]}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={[styles.primaryBtnText, { color: colors.foreground }]}>Fechar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

export default function OrdersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { orders, updateOrderStatus, deleteOrder } = useApp();
  const [filter, setFilter] = useState<FilterTab>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const filtered = useMemo(() =>
    orders
      .filter(o => filter === 'all' || o.status === filter)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [orders, filter]
  );

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, borderBottomColor: colors.border }]}>
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>Pedidos</Text>
        <Text style={[styles.pageCount, { color: colors.mutedForeground }]}>
          {filtered.length} {filtered.length === 1 ? 'pedido' : 'pedidos'}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {FILTERS.map(f => {
          const count = f.key === 'all' ? orders.length : orders.filter(o => o.status === f.key).length;
          const active = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.filterChip,
                {
                  backgroundColor: active ? colors.primary : colors.card,
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setFilter(f.key);
              }}
              activeOpacity={0.75}
            >
              <Text style={[styles.filterLabel, { color: active ? colors.primaryForeground : colors.foreground }]}>
                {f.label}
              </Text>
              {count > 0 && (
                <View style={[styles.filterCount, { backgroundColor: active ? 'rgba(255,255,255,0.25)' : colors.muted }]}>
                  <Text style={[styles.filterCountText, { color: active ? '#fff' : colors.mutedForeground }]}>
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.list,
          {
            paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 100,
            ...(filtered.length === 0 ? { flex: 1 } : {}),
          },
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="clipboard"
            title="Nenhum pedido"
            description="Não há pedidos com este filtro no momento"
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.orderRow, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {
              setSelectedOrder(item);
              setModalVisible(true);
            }}
            activeOpacity={0.75}
          >
            <View style={styles.orderLeft}>
              <View style={[styles.orderAvatar, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.orderAvatarText, { color: colors.primary }]}>
                  {item.customerName.charAt(0)}
                </Text>
              </View>
              <View style={styles.orderInfo}>
                <Text style={[styles.orderName, { color: colors.foreground }]}>{item.customerName}</Text>
                <Text style={[styles.orderMeta, { color: colors.mutedForeground }]}>
                  {item.items.reduce((s, i) => s + i.quantity, 0)} itens · R$ {item.total.toFixed(2)}
                </Text>
              </View>
            </View>
            <View style={styles.orderRight}>
              <OrderBadge status={item.status} size="sm" />
              <Text style={[styles.orderTime, { color: colors.mutedForeground }]}>
                {new Date(item.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />

      <OrderDetailModal
        order={selectedOrder}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onUpdateStatus={updateOrderStatus}
        onDelete={deleteOrder}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  pageTitle: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
  },
  pageCount: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  filterScroll: { flexGrow: 0 },
  filterContent: { paddingHorizontal: 20, paddingVertical: 14, gap: 8 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1,
    gap: 6,
  },
  filterLabel: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  filterCount: {
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 100,
  },
  filterCountText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  list: { paddingHorizontal: 20, paddingTop: 4 },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  orderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  orderAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderAvatarText: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
  },
  orderInfo: { flex: 1 },
  orderName: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  orderMeta: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  orderRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  orderTime: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  // Modal
  modalContainer: { flex: 1, paddingTop: 12 },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
  },
  modalSub: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  modalBody: { flex: 1, paddingHorizontal: 20 },
  section: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    width: 48,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    flex: 1,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  qtyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  qtyText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  itemPrice: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  totalValue: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  deleteBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  primaryBtn: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
});
