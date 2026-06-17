import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, SafeAreaView, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { BASE_URL, IMAGE_BASE_URL } from '../api/config';

const { width } = Dimensions.get('window');

const RestaurantMenuScreen = ({ route, navigation }) => {
  const { restaurant } = route.params;
  const [menus, setMenus] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchMenus();
  }, []);

  const fetchMenus = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/dining/menus/${restaurant._id}`);
      const data = await response.json();
      setMenus(Array.isArray(data) ? data : (data.menus || []));
    } catch (error) {
      console.error('Menu Fetch Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFullUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const cleanUrl = url.replace(/^\/+/, '');
    if (cleanUrl.startsWith('uploads/')) return `${IMAGE_BASE_URL}/${cleanUrl}`;
    return `${IMAGE_BASE_URL}/uploads/${cleanUrl}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 🏙️ 상단 바 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{restaurant.name}</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 🏢 음식점 상세 정보 */}
        <View style={styles.resCover}>
          {restaurant.imageUrl ? (
            <Image source={{ uri: getFullUrl(restaurant.imageUrl) }} style={styles.coverImg} />
          ) : (
            <View style={[styles.coverImg, styles.emptyCoverImg]}>
              <Ionicons name="restaurant-outline" size={60} color="#adb5bd" />
            </View>
          )}
          <View style={styles.coverOverlay}>
            <View style={styles.tagRow}>
              <View style={styles.cuisineBadge}>
                <Text style={styles.cuisineText}>{restaurant.cuisineType || '다이닝'}</Text>
              </View>
              <View style={styles.floorBadge}>
                <Text style={styles.floorText}>{restaurant.floor}</Text>
              </View>
            </View>
            <Text style={styles.resIntro}>{restaurant.description || '정성을 다하는 맛있는 공간입니다.'}</Text>
          </View>
        </View>

        {/* 🥗 메뉴 리스트 */}
        <View style={styles.menuSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>대표 메뉴판</Text>
            <Text style={styles.sectionSub}>전체 {menus.length}개</Text>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color="#000" style={{ marginTop: 30 }} />
          ) : (
            menus.map((menu) => (
              <View key={menu._id} style={styles.menuItem}>
                {menu.imageUrl ? (
                  <Image source={{ uri: getFullUrl(menu.imageUrl) }} style={styles.menuThumb} />
                ) : (
                  <View style={[styles.menuThumb, styles.emptyMenuThumb]}>
                    <Ionicons name="fast-food-outline" size={28} color="#adb5bd" />
                  </View>
                )}
                <View style={styles.menuInfo}>
                  <View>
                    <View style={styles.nameRow}>
                      <Text style={styles.menuName}>{menu.name}</Text>
                      {menu.recommend && <View style={styles.recBadge}><Text style={styles.recText}>추천</Text></View>}
                    </View>
                    <Text style={styles.menuDesc} numberOfLines={2}>{menu.description || '주문 즉시 조리되어 신선합니다.'}</Text>
                  </View>
                  <Text style={styles.menuPrice}>{menu.price.toLocaleString()}원</Text>
                </View>
              </View>
            ))
          )}

          {!loading && menus.length === 0 && (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>현재 준비 중인 메뉴가 없습니다.</Text>
            </View>
          )}
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>

      {/* 🔘 하단 고정 버튼 (구색용) */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { 
    height: 60, paddingHorizontal: 20, flexDirection: 'row', 
    alignItems: 'center', justifyContent: 'space-between', 
    backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#f2f2f2' 
  },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#000' },

  resCover: { width: '100%', height: 280, position: 'relative' },
  coverImg: { width: '100%', height: '100%' },
  emptyCoverImg: { backgroundColor: '#f8f9fa', alignItems: 'center', justifyContent: 'center' },
  coverOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', padding: 25, justifyContent: 'flex-end' },
  tagRow: { flexDirection: 'row', marginBottom: 10 },
  cuisineBadge: { backgroundColor: '#FFD700', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginRight: 8 },
  cuisineText: { fontSize: 11, fontWeight: 'bold', color: '#000' },
  floorBadge: { backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  floorText: { fontSize: 11, fontWeight: 'bold', color: '#333' },
  resIntro: { fontSize: 15, color: '#fff', fontWeight: '500', lineHeight: 22 },

  menuSection: { padding: 25 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: '#111' },
  sectionSub: { fontSize: 13, color: '#999' },

  menuItem: { flexDirection: 'row', marginBottom: 25, borderBottomWidth: 1, borderColor: '#f9f9f9', paddingBottom: 20 },
  menuThumb: { width: 90, height: 90, borderRadius: 15 },
  emptyMenuThumb: { width: 90, height: 90, borderRadius: 15, backgroundColor: '#f8f9fa', alignItems: 'center', justifyContent: 'center' },
  menuInfo: { flex: 1, marginLeft: 15, justifyContent: 'space-between' },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  menuName: { fontSize: 16, fontWeight: 'bold', color: '#111', marginRight: 8 },
  recBadge: { backgroundColor: '#F0F7FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  recText: { fontSize: 10, color: '#007AFF', fontWeight: 'bold' },
  menuDesc: { fontSize: 13, color: '#888', lineHeight: 18 },
  menuPrice: { fontSize: 16, fontWeight: '900', color: '#000' },

  emptyBox: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#999', fontSize: 14 },

});

export default RestaurantMenuScreen;
