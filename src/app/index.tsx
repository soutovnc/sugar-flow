import { EmptyState } from '@/components/EmptyState';
import { OrderCard } from '@/components/OrderCard';
import { StatCard } from '@/components/StatCard';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo } from 'react';
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate() {
  return new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { orders, products } = useApp();
  const [refreshing, setRefreshing] = React.useState(false);

  const today = useMemo(() => {
    const todayStr = new Date().toDateString();
    return orders.filter(o => new Date(o.createdAt).toDateString() === todayStr);
  }, [orders]);

  const stats = useMemo(() => {
    const revenue = today
      .filter(o => o.status === 'completed')
      .reduce((s, o) => s + o.total, 0);
    const pending = orders.filter(o => o.status === 'pending').length;
    const inProgress = orders.filter(o => o.status === 'in_progress').length;
    const availableProducts = products.filter(p => p.available).length;
    return { revenue, pending, inProgress, availableProducts };
  }, [today, orders, products]);

  const recentOrders = useMemo(() =>
    orders
      .filter(o => o.status !== 'completed' && o.status !== 'cancelled')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5),
    [orders]
  );

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: topPad + 16,
          paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 100,
        },
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>{getGreeting()}</Text>
          <Text style={[styles.bakeryName, { color: colors.foreground }]}>Bakery Suite Pro</Text>
          <Text style={[styles.date, { color: colors.mutedForeground }]}>{formatDate()}</Text>
        </View>
        <TouchableOpacity
          style={[styles.notifBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          activeOpacity={0.7}
        >
          <Feather name="bell" size={20} color={colors.foreground} />
          {stats.pending > 0 && (
            <View style={[styles.notifDot, { backgroundColor: colors.primary }]} />
          )}
        </TouchableOpacity>
      </View>

      <View style={[styles.revenueCard, { backgroundColor: colors.primary }]}>
        <View>
          <Text style={styles.revenueLabel}>Receita de hoje</Text>
          <Text style={styles.revenueValue}>{formatCurrency(stats.revenue)}</Text>
          <Text style={styles.revenueSub}>
            {today.filter(o => o.status === 'completed').length} pedidos concluídos
          </Text>
        </View>
        <View style={styles.revenueIcon}>
          <Feather name="trending-up" size={32} color="rgba(255,255,255,0.4)" />
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatCard
          label="Pendentes"
          value={String(stats.pending)}
          icon="clock"
          color="#D4822A"
          subtitle={stats.pending > 0 ? 'atenção' : 'tudo ok'}
        />
        <StatCard
          label="Em Preparo"
          value={String(stats.inProgress)}
          icon="zap"
          color="#1E6FD6"
        />
        <StatCard
          label="Produtos"
          value={String(stats.availableProducts)}
          icon="package"
          color={colors.success}
          subtitle="disponíveis"
        />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Pedidos ativos</Text>
        <TouchableOpacity onPress={() => router.push('/orders')} activeOpacity={0.7}>
          <Text style={[styles.seeAll, { color: colors.primary }]}>Ver todos</Text>
        </TouchableOpacity>
      </View>

      {recentOrders.length === 0 ? (
        <EmptyState
          icon="inbox"
          title="Nenhum pedido ativo"
          description="Os novos pedidos aparecerão aqui"
        />
      ) : (
        recentOrders.map(order => (
          <OrderCard
            key={order.id}
            order={order}
            onPress={() => router.push('/orders')}
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  bakeryName: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  date: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginTop: 4,
  },
  notifDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#FAF7F2',
  },
  revenueCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  revenueLabel: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(255,255,255,0.75)',
  },
  revenueValue: {
    fontSize: 32,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    letterSpacing: -1,
    marginTop: 4,
  },
  revenueSub: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.65)',
    marginTop: 4,
  },
  revenueIcon: {
    opacity: 0.8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
  },
  seeAll: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
});
