import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, Alert, useWindowDimensions } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import productApi from '../api/productapi';
import { IMAGE_BASE_URL } from '../api/config';
import { useAuth } from '../context/AuthContext';

const WishlistScreen = () => {
  const { width: windowWidth } = useWindowDimensions();
  const navigation = useNavigation();
  const { isLoggedIn } = useAuth();
  
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWishlist = async (showRefIndicator = false) => {
    if (!isLoggedIn) {
      setWishlistItems([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    
    try {
      if (!showRefIndicator) setLoading(true);
      const res = await productApi.wishlist.getWishlist();
      if (res && res.success) {
        setWishlistItems(res.wishlist || []);
      }
    } catch (error) {
      console.error("Fetch wishlist error:", error);
      Alert.alert("에러", "찜목록을 불러오는 데 실패했습니다.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchWishlist();
    }, [isLoggedIn])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchWishlist(true);
  };

  const handleRemove = async (productId) => {
    try {
      const res = await productApi.wishlist.removeFromWishlist(productId);
      if (res && res.success) {
        setWishlistItems(prev => prev.filter(item => item._id !== productId));
        Alert.alert("알림", "찜목록에서 제외되었습니다. 🤍");
      }
    } catch (error) {
      console.error("Remove from wishlist error:", error);
      Alert.alert("에러", "찜목록 수정에 실패했습니다.");
    }
  };

  const handleAddToCartQuick = async (item) => {
    try {
      const productId = item._id?.toString() || item.id?.toString();
      if (!productId) return Alert.alert('오류', '상품 아이디를 찾을 수 없습니다.');

      // B형 변동제 상품 자동선택 로직 지원
      let sku = undefined;
      let finalPrice = item.base_price || 0;

      if (item.display_template === 'B' && item.variants && item.variants.length > 0) {
        const available = item.variants.find(v => v.stock_quantity > 0);
        if (!available) return Alert.alert('품절', '현재 구매 가능한 옵션이 없습니다. 😢');
        sku = available.sku;
        finalPrice = available.price || available.sale_price;
      }

      const itemData = {
        productId,
        sku,
        name: item.name,
        price: finalPrice,
        image: item.images?.main || '',
        quantity: 1
      };

      await productApi.cart.addToCart(itemData);
      Alert.alert('성공', `${item.name} 상품을 장바구니에 담았습니다! 🛒`);
    } catch (error) {
      console.warn("Quick Add Error:", error.message);
      const msg = error?.response?.data?.message || "장바구니 담기에 실패했습니다.";
      Alert.alert("알림", msg);
    }
  };

  const getProductImage = (item) => {
    const imgPath = item.images?.main || (item.images?.gallery?.[0]);
    if (!imgPath) return null;
    if (imgPath.startsWith('http')) return { uri: imgPath };
    const cleanPath = imgPath.startsWith('/') ? imgPath : `/uploads/${imgPath}`;
    return { uri: `${IMAGE_BASE_URL}${cleanPath}` };
  };

  const renderWishItem = ({ item }) => {
    const imgSource = getProductImage(item);
    return (
      <TouchableOpacity
        style={styles.itemCard}
        onPress={() => navigation.navigate('ProductDetail', { nfcId: item._id })}
        activeOpacity={0.9}
      >
        <View style={styles.imgWrapper}>
          {imgSource ? (
            <Image source={imgSource} style={styles.itemImage} />
          ) : (
            <View style={[styles.itemImage, styles.emptyImage]}>
              <Ionicons name="image-outline" size={30} color="#ccc" />
            </View>
          )}
        </View>

        <View style={styles.infoWrapper}>
          <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.itemPrice}>{(item.base_price || 0).toLocaleString()}원</Text>
          
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={styles.cartBtn} 
              onPress={() => handleAddToCartQuick(item)}
            >
              <Ionicons name="cart-outline" size={16} color="#007AFF" style={{ marginRight: 5 }} />
              <Text style={styles.cartBtnText}>담기</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.removeBtn} 
              onPress={() => handleRemove(item._id)}
            >
              <Ionicons name="trash-outline" size={16} color="#FF3B30" style={{ marginRight: 5 }} />
              <Text style={styles.removeBtnText}>삭제</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (!isLoggedIn) {
    return (
      <View style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={28} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>찜목록</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.centerContainer}>
          <Ionicons name="heart-dislike-outline" size={80} color="#eee" />
          <Text style={styles.emptyText}>로그인이 필요한 서비스입니다.</Text>
          <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginBtnText}>로그인 하러 가기</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>찜목록</Text>
        <View style={{ width: 28 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : (
        <FlatList
          data={wishlistItems}
          renderItem={renderWishItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Ionicons name="heart-outline" size={80} color="#eee" />
              <Text style={styles.emptyText}>찜한 상품이 없습니다.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    height: 56,
    borderBottomWidth: 1,
    borderColor: '#f2f2f2',
  },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111' },
  listContainer: { padding: 15, paddingBottom: 50 },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#f2f2f2',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  imgWrapper: { position: 'relative' },
  itemImage: { width: 100, height: 100, borderRadius: 12, backgroundColor: '#f9f9f9' },
  emptyImage: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  infoWrapper: { flex: 1, marginLeft: 15, justifyContent: 'space-between' },
  itemName: { fontSize: 15, color: '#333', fontWeight: '600', lineHeight: 20 },
  itemPrice: { fontSize: 16, fontWeight: 'bold', color: '#000', marginTop: 4 },
  actionRow: { flexDirection: 'row', marginTop: 8 },
  cartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f4ff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 10,
  },
  cartBtnText: { color: '#007AFF', fontSize: 12, fontWeight: 'bold' },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  removeBtnText: { color: '#FF3B30', fontSize: 12, fontWeight: 'bold' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  emptyText: { marginTop: 15, color: '#999', fontSize: 15, fontWeight: '500' },
  loginBtn: { backgroundColor: '#000', paddingHorizontal: 25, paddingVertical: 12, borderRadius: 25, marginTop: 20 },
  loginBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 }
});

export default WishlistScreen;
