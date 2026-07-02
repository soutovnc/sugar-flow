import type { InventoryItem } from '@/@types';
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
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function getLevelColor(item: InventoryItem, colors: ReturnType<typeof useColors>) {
  const ratio = item.quantity / item.minQuantity;
  if (ratio <= 0.5) return colors.destructive;
  if (ratio <= 1) return colors.warning;
  return colors.success;
}

function getLevelBg(item: InventoryItem, colors: ReturnType<typeof useColors>) {
  const ratio = item.quantity / item.minQuantity;
  if (ratio <= 0.5) return colors.destructive + '15';
  if (ratio <= 1) return colors.warning + '15';
  return colors.success + '15';
}

interface AddItemFormProps {
  visible: boolean;
  onClose: () => void;
  onSave: (item: Omit<InventoryItem, 'id'>) => void;
}

function AddItemForm({ visible, onClose, onSave }: AddItemFormProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [minQuantity, setMinQuantity] = useState('');
  const [category, setCategory] = useState('');

  const UNITS = ['kg', 'g', 'L', 'mL', 'un', 'cx', 'pct'];

  const handleSave = () => {
    if (!name.trim() || !quantity.trim() || !minQuantity.trim()) {
      Alert.alert('Campos obrigatórios', 'Preencha todos os campos obrigatórios.');
      return;
    }
    const qty = parseFloat(quantity.replace(',', '.'));
    const minQty = parseFloat(minQuantity.replace(',', '.'));
    if (isNaN(qty) || isNaN(minQty)) {
      Alert.alert('Valores inválidos', 'Informe quantidades válidas.');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave({ name: name.trim(), quantity: qty, unit, minQuantity: minQty, category: category.trim() || 'Geral' });
    setName(''); setQuantity(''); setUnit('kg'); setMinQuantity(''); setCategory('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>Novo item</Text>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.formBody} showsVerticalScrollIndicator={false}>
          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Nome *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            value={name}
            onChangeText={setName}
            placeholder="Ex: Farinha de Trigo"
            placeholderTextColor={colors.mutedForeground}
          />

          <View style={styles.row}>
            <View style={styles.rowItem}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Quantidade *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                value={quantity}
                onChangeText={setQuantity}
                placeholder="0"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={[styles.rowItem, { maxWidth: 120 }]}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Unidade</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 0 }}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {UNITS.map(u => (
                    <TouchableOpacity
                      key={u}
                      style={[
                        styles.unitBtn,
                        {
                          backgroundColor: unit === u ? colors.primary : colors.card,
                          borderColor: unit === u ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => setUnit(u)}
                      activeOpacity={0.7}
                    >
                      <Text style={{ fontSize: 12, fontFamily: 'Inter_500Medium', color: unit === u ? '#fff' : colors.foreground }}>
                        {u}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>

          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Quantidade mínima *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            value={minQuantity}
            onChangeText={setMinQuantity}
            placeholder="Alerta abaixo deste valor"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="decimal-pad"
          />

          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Categoria</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            value={category}
            onChangeText={setCategory}
            placeholder="Ex: Farinhas"
            placeholderTextColor={colors.mutedForeground}
          />
        </ScrollView>

        <View style={[styles.formActions, { paddingBottom: insets.bottom + 16, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary }]}
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>Adicionar ao estoque</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function InventoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { inventory, updateInventoryQuantity, addInventoryItem } = useApp();
  const [formVisible, setFormVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const filtered = useMemo(() =>
    inventory.filter(i => !search.trim() || i.name.toLowerCase().includes(search.toLowerCase())),
    [inventory, search]
  );

  const lowStock = useMemo(() =>
    inventory.filter(i => i.quantity <= i.minQuantity),
    [inventory]
  );

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const startEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setEditValue(String(item.quantity));
  };

  const confirmEdit = async (id: string) => {
    const val = parseFloat(editValue.replace(',', '.'));
    if (!isNaN(val)) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await updateInventoryQuantity(id, val);
    }
    setEditingId(null);
    setEditValue('');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, borderBottomColor: colors.border }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>Estoque</Text>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={() => setFormVisible(true)}
            activeOpacity={0.8}
          >
            <Feather name="plus" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={[styles.searchRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar ingrediente..."
            placeholderTextColor={colors.mutedForeground}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} activeOpacity={0.7}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {lowStock.length > 0 && (
        <TouchableOpacity
          style={[styles.alertBanner, { backgroundColor: colors.destructive + '12', borderColor: colors.destructive + '30' }]}
          activeOpacity={0.8}
        >
          <Feather name="alert-triangle" size={16} color={colors.destructive} />
          <Text style={[styles.alertText, { color: colors.destructive }]}>
            {lowStock.length} {lowStock.length === 1 ? 'item com estoque baixo' : 'itens com estoque baixo'}
          </Text>
          <Feather name="chevron-right" size={16} color={colors.destructive} />
        </TouchableOpacity>
      )}

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
            icon="archive"
            title="Estoque vazio"
            description="Toque em + para adicionar itens ao estoque"
          />
        }
        renderItem={({ item }) => {
          const levelColor = getLevelColor(item, colors);
          const levelBg = getLevelBg(item, colors);
          const ratio = Math.min(item.quantity / (item.minQuantity * 2), 1);
          const isEditing = editingId === item.id;

          return (
            <View style={[styles.inventoryRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.levelDot, { backgroundColor: levelBg }]}>
                <View style={[styles.levelDotInner, { backgroundColor: levelColor }]} />
              </View>
              <View style={styles.itemInfo}>
                <Text style={[styles.itemName, { color: colors.foreground }]}>{item.name}</Text>
                <Text style={[styles.itemCat, { color: colors.mutedForeground }]}>
                  {item.category} · mín. {item.minQuantity} {item.unit}
                </Text>
                <View style={[styles.progressBg, { backgroundColor: colors.muted }]}>
                  <View
                    style={[
                      styles.progressFill,
                      { backgroundColor: levelColor, width: `${ratio * 100}%` as any },
                    ]}
                  />
                </View>
              </View>
              <View style={styles.quantityCol}>
                {isEditing ? (
                  <View style={styles.editRow}>
                    <TextInput
                      style={[styles.qtyInput, { backgroundColor: colors.secondary, borderColor: colors.primary, color: colors.foreground }]}
                      value={editValue}
                      onChangeText={setEditValue}
                      keyboardType="decimal-pad"
                      autoFocus
                      onBlur={() => confirmEdit(item.id)}
                      onSubmitEditing={() => confirmEdit(item.id)}
                    />
                    <Text style={[styles.unitLabel, { color: colors.mutedForeground }]}>{item.unit}</Text>
                  </View>
                ) : (
                  <TouchableOpacity onPress={() => startEdit(item)} activeOpacity={0.7} style={styles.qtyBtn}>
                    <Text style={[styles.qtyValue, { color: item.quantity <= item.minQuantity ? levelColor : colors.foreground }]}>
                      {item.quantity}
                    </Text>
                    <Text style={[styles.unitLabel, { color: colors.mutedForeground }]}>{item.unit}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
      />

      <AddItemForm
        visible={formVisible}
        onClose={() => setFormVisible(false)}
        onSave={addInventoryItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pageTitle: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    padding: 0,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: 16,
    marginBottom: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  alertText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  list: { paddingHorizontal: 20, paddingTop: 12 },
  inventoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  levelDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelDotInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  itemInfo: { flex: 1, gap: 3 },
  itemName: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  itemCat: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  progressBg: {
    height: 4,
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  quantityCol: {
    alignItems: 'flex-end',
  },
  qtyBtn: {
    alignItems: 'flex-end',
  },
  qtyValue: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  unitLabel: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  editRow: {
    alignItems: 'flex-end',
    gap: 2,
  },
  qtyInput: {
    width: 64,
    borderRadius: 8,
    borderWidth: 1.5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
  },
  formBody: { flex: 1, paddingHorizontal: 20 },
  fieldLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowItem: { flex: 1 },
  unitBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  formActions: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  saveBtn: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
});
