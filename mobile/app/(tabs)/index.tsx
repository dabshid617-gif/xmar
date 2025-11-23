import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { supabase } from '@/lib/supabase';

type Product = {
  id: string;
  title: string;
  price: number;
  image_url: string | null;
  category?: string | null;
  locations?: { name?: string | null } | null;
};

const HERO_STATS = [
  { label: 'Active Ads', value: '2.5M+' },
  { label: 'Happy Buyers', value: '500K+' },
  { label: 'Sellers Online', value: '120K+' },
];

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=600&q=60';

export default function HomeScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('id, title, price, image_url, category, locations(name)')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(60);

      if (error) throw error;

      setProducts(data ?? []);
      const uniqueCategories = Array.from(
        new Set((data ?? []).map((item) => item.category).filter(Boolean) as string[]),
      );
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Failed to load products', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === 'all' ||
        (product.category ?? '').toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch =
        searchQuery.trim().length === 0 ||
        product.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Find almost anything</Text>
        <Text style={styles.heroSubtitle}>
          Search across thousands of products powered by our Supabase marketplace.
        </Text>
        <TextInput
          style={styles.searchInput}
          placeholder="What are you looking for?"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#94A3B8"
        />
        <View style={styles.statsRow}>
          {HERO_STATS.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesRow}>
        <CategoryChip
          label="All"
          active={selectedCategory === 'all'}
          onPress={() => setSelectedCategory('all')}
        />
        {categories.map((category) => (
          <CategoryChip
            key={category}
            label={category}
            active={selectedCategory === category}
            onPress={() => setSelectedCategory(category)}
          />
        ))}
      </ScrollView>

      <View style={styles.gridHeader}>
        <Text style={styles.sectionTitle}>Popular Items</Text>
        <Text style={styles.sectionSubtitle}>{filteredProducts.length} results</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading products…</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 16 }}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          renderItem={({ item }) => <ProductCard product={item} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No products found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your filters or search query.</Text>
            </View>
          }
        />
      )}
    </ScrollView>
  );
}

function CategoryChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <View style={styles.card}>
      <Image source={{ uri: product.image_url || FALLBACK_IMAGE }} style={styles.cardImage} resizeMode="cover" />
      <View style={styles.cardBody}>
        <Text numberOfLines={2} style={styles.cardTitle}>
          {product.title}
        </Text>
        <Text style={styles.cardPrice}>${Number(product.price ?? 0).toFixed(2)}</Text>
        <Text numberOfLines={1} style={styles.cardLocation}>
          {product.locations?.name ?? 'Nationwide'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 20,
    paddingBottom: 32,
    gap: 16,
  },
  hero: {
    backgroundColor: '#1D4ED8',
    borderRadius: 24,
    padding: 20,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    padding: 12,
  },
  statValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 4,
  },
  categoriesRow: {
    marginVertical: 4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
    marginRight: 10,
  },
  chipActive: {
    backgroundColor: '#2563EB',
  },
  chipLabel: {
    color: '#0F172A',
    fontWeight: '600',
  },
  chipLabelActive: {
    color: '#fff',
  },
  gridHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionSubtitle: {
    color: '#64748B',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 12,
    color: '#475569',
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 1,
  },
  cardImage: {
    width: '100%',
    height: 150,
  },
  cardBody: {
    padding: 12,
    gap: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2563EB',
  },
  cardLocation: {
    fontSize: 12,
    color: '#64748B',
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#64748B',
  },
});
