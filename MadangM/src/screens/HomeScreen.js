import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Animated, useWindowDimensions, Platform, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import productApi from '../api/productapi';
import { BASE_URL, IMAGE_BASE_URL } from '../api/config';

const HomeScreen = ({ navigation }) => {
  const { width: windowWidth } = useWindowDimensions();
  const [products, setProducts] = useState([]);
  const [pickProducts, setPickProducts] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [dbCategories, setDbCategories] = useState([]);
  const iconMap = {
    '패션': 'shirt-outline',
    '의류': 'shirt-outline',
    '뷰티': 'sparkles-outline',
    '화장품': 'sparkles-outline',
    '식품': 'leaf-outline',
    '신선': 'leaf-outline',
    '가전': 'tv-outline',
    '디지털': 'tv-outline',
    '스포츠': 'football-outline',
    '레저': 'football-outline',
    '라이프': 'home-outline',
    '키즈': 'happy-outline',
    '베이비': 'happy-outline',
    '층별': 'map-outline',
    '안내': 'map-outline',
    '매장': 'storefront-outline',
    '브랜드': 'pricetag-outline',
  };

  const fetchData = async () => {
    try {
      const [productRes, promoData, catData] = await Promise.all([
        productApi.searchProducts('', 'keyword').catch(() => ({ products: [] })),
        productApi.promotion.getPromotions().catch(() => []),
        productApi.category.getCategories(false).catch(() => [])
      ]);
      setPromotions(Array.isArray(promoData) ? promoData : []);
      
      const productData = productRes.products || (Array.isArray(productRes) ? productRes : []);
      if (Array.isArray(productData)) {
        // 🆕 1. 신상품 (최신순 정렬)
        const sortedNew = [...productData].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setProducts(sortedNew); // 기존 products는 전체용으로 유지하거나 신상품용으로 활용
        
        // ✨ 2. 마당M PICK (추천 상품 - 무작위 또는 특정 로직)
        const sortedPick = [...productData].filter(p => p.base_price > 50000 || p.price > 50000); 
        setPickProducts(sortedPick.length > 0 ? sortedPick : productData);
      }
      
      // 🏷️ 카테고리 로직 복구
      const categoriesArray = Array.isArray(catData) ? catData : (catData.data || []);
      if (categoriesArray.length > 0) {
        const topCats = categoriesArray
          .filter(c => c && (c.level === 1 || c.level === '1'))
          .map(c => {
            const catName = String(c.name || '');
            const iconKey = Object.keys(iconMap).find(k => catName.includes(k));
            return {
              id: c._id ? String(c._id) : Math.random().toString(),
              title: catName || '미분류',
              icon: iconKey ? iconMap[iconKey] : 'grid-outline'
            };
          });
        setDbCategories(topCats);
      }
    } catch (error) {
      console.error("Home Data Fetch Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const getFullUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const cleanUrl = url.replace(/^\/+/, '');
    if (cleanUrl.startsWith('uploads/')) return `${IMAGE_BASE_URL}/${cleanUrl}`;
    return `${IMAGE_BASE_URL}/uploads/${cleanUrl}`;
  };

  const renderRating = (rating, count) => (
    <View style={styles.homeRatingRow}>
      <Ionicons name="star" size={10} color="#ffc107" />
      <Text style={styles.homeRatingText}> {rating > 0 ? rating : '0.0'}</Text>
      <Text style={styles.homeReviewCount}>({(count || 0).toLocaleString()})</Text>
    </View>
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={{ marginTop: 15, color: '#666', fontWeight: 'bold' }}>MadangM</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { height: windowWidth * 0.15 }]}>
        <TouchableOpacity>
          <Ionicons name="menu-outline" size={windowWidth * 0.07} color="#000" />
        </TouchableOpacity>
        <Text style={[styles.logoText, styles.logoTextCentered, { fontSize: windowWidth * 0.05 }]}>
          MadangM
        </Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={() => navigation.navigate('Search')}>
            <Ionicons name="search-outline" size={windowWidth * 0.06} color="#000" />
          </TouchableOpacity>
          <View style={{ marginLeft: 15 }}>
            <TouchableOpacity onPress={() => {}}>
              <Ionicons name="notifications-outline" size={windowWidth * 0.06} color="#000" />
              <View style={styles.dot} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={{ height: windowWidth * 0.7 }}>
          {promotions.length > 0 ? (
            promotions.map((promo, index) => (
              <View key={promo._id || index} style={[styles.banner, { width: windowWidth, height: windowWidth * 0.7 }]}>
                <Image 
                    source={{ uri: getFullUrl(promo.bannerUrl) }} 
                    style={styles.bannerBgImg} 
                    resizeMode="cover"
                />
                <View style={[styles.bannerOverlay, { padding: windowWidth * 0.08 }]}>
                  <Text style={[styles.bannerTitle, { fontSize: windowWidth * 0.08, lineHeight: windowWidth * 0.09 }]}>{promo.title}</Text>
                  <Text style={[styles.bannerSub, { fontSize: windowWidth * 0.035 }]} numberOfLines={1}>{promo.description}</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={[styles.banner, { width: windowWidth, height: windowWidth * 0.7, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ color: '#999' }}>등록된 프로모션이 없습니다.</Text>
            </View>
          )}
        </ScrollView>

        <View style={[styles.categoryGrid, { paddingHorizontal: windowWidth * 0.03 }]}>
          {dbCategories.map((cat, index) => (
            <TouchableOpacity 
              key={cat.id || `cat-${index}`} 
              style={styles.categoryItem} 
              onPress={() => navigation.navigate('카테고리탭', { 
                screen: 'CategoryScreen', 
                params: { initialCategoryId: cat.id } 
              })}
            >
              <View style={[styles.categoryIcon, { width: windowWidth * 0.12, height: windowWidth * 0.12, borderRadius: windowWidth * 0.04 }]}>
                <Ionicons name={cat.icon || 'grid-outline'} size={windowWidth * 0.06} color="#333" />
              </View>
              <Text style={[styles.categoryText, { fontSize: windowWidth * 0.028 }]} numberOfLines={1}>{cat.title}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity 
            style={styles.categoryItem} 
            onPress={() => navigation.navigate('Dining')}
          >
            <View style={[styles.categoryIcon, { width: windowWidth * 0.12, height: windowWidth * 0.12, borderRadius: windowWidth * 0.04 }]}>
              <Ionicons name="restaurant-outline" size={windowWidth * 0.06} color="#333" />
            </View>
            <Text style={[styles.categoryText, { fontSize: windowWidth * 0.028 }]}>다이닝</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.categoryItem} 
            onPress={() => navigation.navigate('QrScan')}
          >
            <View style={[styles.categoryIcon, { width: windowWidth * 0.12, height: windowWidth * 0.12, borderRadius: windowWidth * 0.04 }]}>
              <Ionicons name="qr-code-outline" size={windowWidth * 0.06} color="#333" />
            </View>
            <Text style={[styles.categoryText, { fontSize: windowWidth * 0.028 }]}>QR코드</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />
        
        <View style={[styles.sectionHeader, { paddingHorizontal: windowWidth * 0.05 }]}>
          <Text style={[styles.sectionTitle, { fontSize: windowWidth * 0.045 }]}>MadangM PICK</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: windowWidth * 0.05 }}>
          {products.map((p) => (
            <TouchableOpacity 
              key={p._id} 
              style={[styles.productCard, { width: windowWidth * 0.4 }]}
              onPress={() => navigation.navigate('ProductDetail', { nfcId: p._id })}
            >
              <Image 
                source={{ uri: getFullUrl(p.images?.main || p.images?.gallery?.[0]) }} 
                style={[styles.productImg, { width: windowWidth * 0.4, height: windowWidth * 0.5 }]} 
              />
              <View style={styles.productInfo}>
                <Text style={[styles.productName, { fontSize: windowWidth * 0.035 }]} numberOfLines={2}>{p.name}</Text>
                {renderRating(p.averageRating, p.reviewCount)}
                <Text style={[styles.productPrice, { fontSize: windowWidth * 0.04 }]}>{(p.base_price || 0).toLocaleString()}원</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: '#f2f2f2' },
  logoText: { fontWeight: '900', color: '#000', letterSpacing: 1 },
  logoTextCentered: { position: 'absolute', left: 0, right: 0, textAlign: 'center' },
  headerIcons: { flexDirection: 'row', alignItems: 'center' },
  dot: { position: 'absolute', top: -1, right: -1, width: 7, height: 7, borderRadius: 4, backgroundColor: 'red' },
  bannerContainer: { },
  banner: { overflow: 'hidden' },
  bannerBgImg: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  bannerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end', paddingBottom: 50 },
  bannerTitle: { fontWeight: '900', color: '#fff' },
  bannerSub: { color: '#eee', marginTop: 10, fontWeight: '600' },
  categoryGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    paddingVertical: 15,
    justifyContent: 'flex-start' 
  },
  categoryItem: { 
    width: '20%', 
    alignItems: 'center', 
    marginBottom: 20,
  },
  categoryIcon: { 
    backgroundColor: '#f6f6f6', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryText: { 
    color: '#444', 
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
    paddingHorizontal: 2
  },
  divider: { height: 8, backgroundColor: '#f9f9f9', marginVertical: 10 },
  sectionHeader: { paddingHorizontal: 20, marginBottom: 15, marginTop: 10 },
  row: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#000', marginRight: 10 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF3B30', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  liveDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#fff', marginRight: 3 },
  liveText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
  eventCard: { width: 260, height: 140, borderRadius: 12, overflow: 'hidden', marginRight: 15, elevation: 2 },
  eventImg: { width: '100%', height: '100%' },
  eventOverlaySmall: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', padding: 12, justifyContent: 'flex-end' },
  eventTitle: { color: '#fff', fontSize: 16, fontWeight: '900' },
  productCard: { width: 160, marginRight: 15, marginBottom: 25 },
  productImg: { width: 160, height: 200, borderRadius: 10, backgroundColor: '#f9f9f9' },
  productImgWrapper: { position: 'relative' },
  rankBadge: { 
    position: 'absolute', 
    top: -10, 
    left: -10, 
    backgroundColor: '#000', 
    width: 35, 
    height: 35, 
    borderRadius: 8, 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  rankText: { color: '#fff', fontSize: 20, fontWeight: '900', fontStyle: 'italic' },
  productInfo: { marginTop: 12 },
  productName: { fontSize: 14, color: '#333', height: 40 },
  productPrice: { fontSize: 16, fontWeight: '900', color: '#000', marginTop: 4 },
  homeRatingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 2 },
  homeRatingText: { fontSize: 10, color: '#ffc107', fontWeight: 'bold' },
  homeReviewCount: { fontSize: 9, color: '#bbb', marginLeft: 2 },
});

export default HomeScreen;
