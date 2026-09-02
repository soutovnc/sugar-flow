import { useAuth } from '@clerk/expo';
import { Feather } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';

type BillingStatus = {
  subscribed: boolean;
  status: string | null;
  currentPeriodEnd?: string | null;
};

const apiUrl = process.env.EXPO_PUBLIC_BILLING_API_URL?.replace(/\/$/, '');

export default function BillingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(Boolean(apiUrl));
  const [actionLoading, setActionLoading] = useState(false);

  const request = useCallback(async (path: string, options: RequestInit = {}) => {
    if (!apiUrl) throw new Error('A API de faturamento ainda não foi configurada.');
    const token = await getToken();
    const response = await fetch(`${apiUrl}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? 'Não foi possível concluir esta ação.');
    return data;
  }, [getToken]);

  const loadStatus = useCallback(async () => {
    if (!apiUrl) return;
    setLoading(true);
    try {
      setStatus(await request('/api/billing/status'));
    } catch (error) {
      Alert.alert('Assinatura', error instanceof Error ? error.message : 'Não foi possível carregar sua assinatura.');
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    const timer = setTimeout(() => { void loadStatus(); }, 0);
    return () => clearTimeout(timer);
  }, [loadStatus]);

  const openCheckout = async (interval: 'month' | 'year') => {
    setActionLoading(true);
    try {
      const { url } = await request('/api/billing/checkout', { method: 'POST', body: JSON.stringify({ interval }) });
      const result = await WebBrowser.openAuthSessionAsync(url, Linking.createURL('billing'));
      if (result.type === 'success' || result.type === 'dismiss' || result.type === 'cancel') await loadStatus();
    } catch (error) {
      Alert.alert('Assinatura', error instanceof Error ? error.message : 'Não foi possível iniciar o pagamento.');
    } finally {
      setActionLoading(false);
    }
  };

  const openPortal = async () => {
    setActionLoading(true);
    try {
      const { url } = await request('/api/billing/portal', { method: 'POST' });
      await WebBrowser.openAuthSessionAsync(url, Linking.createURL('billing'));
      await loadStatus();
    } catch (error) {
      Alert.alert('Gerenciar assinatura', error instanceof Error ? error.message : 'Não foi possível abrir o portal.');
    } finally {
      setActionLoading(false);
    }
  };

  const paddingTop = Platform.OS === 'web' ? 67 : insets.top + 20;
  const active = status?.subscribed;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={[styles.content, { paddingTop, paddingBottom: insets.bottom + 40 }]}>
      <View style={[styles.icon, { backgroundColor: colors.primary }]}><Feather name="credit-card" size={28} color={colors.primaryForeground} /></View>
      <Text style={[styles.title, { color: colors.foreground }]}>Seu plano</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Assine o Bakery Suite Pro para manter sua confeitaria organizada.</Text>

      {!apiUrl ? (
        <View style={[styles.notice, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="tool" size={20} color={colors.mutedForeground} />
          <Text style={[styles.noticeText, { color: colors.mutedForeground }]}>O faturamento está sendo configurado. Tente novamente em breve.</Text>
        </View>
      ) : loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : active ? (
        <View style={[styles.activeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.statusRow}><Feather name="check-circle" size={20} color={colors.success} /><Text style={[styles.activeTitle, { color: colors.foreground }]}>Assinatura ativa</Text></View>
          {status?.currentPeriodEnd && <Text style={[styles.statusText, { color: colors.mutedForeground }]}>Renova em {new Date(status.currentPeriodEnd).toLocaleDateString('pt-BR')}.</Text>}
          <ActionButton label="Gerenciar assinatura" onPress={openPortal} disabled={actionLoading} colors={colors} outlined />
        </View>
      ) : (
        <View style={styles.plans}>
          <PlanCard title="Mensal" description="Flexibilidade para começar." button="Assinar mensal" onPress={() => openCheckout('month')} disabled={actionLoading} colors={colors} />
          <PlanCard title="Anual" description="Economia no compromisso de um ano." badge="Melhor valor" button="Assinar anual" onPress={() => openCheckout('year')} disabled={actionLoading} colors={colors} featured />
        </View>
      )}
      {actionLoading && <ActivityIndicator color={colors.primary} style={styles.loader} />}
    </ScrollView>
  );
}

function PlanCard({ title, description, badge, button, onPress, disabled, colors, featured = false }: { title: string; description: string; badge?: string; button: string; onPress: () => void; disabled: boolean; colors: ReturnType<typeof useColors>; featured?: boolean }) {
  return <View style={[styles.plan, { backgroundColor: colors.card, borderColor: featured ? colors.primary : colors.border }]}>
    {badge && <Text style={[styles.badge, { backgroundColor: colors.primary, color: colors.primaryForeground }]}>{badge}</Text>}
    <Text style={[styles.planTitle, { color: colors.foreground }]}>{title}</Text>
    <Text style={[styles.planDescription, { color: colors.mutedForeground }]}>{description}</Text>
    <ActionButton label={button} onPress={onPress} disabled={disabled} colors={colors} outlined={!featured} />
  </View>;
}

function ActionButton({ label, onPress, disabled, colors, outlined = false }: { label: string; onPress: () => void; disabled: boolean; colors: ReturnType<typeof useColors>; outlined?: boolean }) {
  return <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.button, { backgroundColor: outlined ? colors.card : colors.primary, borderColor: colors.primary }, outlined && styles.outlinedButton, disabled && { opacity: 0.5 }, pressed && { opacity: 0.85 }]}><Text style={[styles.buttonText, { color: outlined ? colors.primary : colors.primaryForeground }]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  container: { flex: 1 }, content: { paddingHorizontal: 24 }, icon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 18 },
  title: { fontSize: 26, fontFamily: 'Inter_700Bold', textAlign: 'center' }, subtitle: { fontSize: 14, lineHeight: 21, fontFamily: 'Inter_400Regular', textAlign: 'center', marginTop: 8, marginBottom: 30 },
  notice: { flexDirection: 'row', gap: 12, borderWidth: 1, borderRadius: 16, padding: 18, alignItems: 'center' }, noticeText: { flex: 1, fontSize: 14, lineHeight: 20, fontFamily: 'Inter_400Regular' }, loader: { marginTop: 24 },
  activeCard: { borderWidth: 1, borderRadius: 18, padding: 20 }, statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 }, activeTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold' }, statusText: { fontSize: 14, fontFamily: 'Inter_400Regular', marginTop: 12 },
  plans: { gap: 14 }, plan: { borderWidth: 1, borderRadius: 18, padding: 20, overflow: 'hidden' }, badge: { alignSelf: 'flex-start', borderRadius: 99, overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 5, fontSize: 12, fontFamily: 'Inter_600SemiBold', marginBottom: 12 }, planTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' }, planDescription: { fontSize: 14, fontFamily: 'Inter_400Regular', marginTop: 6 },
  button: { height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 20 }, outlinedButton: { borderWidth: 1 }, buttonText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
});
