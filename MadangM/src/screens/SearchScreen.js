import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ScrollView, Keyboard, Image, Alert, ActivityIndicator, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import productApi from '../api/productapi';
import { BASE_URL, IMAGE_BASE_URL } from '../api/config'; // 📡 서버 주소 임포트
import Ionicons from 'react-native-vector-icons/Ionicons';

const popularKeywords = ["계란", "딸기", "사과", "한우", "라면", "생수"];
const popularTags = ["#자취생필수템", "#홈파티세트", "#다이어트식단", "#캠핑음식", "#아이간식", "#가성비갑"];

const SearchScreen = () => {
  const { width: windowWidth } = useWindowDimensions();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('keyword'); // keyword, category, tag
  const [isSearched, setIsSearched] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const getFullUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const cleanUrl = url.replace(/^\/+/, '');
    if (cleanUrl.startsWith('uploads/')) return `${IMAGE_BASE_URL}/${cleanUrl}`;
    return `${IMAGE_BASE_URL}/uploads/${cleanUrl}`;
  };

  const route = useRoute();
  const navigation = useNavigation();

  const onSearch = async (text, type = 'keyword', categoryId = null) => {
    const cleanText = text.trim();
    if (!cleanText && type === 'keyword') return;

    setSearchQuery(cleanText);
    setSearchType(type);
    setIsSearched(true);
    setLoading(true);
    Keyboard.dismiss();

    try {
      const data = await productApi.searchProducts(cleanText, type, categoryId);
      const productsArray = data.products || (Array.isArray(data) ? data : []);
      setResults(productsArray);
    } catch (error) {
      console.error("Search Error:", error);
      Alert.alert("에러", "데이터를 불러오는 데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (route.params?.query) {
      onSearch(route.params.query, route.params.type || 'keyword', route.params.categoryId);
    }
  }, [route.params?.query, route.params?.type, route.params?.categoryId]);

  /** 📸 [수정] 이미지 URL 보전 로직 (content 사용) */
  const getProductImage = (item) => {
    const imgPath = item.images?.main || (item.images?.gallery?.[0]);
    if (!imgPath) return null;
    if (imgPath.startsWith('http')) return { uri: imgPath };
    const cleanPath = imgPath.startsWith('/') ? imgPath : `/uploads/${imgPath}`;
    return { uri: `${IMAGE_BASE_URL}${cleanPath}` };
  };

  const renderProduct = ({ item }) => {
    const handleAddToCartQuick = async (item) => {
      try {
        const productId = item._id?.toString() || item.id?.toString();
        if (!productId) return Alert.alert('오류', '상품 아이디를 찾을 수 없습니다.');

        // 🐟 [NEW] 변동제 상품(B)일 경우, 재고가 있는 첫 번째 번호 자동 선택!
        let sku = undefined;
        let finalPrice = item.base_price || 0;

        if (item.display_template === 'B' && item.variants && item.variants.length > 0) {
          const available = item.variants.find(v => v.stock_quantity > 0);
          if (!available) return Alert.alert('품절', '현재 구매 가능한 상품이 없습니다. 😢');
          sku = available.sku;
          finalPrice = available.price || available.sale_price;
        }

        const itemData = {
          productId,
          sku, // 👈 고유 SKU 동봉!
          name: item.name,
          price: finalPrice,
          image: item.images?.main || '',
          quantity: 1
        };

        await productApi.cart.addToCart(itemData);
        Alert.alert('성공', `${item.name} 상품을 담았습니다! 🛒`);
      } catch (error) {
        console.warn("Quick Add Info:", error.message);
        const msg = error?.response?.data?.message || "장바구니 담기에 실패했습니다.";
        Alert.alert("알림", msg);
      }
    };

    return (
      <TouchableOpacity
        style={styles.productRow}
        onPress={() => {
          navigation.navigate('ProductDetail', { nfcId: item._id });
        }}
        activeOpacity={0.9}
      >
        <View style={styles.imgWrapper}>
          {getProductImage(item) && (
            <Image
              source={getProductImage(item)}
              style={[styles.productImage, { width: windowWidth * 0.25, height: windowWidth * 0.25 }]}
            />
          )}
          {item.display_template === "B" && (
            <View style={styles.freshBadge}>
              <Text style={styles.freshBadgeText}>산지직송</Text>
            </View>
          )}
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.productPrice}>{(item.price || item.base_price || 0)?.toLocaleString()}원</Text>
            <View style={styles.rocketTag}>
              <Text style={styles.rocketTagText}>로켓배송</Text>
            </View>
          </View>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={12} color="#ffc107" />
            <Text style={styles.ratingStar}> {item.averageRating > 0 ? item.averageRating : '0.0'}</Text>
            <Text style={styles.reviewCount}>({(item.reviewCount || 0).toLocaleString()})</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.cartIconBtn}
          onPress={() => handleAddToCartQuick(item)}
        >
          <Ionicons name="cart-outline" size={24} color="#000" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* 🔍 2층: 검색 바 & 뒤로가기 영역 */}
      <View style={styles.searchHeaderArea}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>

        <View style={styles.searchBar}>
          <TouchableOpacity onPress={() => onSearch(searchQuery, 'keyword')}>
            <Ionicons name="search" size={18} color="#999" />
          </TouchableOpacity>

          {(searchType === 'category' || searchType === 'tag' || searchType === 'brand' || searchType === 'store') && searchQuery !== '' && (
            <View style={[styles.typeBadge, (searchType === 'tag' || searchType === 'brand' || searchType === 'store') && styles.tagBadgeStyle]}>
              <Text style={[styles.typeBadgeText, (searchType === 'tag' || searchType === 'brand' || searchType === 'store') && styles.tagBadgeTextStyle]}>
                {searchType === 'category' ? '카테고리' : searchType === 'brand' ? '브랜드' : searchType === 'store' ? '매장' : '태그'}: {searchQuery}
              </Text>
              <TouchableOpacity onPress={() => {
                setSearchType('keyword');
                setSearchQuery('');
                setIsSearched(false);
              }}>
                <Ionicons name="close-circle" size={16} color={searchType === 'category' ? "#2e7d32" : "#1976d2"} style={{ marginLeft: 5 }} />
              </TouchableOpacity>
            </View>
          )}

          <TextInput
            style={styles.input}
            placeholder={searchType === 'keyword' ? "어떤 상품을 찾으시나요?" : ""}
            value={searchType === 'keyword' ? searchQuery : ""}
            onChangeText={(text) => {
              setSearchType('keyword');
              setSearchQuery(text);
            }}
            onSubmitEditing={() => onSearch(searchQuery, 'keyword')}
            returnKeyType="search"
            placeholderTextColor="#999"
            blurOnSubmit={true}
            multiline={false}
          />
          {searchQuery.length > 0 && searchType === 'keyword' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#ccc" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.scrollBody}>
        {!isSearched ? (
          <ScrollView showsVerticalScrollIndicator={false} style={styles.popularSection}>
            <Text style={styles.sectionTitle}>추천 검색어</Text>
            <View style={styles.keywordGrid}>
              {popularKeywords.map((word, index) => (
                <TouchableOpacity key={index} style={styles.keywordItem} onPress={() => onSearch(word, 'keyword')}>
                  <Text style={styles.keywordText}>{word}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 25 }]}>인기 태그로 묶어보기</Text>
            <View style={styles.tagCloud}>
              {popularTags.map((tag, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.tagBundle}
                  onPress={() => onSearch(tag.replace('#', ''), 'tag')}
                >
                  <Text style={styles.tagBundleText}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        ) : (
          <FlatList
            data={results}
            renderItem={renderProduct}
            keyExtractor={item => item._id}
            ListHeaderComponent={<Text style={styles.resultCountText}>총 {results.length}개의 상품을 찾았습니다.</Text>}
            ListEmptyComponent={
              loading ? (
                <ActivityIndicator size="large" color="#000" style={{ marginTop: 50 }} />
              ) : (
                <View style={styles.emptyResult}>
                  <Ionicons name="search-outline" size={60} color="#eee" />
                  <Text style={styles.emptyText}>검색 결과가 없습니다.</Text>
                </View>
              )
            }
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingHorizontal: 25,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  logoText: { fontSize: 20, fontWeight: '900', color: '#000' },
  headerIcons: { flexDirection: 'row', alignItems: 'center' },
  dot: { position: 'absolute', top: 2, right: 0, width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#FF3B30', borderWidth: 1, borderColor: '#fff' },
  searchHeaderArea: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 15, paddingBottom: 15,
  },
  backBtn: { marginRight: 10 },
  homeBtn: { marginLeft: 15 },
  searchBar: { flex: 1, flexDirection: 'row', backgroundColor: '#f5f5f5', borderRadius: 25, alignItems: 'center', paddingHorizontal: 15, height: 45 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e8f5e9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 15, borderWidth: 1, borderColor: '#c8e6c9', marginRight: 5 },
  typeBadgeText: { fontSize: 11, color: '#2e7d32', fontWeight: 'bold' },
  tagBadgeStyle: { backgroundColor: '#e3f2fd', borderColor: '#bbdefb' },
  tagBadgeTextStyle: { color: '#1976d2' },
  input: { flex: 1, marginLeft: 10, fontSize: 13, color: '#333' },
  scrollBody: { flex: 1 },
  popularSection: { padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  keywordGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  keywordItem: { paddingHorizontal: 15, paddingVertical: 8, backgroundColor: '#f8f9fa', borderRadius: 20, marginRight: 10, marginBottom: 10 },
  keywordText: { fontSize: 13, color: '#555' },
  tagCloud: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 30 },
  tagBundle: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#e3f2fd', borderRadius: 6, marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: '#bbdefb' },
  tagBundleText: { fontSize: 13, color: '#1976d2', fontWeight: '600' },
  resultCountText: { padding: 15, fontSize: 13, color: '#999', backgroundColor: '#fafafa' },
  productRow: { flexDirection: 'row', padding: 15, borderBottomWidth: 1, borderColor: '#f5f5f5', alignItems: 'center', backgroundColor: '#fff' },
  imgWrapper: { position: 'relative' },
  productImage: { width: 90, height: 90, borderRadius: 12, backgroundColor: '#f9f9f9' },
  freshBadge: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', borderBottomLeftRadius: 12, borderBottomRightRadius: 12, paddingVertical: 2 },
  freshBadgeText: { color: '#fff', fontSize: 8, textAlign: 'center', fontWeight: 'bold' },
  textContainer: { flex: 1, marginLeft: 15 },
  productName: { fontSize: 15, color: '#333', lineHeight: 20, fontWeight: '500' },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  productPrice: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  rocketTag: { backgroundColor: '#FF3B30', paddingHorizontal: 4, borderRadius: 3, marginLeft: 6 },
  rocketTagText: { color: '#fff', fontSize: 8, fontWeight: 'bold' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  ratingStar: { fontSize: 12, color: '#ffc107', fontWeight: 'bold' },
  reviewCount: { fontSize: 11, color: '#bbb', marginLeft: 4 },
  cartIconBtn: { padding: 10 },
  emptyResult: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 10, color: '#999', fontSize: 15 }
});

export default SearchScreen;
