import type { Product, ProductCategory } from '@/@types';
import { EmptyState } from '@/components/EmptyState';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CATEGORIES: (ProductCategory | 'Todos')[] = ['Todos', 'Pães', 'Doces', 'Bolos', 'Salgados', 'Bebidas', 'Outros'];

interface ProductFormProps {
  visible: boolean;
  onClose: () => void;
  onSave: (product: Omit<Product, 'id'>) => void;
  initial?: Product | null;
}

function ProductForm({ visible, onClose, onSave, initial }: ProductFormProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(initial?.name ?? '');
  const [price, setPrice] = useState(initial?.price ? String(initial.price) : '');
  const [category, setCategory] = useState<ProductCategory>(initial?.category ?? 'Pães');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [available, setAvailable] = useState(initial?.available ?? true);

  React.useEffect(() => {
    if (visible) {
      setName(initial?.name ?? '');
      setPrice(initial?.price ? String(initial.price) : '');
      setCategory(initial?.category ?? 'Pães');
      setDescription(initial?.description ?? '');
      setAvailable(initial?.available ?? true);
    }
  }, [visible, initial]);

  const handleSave = () => {
    if (!name.trim() || !price.trim()) {
      Alert.alert('Campos obrigatórios', 'Preencha o nome e o preço do produto.');
      return;
    }
    const parsedPrice = parseFloat(price.replace(',', '.'));
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      Alert.alert('Preço inválido', 'Informe um preço válido.');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave({ name: name.trim(), price: parsedPrice, category, description: description.trim(), available });
    onClose();
  };

  const PROD_CATEGORIES: ProductCategory[] = ['Pães', 'Doces', 'Bolos', 'Salgados', 'Bebidas', 'Outros'];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>
            {initial ? 'Editar produto' : 'Novo produto'}
          </Text>
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
            placeholder="Ex: Pão de Queijo"
            placeholderTextColor={colors.mutedForeground}
          />

          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Preço (R$) *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            value={price}
            onChangeText={setPrice}
            placeholder="0,00"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="decimal-pad"
          />

          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Categoria</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={{ gap: 8 }}>
            {PROD_CATEGORIES.map(c => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.catChip,
                  {
                    backgroundColor: category === c ? colors.primary : colors.card,
                    borderColor: category === c ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setCategory(c)}
                activeOpacity={0.7}
              >
                <Text style={[styles.catLabel, { color: category === c ? '#fff' : colors.foreground }]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Descrição</Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Descrição opcional"
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={3}
          />

          <View style={[styles.toggleRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View>
              <Text style={[styles.toggleLabel, { color: colors.foreground }]}>Disponível para venda</Text>
              <Text style={[styles.toggleSub, { color: colors.mutedForeground }]}>Aparece no cardápio ativo</Text>
            </View>
            <Switch
              value={available}
              onValueChange={setAvailable}
              trackColor={{ false: colors.muted, true: colors.primary + '60' }}
              thumbColor={available ? colors.primary : colors.mutedForeground}
            />
          </View>
        </ScrollView>

        <View style={[styles.formActions, { paddingBottom: insets.bottom + 16, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary }]}
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>
              {initial ? 'Salvar alterações' : 'Adicionar produto'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function ProductsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { products, addProduct, updateProduct, toggleProductAvailability, deleteProduct } = useApp();
  const [catFilter, setCatFilter] = useState<ProductCategory | 'Todos'>('Todos');
  const [formVisible, setFormVisible] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() =>
    products
      .filter(p => catFilter === 'Todos' || p.category === catFilter)
      .filter(p => !search.trim() || p.name.toLowerCase().includes(search.toLowerCase())),
    [products, catFilter, search]
  );

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const handleSave = async (data: Omit<Product, 'id'>) => {
    if (editProduct) {
      await updateProduct({ ...editProduct, ...data });
    } else {
      await addProduct(data);
    }
  };

  const handleDelete = (product: Product) => {
    Alert.alert('Remover produto?', `"${product.name}" será removido.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          deleteProduct(product.id);
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, borderBottomColor: colors.border }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>Produtos</Text>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={() => {
              setEditProduct(null);
              setFormVisible(true);
            }}
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
            placeholder="Buscar produto..."
            placeholderTextColor={colors.mutedForeground}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} activeOpacity={0.7}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.catScroll}
        contentContainerStyle={styles.catContent}
      >
        {CATEGORIES.map(c => {
          const active = catFilter === c;
          return (
            <TouchableOpacity
              key={c}
              style={[
                styles.catChipFilter,
                { backgroundColor: active ? colors.primary : colors.card, borderColor: active ? colors.primary : colors.border },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setCatFilter(c);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.catLabel, { color: active ? '#fff' : colors.foreground }]}>{c}</Text>
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
            icon="package"
            title="Nenhum produto"
            description="Toque em + para adicionar seu primeiro produto"
          />
        }
        renderItem={({ item }) => (
          <View style={[styles.productRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.productIcon, { backgroundColor: item.available ? colors.primary + '18' : colors.muted }]}>
              <Feather
                name={item.category === 'Bebidas' ? 'coffee' : item.category === 'Bolos' ? 'gift' : 'shopping-bag'}
                size={18}
                color={item.available ? colors.primary : colors.mutedForeground}
              />
            </View>
            <View style={styles.productInfo}>
              <Text style={[styles.productName, { color: colors.foreground }]}>{item.name}</Text>
              <Text style={[styles.productCat, { color: colors.mutedForeground }]}>
                {item.category}
                {!item.available ? ' · Indisponível' : ''}
              </Text>
            </View>
            <View style={styles.productRight}>
              <Text style={[styles.productPrice, { color: colors.foreground }]}>
                R$ {item.price.toFixed(2)}
              </Text>
              <View style={styles.productActions}>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.selectionAsync();
                    toggleProductAvailability(item.id);
                  }}
                  activeOpacity={0.7}
                  style={styles.iconBtn}
                >
                  <Feather
                    name={item.available ? 'eye' : 'eye-off'}
                    size={16}
                    color={item.available ? colors.success : colors.mutedForeground}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setEditProduct(item);
                    setFormVisible(true);
                  }}
                  activeOpacity={0.7}
                  style={styles.iconBtn}
                >
                  <Feather name="edit-2" size={16} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDelete(item)}
                  activeOpacity={0.7}
                  style={styles.iconBtn}
                >
                  <Feather name="trash-2" size={16} color={colors.destructive} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />

      <ProductForm
        visible={formVisible}
        onClose={() => {
          setFormVisible(false);
          setEditProduct(null);
        }}
        onSave={handleSave}
        initial={editProduct}
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
  catScroll: { flexGrow: 0 },
  catContent: { paddingHorizontal: 20, paddingVertical: 12, gap: 8 },
  catChipFilter: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 100,
    borderWidth: 1,
  },
  catLabel: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  list: { paddingHorizontal: 20, paddingTop: 4 },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  productIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: { flex: 1 },
  productName: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  productCat: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  productRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  productPrice: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  productActions: {
    flexDirection: 'row',
    gap: 4,
  },
  iconBtn: {
    padding: 4,
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  // catScroll: { flexGrow: 0 },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginTop: 16,
    marginBottom: 20,
  },
  toggleLabel: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  toggleSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
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
