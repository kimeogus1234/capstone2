import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { BASE_URL, IMAGE_BASE_URL } from '../api/config';

const FILTER_ALL = '전체';

const DiningScreen = ({ navigation }) => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState(FILTER_ALL);

  const fetchRestaurants = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const response = await fetch(`${BASE_URL}/api/dining/restaurants`);
      const data = await response.json();
      setRestaurants(Array.isArray(data) ? data : (data.restaurants || []));
    } catch (error) {
      console.error('Restaurant Fetch Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRestaurants(true);
  };

  const getFullUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const cleanUrl = url.replace(/^\/+/, '');
    if (cleanUrl.startsWith('uploads/')) return `${IMAGE_BASE_URL}/${cleanUrl}`;
    return `${IMAGE_BASE_URL}/uploads/${cleanUrl}`;
  };

  const cuisineFilters = useMemo(() => {
    const types = restaurants
      .map((r) => r.cuisineType)
      .filter(Boolean);
    return [FILTER_ALL, ...Array.from(new Set(types))];
  }, [restaurants]);

  const filteredRestaurants = useMemo(() => {
    if (activeFilter === FILTER_ALL) return restaurants;
    return restaurants.filter((r) => r.cuisineType === activeFilter);
  }, [restaurants, activeFilter]);

  const renderFilterChip = (label) => {
    const selected = activeFilter === label;
    return (
      <TouchableOpacity
        key={label}
        style={[styles.chip, selected && styles.chipActive]}
        onPress={() => setActiveFilter(label)}
        activeOpacity={0.7}
      >
        <Text style={[styles.chipText, selected && styles.chipTextActive]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const renderRestaurant = ({ item: res }) => {
    const imageUri = getFullUrl(res.imageUrl);
    const locationLabel = [res.floor, res.locationCode].filter(Boolean).join(' · ');

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('RestaurantMenu', { restaurant: res })}
      >
        <View style={styles.thumbWrap}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.thumb} />
          ) : (
            <View style={[styles.thumb, styles.thumbEmpty]}>
              <Ionicons name="restaurant-outline" size={28} color="#ccc" />
            </View>
          )}
        </View>

        <View style={styles.cardBody}>
          <View style={styles.cardTopRow}>
            <Text style={styles.cardName} numberOfLines={1}>{res.name}</Text>
            {res.isPopular ? (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>인기</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.metaRow}>
            {res.cuisineType ? (
              <Text style={styles.cuisineTag}>{res.cuisineType}</Text>
            ) : null}
            {locationLabel ? (
              <Text style={styles.metaText}>{locationLabel}</Text>
            ) : null}
          </View>

          {res.hours ? (
            <Text style={styles.hoursText}>{res.hours}</Text>
          ) : null}

          {res.description ? (
            <Text style={styles.descText} numberOfLines={1}>{res.description}</Text>
          ) : null}
        </View>

        <Ionicons name="chevron-forward" size={18} color="#ccc" style={styles.chevron} />
      </TouchableOpacity>
    );
  };

  const listHeader = (
    <View style={styles.listHeader}>
      <Text style={styles.countText}>
        {filteredRestaurants.length}개 매장
      </Text>
      {cuisineFilters.length > 2 ? (
        <View style={styles.chipRow}>
          {cuisineFilters.map(renderFilterChip)}
        </View>
      ) : null}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn} hitSlop={8}>
            <Ionicons name="chevron-back" size={26} color="#111" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>다이닝</Text>
          <View style={styles.headerBtn} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="small" color="#111" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn} hitSlop={8}>
          <Ionicons name="chevron-back" size={26} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>다이닝</Text>
        <View style={styles.headerBtn} />
      </View>

      <FlatList
        data={filteredRestaurants}
        keyExtractor={(item) => item._id}
        renderItem={renderRestaurant}
        ListHeaderComponent={listHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#111" />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="restaurant-outline" size={48} color="#ddd" />
            <Text style={styles.emptyTitle}>등록된 매장이 없습니다</Text>
            <Text style={styles.emptySub}>잠시 후 다시 확인해 주세요.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    height: 52,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  listHeader: {
    paddingTop: 16,
    paddingBottom: 12,
  },
  countText: {
    fontSize: 13,
    color: '#888',
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  chipActive: {
    backgroundColor: '#111',
    borderColor: '#111',
  },
  chipText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#fff',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  thumbWrap: {
    marginRight: 14,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
  },
  thumbEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  popularBadge: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#f5f5f5',
  },
  popularText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 2,
  },
  cuisineTag: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111',
  },
  metaText: {
    fontSize: 12,
    color: '#888',
  },
  hoursText: {
    fontSize: 12,
    color: '#aaa',
    marginBottom: 2,
  },
  descText: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  chevron: {
    marginLeft: 8,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#eee',
  },
  emptyBox: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 40,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  emptySub: {
    marginTop: 6,
    fontSize: 13,
    color: '#aaa',
  },
});

export default DiningScreen;
