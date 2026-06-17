import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, useWindowDimensions, Linking, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import productApi from '../api/productapi';
import { BASE_URL, IMAGE_BASE_URL } from '../api/config';
import { ReviewSummary } from '../components/Product/ReviewSummary';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { isProductOutOfStock } from '../utils/productStock';

const ProductDetailScreen = ({ route, navigation }) => {
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { isLoggedIn } = useAuth();

  const { nfcId } = route.params || { nfcId: '698ade520c306efe4b5ae02b' };
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [activeTab, setActiveTab] = useState('DETAILS');
  const [isWishlisted, setIsWishlisted] = useState(false);

  const fetchAllData = React.useCallback(async () => {
    try {
      setLoading(true);
      const productData = await productApi.getProductDetail(nfcId);
      if (!productData || !productData._id) {
        throw new Error('Product not found');
      }
      setProduct(productData);
      // 기본 옵션: 재고 있는 옵션 우선 선택
      if (productData.variants && productData.variants.length > 0) {
        const inStock = productData.variants.find((v) => (v.stock_quantity || 0) > 0);
        setSelectedVariant(inStock || productData.variants[0]);
      } else {
        setSelectedVariant(null);
      }
      const reviewData = await productApi.getProductReviews(productData._id.toString());
      setReviews(reviewData);

      // Check if wishlisted
      if (isLoggedIn) {
        try {
          const wishRes = await productApi.wishlist.getWishlist();
          if (wishRes && wishRes.success) {
            const hasItem = wishRes.wishlist.some(item => 
              (item._id?.toString() === nfcId) || (item._id?.toString() === productData._id?.toString())
            );
            setIsWishlisted(hasItem);
          }
        } catch (wishErr) {
          console.warn("Wishlist fetch error in detail:", wishErr);
        }
      }
    } catch (error) {
      console.error("Data Fetch Error:", error);
      Alert.alert("알림", "없는 상품입니다.", [
        { text: "확인", onPress: () => navigation.navigate('RootTabs', { screen: '홈탭' }) }
      ]);
    } finally {
      setLoading(false);
    }
  }, [nfcId, navigation, isLoggedIn]);

  // 🔄 화면이 포커스를 받을 때마다 데이터 최신화 (리뷰 작성 후 돌아올 때 등)
  useFocusEffect(
    React.useCallback(() => {
      fetchAllData();
    }, [fetchAllData])
  );

  if (loading || !product) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#000" /></View>;
  }

  // 📸 이미지 URL 보정 (플레이스홀더 제거)
  const getFullUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path : `/uploads/${path}`;
    return `${IMAGE_BASE_URL}${cleanPath}`;
  };

  // 이미지 렌더링 블록 (이미지가 없을 경우 렌더링 생략)
  // 메인 이미지
  const renderMainImage = () => {
    const uri = getFullUrl(product.images?.main);
    if (!uri) return null;
    return <Image source={{ uri }} style={{ width: windowWidth, height: windowWidth, backgroundColor: '#f9f9f9' }} />;
  };

  // 갤러리 이미지
  const renderGallery = () => {
    return (product.images?.gallery || []).map((img, i) => {
      const uri = getFullUrl(img);
      if (!uri) return null;
      return <Image key={i} source={{ uri }} style={{ width: windowWidth, height: windowWidth, backgroundColor: '#f9f9f9' }} />;
    });
  };

  const isOutOfStock = isProductOutOfStock(product, selectedVariant?.sku);

  const renderVariants = () => (
    <View>
      {(product.variants || []).map((v, i) => {
        const variantSoldOut = (v.stock_quantity || 0) <= 0;
        return (
        <TouchableOpacity
          key={v._id || i}
          style={[
            styles.variantBtn,
            selectedVariant?._id === v._id && styles.activeVariant,
            variantSoldOut && styles.variantBtnSoldOut,
          ]}
          onPress={() => setSelectedVariant(v)}
          disabled={variantSoldOut}
        >
          <View style={styles.variantInfo}>
            <Text style={[styles.variantNum, selectedVariant?._id === v._id && { color: '#fff' }]}>
              {v.name || v.sku || ''}
            </Text>

            {/* 💸 추가 금액 계산 로직 (기본가와의 차액 표시) */}
            <Text style={[styles.variantPrice, selectedVariant?._id === v._id && { color: '#fff' }]}>
              {(() => {
                const diff = (v.sale_price || v.price || 0) - (product.base_price || 0);
                if (diff === 0) return '(추가 금액 없음)';
                return `${diff > 0 ? '+' : ''}${diff.toLocaleString()}원`;
              })()}
              {variantSoldOut ? ' · 품절' : ''}
            </Text>
          </View>
          <Ionicons name={selectedVariant?._id === v._id ? "radio-button-on" : "radio-button-off"} size={20} color={selectedVariant?._id === v._id ? "#fff" : "#ccc"} />
        </TouchableOpacity>
      );
      })}
    </View>
  );

  const renderDescription = () => (
    <View>
      {/* 1. 블록형 데이터가 있는 경우 */}
      {product.description_blocks && product.description_blocks.length > 0 ? (
        product.description_blocks.map((block, i) => {
          if (block.type === 'TEXT') return <Text key={i} style={styles.descText}>{block.content}</Text>;
          if (block.type === 'IMAGE') return <Image key={i} source={{ uri: getFullUrl(block.content) }} style={[styles.descImg, { width: windowWidth - 50 }]} resizeMode="contain" />;
          if (block.type === 'VIDEO') {
            const getYoutubeId = (url) => {
              const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
              const match = url.match(regExp);
              return (match && match[2].length === 11) ? match[2] : null;
            };
            const videoId = getYoutubeId(block.content);
            return (
              <TouchableOpacity key={i} style={styles.videoBtn} onPress={() => Linking.openURL(block.content)}>
                <Image source={videoId ? { uri: `https://img.youtube.com/vi/${videoId}/0.jpg` } : null} style={[styles.videoThumb, { width: windowWidth - 50, backgroundColor: '#fff' }]} />
                <View style={styles.videoOverlay}><Ionicons name="play-circle" size={50} color="#fff" /></View>
                <Text style={styles.videoLinkText}>🎥 영상 상세 보기 (클릭)</Text>
              </TouchableOpacity>
            );
          }
          return null;
        })
      ) : (
        /* 2. 일반 텍스트 설명만 있는 경우 (Fallback) */
        <Text style={styles.descText}>{product.description || '상세 정보가 없습니다.'}</Text>
      )}
    </View>
  );

  /** 🛒 장바구니 담기 실행 */
  const handleAddToCart = async () => {
    if (isOutOfStock) return;
    try {
      if (!product) return;

      const productId = product._id?.toString() || product.id?.toString();
      if (!productId) throw new Error('Product ID missing');

      const itemData = {
        productId,
        sku: selectedVariant?.sku,
        name: product.name,
        price: selectedVariant?.price || selectedVariant?.sale_price || product.base_price,
        image: product.images?.main || (product.images?.gallery?.[0]) || '',
        quantity: 1
      };

      await productApi.cart.addToCart(itemData);

      setTimeout(() => {
        Alert.alert(
          '장바구니 담기 성공 🛒',
          `${product.name} 상품이 담겼습니다.`,
          [
            { text: '쇼핑 계속하기', style: 'cancel' },
            { text: '장바구니로 이동', onPress: () => navigation.navigate('RootTabs', { screen: '장바구니탭' }) }
          ]
        );
      }, 100);
    } catch (error) {
      console.warn("Cart Add Info:", error.message);
      const msg = error?.response?.data?.message || '장바구니 담기에 실패했습니다.';
      Alert.alert('알림', msg);
    }
  };

  /** ❤️ 찜하기 버튼 토글 */
  const handleToggleWishlist = async () => {
    if (!isLoggedIn) {
      Alert.alert(
        "로그인 필요",
        "찜하기 기능을 사용하려면 로그인이 필요합니다. 로그인 화면으로 이동하시겠습니까?",
        [
          { text: "취소", style: "cancel" },
          { text: "이동", onPress: () => navigation.navigate("Login") }
        ]
      );
      return;
    }

    try {
      const prodId = product._id?.toString();
      if (isWishlisted) {
        await productApi.wishlist.removeFromWishlist(prodId);
        setIsWishlisted(false);
        Alert.alert("알림", "찜목록에서 제외되었습니다. 🤍");
      } else {
        await productApi.wishlist.addToWishlist(prodId);
        setIsWishlisted(true);
        Alert.alert("알림", "찜목록에 담겼습니다. ❤️");
      }
    } catch (error) {
      console.error("Wishlist toggle error:", error);
      Alert.alert("에러", "찜하기 처리 중 오류가 발생했습니다.");
    }
  };

  return (
    <View style={styles.container}>
      {/* 🔝 상단 프리미엄 헤더 (글로벌 레이아웃 적용됨) */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('RootTabs', { screen: '홈탭' });
            }
          }}
          style={styles.headerBackBtn}
        >
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            const targetStoreId = product?.storeId?._id?.toString?.();
            const targetFloor = product?.storeId?.floor;
            if (!targetStoreId || targetFloor === undefined || targetFloor === null) {
              Alert.alert('안내', '해당 상품의 매장 위치 정보를 찾을 수 없습니다.');
              return;
            }
            navigation.navigate('RootTabs', {
              screen: '맵탭',
              params: { targetStoreId, targetFloor: String(targetFloor) },
            });
          }}
          style={styles.headerHomeBtn}
        >
          <Ionicons name="map-outline" size={24} color="#000" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            navigation.navigate('RootTabs', {
              screen: '홈탭',
              params: { screen: 'HomeScreen' },
            })
          }
          style={styles.headerHomeBtn}
        >
          <Ionicons name="home-outline" size={26} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* 🎬 메인 이미지 슬라이더 (반응형: 정정사각형 비율) */}
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={{ height: windowWidth }}>
          {renderMainImage()}
          {renderGallery()}

        </ScrollView>

        <View style={[styles.infoBox, { padding: windowWidth * 0.06 }]}>
          <Text style={styles.badge}>PREMIUM</Text>
          <Text style={styles.title}>{product.name}</Text>
          <Text style={styles.price}>{(selectedVariant?.price || selectedVariant?.sale_price || product.base_price || 0).toLocaleString()}원</Text>
          <View style={styles.metaInfo}>
            <Text style={styles.subText}>
              ⭐ {reviews.length > 0
                ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
                : "0.0"}
              (후기 {reviews.length}건)
            </Text>
            <View style={[styles.stockBadge, isOutOfStock && { backgroundColor: '#FFEBEE' }]}>
              <Text style={[styles.stockText, isOutOfStock && { color: '#C62828' }]}>
                {isOutOfStock ? '품절' : '재고 있음'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* 📦 옵션 영역 (데이터 유무와 상관없이 섹션 제목은 표시하여 확인) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>상품 옵션</Text>
          {product.variants && product.variants.length > 0 ? renderVariants() : (
            <Text style={styles.emptyText}>선택 가능한 옵션이 없습니다.</Text>
          )}
        </View>

        <View style={styles.divider} />

        {/* 🗂️ 상품 디테일 탭 바 (옵션 아래, 상세 정보 위) */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'DETAILS' && styles.activeTabButton]}
            onPress={() => setActiveTab('DETAILS')}
          >
            <Text style={[styles.tabText, activeTab === 'DETAILS' && styles.activeTabText]}>상세 정보</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'REVIEWS' && styles.activeTabButton]}
            onPress={() => setActiveTab('REVIEWS')}
          >
            <Text style={[styles.tabText, activeTab === 'REVIEWS' && styles.activeTabText]}>리뷰 ({reviews.length})</Text>
          </TouchableOpacity>
          
          {product.product_notices && product.product_notices.length > 0 ? (
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'NOTICES' && styles.activeTabButton]}
              onPress={() => setActiveTab('NOTICES')}
            >
              <Text style={[styles.tabText, activeTab === 'NOTICES' && styles.activeTabText]}>상세 고시</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* 📖 상세 정보 탭 콘텐츠 */}
        {activeTab === 'DETAILS' && (
          <View style={styles.section}>
            {renderDescription()}
          </View>
        )}

        {/* 📁 품목별 상세 고시 탭 콘텐츠 */}
        {activeTab === 'NOTICES' && product.product_notices && product.product_notices.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>품목별 상세 고시 정보</Text>
            <View style={styles.noticeContainer}>
              {product.product_notices.map((notice, idx) => (
                <View key={idx} style={[styles.noticeRow, idx === product.product_notices.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={styles.noticeLabelCol}>
                    <Text style={styles.noticeLabelText}>{notice.label}</Text>
                  </View>
                  <View style={styles.noticeValueCol}>
                    <Text style={styles.noticeValueText}>{notice.value || '-'}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 💬 리뷰 요약 탭 콘텐츠 */}
        {activeTab === 'REVIEWS' && (
          <ReviewSummary
            reviews={reviews}
            onWriteReview={() => navigation.navigate('WriteReview', {
              productId: product._id.toString(),
              productName: product.name
            })}
          />
        )}
      </ScrollView>

      {/* 🛒 하단 바 (글로벌 레이아웃 적용됨) */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.wishBtn} onPress={handleToggleWishlist}>
          <Ionicons 
            name={isWishlisted ? "heart" : "heart-outline"} 
            size={24} 
            color={isWishlisted ? "#FF3B30" : "#000"} 
          />
        </TouchableOpacity>
        {isOutOfStock ? (
          <View style={styles.soldOutBtn}>
            <Text style={styles.soldOutBtnText}>품절</Text>
          </View>
        ) : (
          <>
            <TouchableOpacity style={styles.cartBtn} onPress={handleAddToCart}>
              <Text style={styles.cartText}>담기</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.buyBtn}
              onPress={() => {
                const buyItem = {
                  productId: product._id?.toString() || product.id?.toString(),
                  name: product.name,
                  price: selectedVariant?.sale_price || selectedVariant?.price || product.base_price || 0,
                  image: product.images?.main || (product.images?.gallery?.[0]) || '',
                  qty: 1,
                  quantity: 1,
                  sku: selectedVariant?.sku || '',
                };
                navigation.navigate('Checkout', { items: [buyItem], total: buyItem.price });
              }}
            >
              <Text style={styles.buyText}>지금 구매</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#f2f2f2',
    backgroundColor: '#fff',
    height: 50,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 3,
    borderColor: 'transparent',
  },
  activeTabButton: {
    borderColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#8b95a1',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '900',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderBottomWidth: 1,
    borderColor: '#f2f2f2',
    zIndex: 10
  },
  headerBackBtn: { padding: 5 },
  headerHomeBtn: { padding: 5 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hero: { height: 400 },
  heroImg: { backgroundColor: '#f9f9f9' },
  infoBox: { padding: 25 },
  badge: { color: '#FF3B30', fontWeight: '900', fontSize: 10, letterSpacing: 1.5, marginBottom: 10 },
  title: { fontSize: 24, fontWeight: '900', color: '#111', marginBottom: 12 },
  price: { fontSize: 28, fontWeight: '900', color: '#007AFF', marginBottom: 15 },
  metaInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  subText: { fontSize: 13, color: '#999', fontWeight: 'bold' },
  stockBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  stockText: { fontSize: 11, color: '#2E7D32', fontWeight: 'bold' },
  divider: { height: 10, backgroundColor: '#fdfdfd', marginVertical: 10 },
  section: { padding: 25 },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: '#000', marginBottom: 20 },
  emptyText: { color: '#bbb', fontSize: 13, fontStyle: 'italic', paddingVertical: 10 },

  variantBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9f9f9', padding: 18, borderRadius: 15, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
  activeVariant: { backgroundColor: '#000', borderColor: '#000' },
  variantInfo: { flex: 1 },
  variantNum: { fontSize: 14, color: '#333', fontWeight: 'bold' },
  variantOptions: { fontSize: 12, color: '#666', marginTop: 2, marginBottom: 2 },
  variantPrice: { fontSize: 13, color: '#888', marginTop: 4 },

  descText: { fontSize: 15, color: '#333', lineHeight: 26, marginBottom: 20 },
  descImg: { height: 400, borderRadius: 15, marginBottom: 30, backgroundColor: '#f9f9f9' },
  videoBtn: { position: 'relative', marginBottom: 30 },
  videoThumb: { height: 200, borderRadius: 15, opacity: 0.8, backgroundColor: '#000' },
  videoOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  videoLinkText: { textAlign: 'center', marginTop: 10, color: '#FF3B30', fontWeight: 'bold', fontSize: 13 },

  noticeContainer: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fafafa'
  },
  noticeRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#eee',
    alignItems: 'center'
  },
  noticeLabelCol: {
    width: '35%',
    padding: 12,
    backgroundColor: '#f1f3f5',
    borderRightWidth: 1,
    borderColor: '#eee'
  },
  noticeLabelText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#495057'
  },
  noticeValueCol: {
    width: '65%',
    padding: 12,
    backgroundColor: '#fff'
  },
  noticeValueText: {
    fontSize: 12,
    color: '#343a40',
    lineHeight: 18
  },

  bottomBar: {
    flexDirection: 'row',
    padding: 20,
    height: 80,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#f2f2f2',
    alignItems: 'center'
  },
  wishBtn: { padding: 10, marginRight: 10 },
  cartBtn: { flex: 1, height: 52, backgroundColor: '#f6f6f6', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  cartText: { color: '#000', fontWeight: 'bold' },
  buyBtn: { flex: 2, height: 52, backgroundColor: '#000', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  buyText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  variantBtnSoldOut: { opacity: 0.5 },
  soldOutBtn: {
    flex: 1,
    height: 52,
    backgroundColor: '#e9ecef',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldOutBtnText: { color: '#868e96', fontWeight: 'bold', fontSize: 16 },
});

export default ProductDetailScreen;
