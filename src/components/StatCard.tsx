import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

interface StatCardProps {
  label: string;
  value: string;
  icon: keyof typeof Feather.glyphMap;
  color?: string;
  subtitle?: string;
}

export function StatCard({ label, value, icon, color, subtitle }: StatCardProps) {
  const colors = useColors();
  const iconColor = color ?? colors.primary;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.iconWrap, { backgroundColor: iconColor + '18' }]}>
        <Feather name={icon} size={18} color={iconColor} />
      </View>
      <Text style={[styles.value, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: iconColor }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 4,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  value: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  subtitle: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    marginTop: 2,
  },
});
