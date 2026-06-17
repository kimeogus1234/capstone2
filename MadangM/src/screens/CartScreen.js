import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image,
  LayoutAnimation, Platform, ActivityIndicator, Alert, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import productApi from '../api/productapi';
import { BASE_URL, IMAGE_BASE_URL } from '../api/config';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { isProductOutOfStock } from '../utils/productStock';

const CartScreen = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [poppedNudges, setPoppedNudges] = useState([]);
  const navigation = useNavigation();

  // 📈 실시간 쿠폰 퀘스트 추천 업데이트
  const getPurchasableItems = (items) =>
    (items || []).filter((item) => {
      const product = item.productId;
      return !(typeof product === 'object' && product !== null && isProductOutOfStock(product, item.variantSku));
    });

  const updateSuggestions = async (items) => {
    const purchasable = getPurchasableItems(items);
    if (!purchasable.length) {
      setSuggestions([]);
      return;
    }
    const mappedItems = purchasable.map(item => ({
      productId: item.productId?._id || item.productId,
      storeId: item.storeId,
      categoryId: item.categoryId || item.productId?.categoryId,
      price: item.price,
      quantity: item.quantity
    }));
    try {
      const sugData = await productApi.promotion.getSuggestions(mappedItems);
      let newSuggestions = sugData.suggestions || [];

      // 사용 완료 쿠폰은 장바구니 넛지에서 제외
      try {
        const couponRes = await productApi.coupon.getCoupons();
        if (couponRes?.success && Array.isArray(couponRes.data)) {
          const availableIds = new Set(couponRes.data.map((c) => String(c._id)));
          newSuggestions = newSuggestions.filter((s) => availableIds.has(String(s.rule_id)));
        }
      } catch (_) { /* 비로그인 등 */ }

      // 🏆 [게이미피케이션] 실시간 퀘스트 완료 감지 팝업 트리거
      if (suggestions.length > 0 && newSuggestions.length > 0) {
        newSuggestions.forEach(newSug => {
          const prevSug = suggestions.find(s => s.rule_id === newSug.rule_id);
          // 이전에는 미완료였는데, 이번에 완료 상태로 전환된 경우!
          if (prevSug && !prevSug.is_achieved && newSug.is_achieved) {
            Alert.alert(
              '🎉 퀘스트 달성 완료!',
              `축하합니다!\n\n"${newSug.title}" 혜택이 적용되었습니다!\n주문 시 보상 쿠폰이 자동 발급됩니다. 🎁`,
              [{ text: '신나게 쇼핑 계속하기', style: 'default' }]
            );
          }
        });
      }

      // 👖 [게이미피케이션] 특정 카테고리 적용 쿠폰 실시간 탐색 추천 팝업 (1회만 노출하여 피로감 방지)
      newSuggestions.forEach(newSug => {
        if (newSug.condition_type === 'CATEGORY_TOTAL' && !newSug.is_achieved && newSug.progress > 0) {
          if (!poppedNudges.includes(newSug.rule_id)) {
            setPoppedNudges(prev => [...prev, newSug.rule_id]);
            const discountDesc = newSug.discount_value
              ? `${newSug.discount_type === 'PERCENT' ? newSug.discount_value + '%' : newSug.discount_value.toLocaleString() + '원'} 추가 할인`
              : '특별 혜택';

            Alert.alert(
              '💡 스타일 코디 세트 제안!',
              `장바구니에 해당 카테고리 상품이 담겨있습니다!\n\n${newSug.remaining_amount.toLocaleString()}원 더 채우시면 [${discountDesc}] 혜택이 적용됩니다. 함께 완벽한 룩을 완성해볼까요? 👖👕`,
              [{ text: '추천 코디 구경하기', style: 'default' }]
            );
          }
        }
      });

      setSuggestions(newSuggestions);
    } catch (sugErr) {
      console.warn("Fetch suggestions error:", sugErr);
    }
  };

  // 📡 서버에서 장바구니 데이터 가져오기
  const fetchCartData = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);
      const data = await productApi.cart.getCart();
      const items = data.items || [];
      setCartItems(items);
      await updateSuggestions(items);
    } catch (error) {
      console.error("Fetch Cart Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 화면 포커스 시 데이터 동기화
  useFocusEffect(
    useCallback(() => {
      fetchCartData();
    }, [])
  );

  // 🔄 수량 조절 (서버와 동기화)
  const handleUpdateQuantity = async (productId, variantSku, currentQty, type, cartItem) => {
    const product = cartItem?.productId;
    if (typeof product === 'object' && product !== null && isProductOutOfStock(product, variantSku)) {
      return;
    }
    try {
      const nextQty = type === 'plus' ? currentQty + 1 : Math.max(1, currentQty - 1);
      if (nextQty === currentQty) return;

      const targetProductIdStr = productId?.toString() || '';
      const updated = cartItems.map(item => {
        const rawId = item.productId?._id || item.productId?.id || item.productId;
        const itemProdIdStr = rawId?.toString() || '';
        const matchId = itemProdIdStr === targetProductIdStr;
        const matchSku = item.variantSku === (variantSku || null);
        return (matchId && matchSku) ? { ...item, quantity: nextQty } : item;
      });

      setCartItems(updated);
      updateSuggestions(updated);

      await productApi.cart.updateItem(productId, nextQty, variantSku);
    } catch (error) {
      console.error("Update Qty Error:", error);
      fetchCartData(); // 오류 시 데이터 복구
    }
  };

  // ❌ 아이템 삭제
  const handleRemoveItem = async (item) => {
    console.log("🗑️ 삭제 시도 상품:", item.name, "ID:", item.productId, "Item DB ID:", item._id);

    Alert.alert(
      '삭제 확인',
      `'${item.name || item.productId?.name || '상품'}' 상품을 장바구니에서 삭제할까요?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제하기',
          style: 'destructive',
          onPress: async () => {
            try {
              // 1. UI 선반영
              const updated = cartItems.filter(p => p._id !== item._id);
              setCartItems(updated);
              updateSuggestions(updated);

              // 2. 서버 통신 (항목의 고유 ID인 item._id를 보냄)
              await productApi.cart.removeFromCart(item._id);
            } catch (error) {
              console.error("Delete Error:", error);
              Alert.alert('오류', '삭제 중 문제가 발생했습니다. 다시 시도해주세요.');
              fetchCartData(true);
            }
          }
        }
      ]
    );
  };

  const getFullUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const cleanPath = url.startsWith('/') ? url : `/uploads/${url}`;
    return `${IMAGE_BASE_URL}${cleanPath}`;
  };

  const renderItem = ({ item }) => {
    const product = item.productId;
    const productIdVal = product?._id || product?.id || item.productId;
    const productImage = product?.images?.main || (product?.images?.gallery?.[0]) || item.image || '';
    const soldOut = typeof product === 'object' && product !== null
      ? isProductOutOfStock(product, item.variantSku)
      : false;

    return (
      <View style={[styles.itemContainer, soldOut && styles.itemContainerSoldOut]}>
        <View style={styles.itemWrapper}>
          <TouchableOpacity
            style={{ flexDirection: 'row', flex: 1, alignItems: 'center' }}
            onPress={() => {
              if (productIdVal) {
                navigation.navigate('ProductDetail', { nfcId: productIdVal.toString() });
              }
            }}
            activeOpacity={0.7}
          >
            <View style={styles.imgWrap}>
              {getFullUrl(productImage) ? (
                <Image source={{ uri: getFullUrl(productImage) }} style={styles.img} />
              ) : (
                <View style={[styles.img, { backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee' }]} />
              )}
              {soldOut && (
                <View style={styles.soldOutOverlay}>
                  <Text style={styles.soldOutOverlayText}>품절</Text>
                </View>
              )}
            </View>
            <View style={styles.details}>
              <Text style={[styles.itemName, soldOut && styles.textSoldOut]} numberOfLines={1}>
                {product?.name || item.name || '알 수 없는 상품'}
              </Text>
              {item.variantSku && (
                <Text style={[styles.variantSkuText, soldOut && styles.textSoldOut]}>옵션: {item.variantSku}</Text>
              )}
              {soldOut ? (
                <Text style={styles.soldOutLabel}>품절된 상품입니다</Text>
              ) : (
                <Text style={styles.itemPrice}>{item.price?.toLocaleString()}원</Text>
              )}
            </View>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 10 }}>
            {soldOut ? (
              <TouchableOpacity
                style={styles.soldOutRemoveBtn}
                onPress={() => handleRemoveItem(item)}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              >
                <Text style={styles.soldOutRemoveText}>삭제</Text>
              </TouchableOpacity>
            ) : (
              <>
                <View style={styles.controller}>
                  <TouchableOpacity
                    onPress={() => handleUpdateQuantity(productIdVal, item.variantSku, item.quantity, 'minus', item)}
                    style={styles.ctrlBtn}
                  >
                    <Ionicons name="remove" size={16} color="#000" />
                  </TouchableOpacity>
                  <View style={styles.ctrlDisplay}>
                    <Text style={styles.ctrlText}>{item.quantity}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleUpdateQuantity(productIdVal, item.variantSku, item.quantity, 'plus', item)}
                    style={styles.ctrlBtn}
                  >
                    <Ionicons name="add" size={16} color="#000" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={{ marginLeft: 12, padding: 5 }}
                  onPress={() => handleRemoveItem(item)}
                  hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    );
  };

  const availableItems = getPurchasableItems(cartItems);

  const soldOutCount = cartItems.length - availableItems.length;

  const totalPrice = availableItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

  const handleOrder = () => {
    if (availableItems.length === 0) {
      return Alert.alert('알림', '주문 가능한 상품이 없습니다. 품절 상품을 삭제해 주세요.');
    }
    if (soldOutCount > 0) {
      return Alert.alert(
        '품절 상품 안내',
        `품절된 상품 ${soldOutCount}개는 제외하고 주문합니다.`,
        [
          { text: '취소', style: 'cancel' },
          {
            text: '주문하기',
            onPress: () => navigation.navigate('Checkout', { items: availableItems, total: totalPrice }),
          },
        ]
      );
    }
    navigation.navigate('Checkout', { items: availableItems, total: totalPrice });
  };

  if (loading && !refreshing) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#000" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>장바구니</Text>
      </View>

      <FlatList
        data={cartItems}
        renderItem={renderItem}
        keyExtractor={item => item._id}
        contentContainerStyle={{ padding: 15, paddingBottom: 150 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchCartData(true)} />
        }
        ListHeaderComponent={null}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cart-outline" size={80} color="#eee" />
            <Text style={styles.emptyText}>장바구니가 비어있습니다.</Text>
            <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.navigate('RootTabs', { screen: '홈탭' })}>
              <Text style={styles.shopBtnText}>쇼핑하러 가기</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {cartItems.length > 0 && (
        <View style={styles.footer}>
          {/* 🎁 실시간 장바구니 금액별 퀘스트 게이밍 넛지 배너 (하단 고정형으로 이동!) */}
          {suggestions.length > 0 && (
            <View style={{ marginBottom: 12 }}>
              {suggestions
                .filter(s => !s.is_achieved)
                .slice(0, 1)
                .map(sug => (
                  <View key={sug.rule_id} style={[styles.nudgeCard, { marginHorizontal: 0, padding: 15 }]}>
                    {sug.achieved_message && (
                      <View style={styles.achievedLabelContainer}>
                        <Text style={styles.achievedLabelText}>{sug.achieved_message}</Text>
                      </View>
                    )}
                    <View style={styles.nudgeHeaderRow}>
                      <View style={[styles.badgeContainer, sug.is_cross_store && styles.crossStoreBadgeContainer]}>
                        <Text style={[styles.nudgeBadge, sug.is_cross_store && styles.crossStoreBadge]}>
                          {sug.is_cross_store ? '🤝 상생 협력 퀘스트' : '🎯 오늘의 퀘스트'}
                        </Text>
                      </View>
                      <Text style={styles.remainingText}>
                        <Text style={{ fontWeight: '900', color: '#e03131' }}>
                          {sug.remaining_amount.toLocaleString()}원
                        </Text> 더 담으면{' '}
                        <Text style={{ fontWeight: '900', color: '#0984e3' }}>
                          {sug.discount_value
                            ? sug.discount_type === 'PERCENT'
                              ? `${sug.discount_value}%`
                              : `${sug.discount_value.toLocaleString()}원`
                            : '혜택'}
                        </Text>{' '}
                        할인!
                      </Text>
                    </View>

                    <Text style={styles.nudgeMessage}>{sug.message}</Text>

                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${sug.progress}%` }]} />
                    </View>

                    <View style={styles.progressLabelRow}>
                      <Text style={styles.progressPercent}>{sug.progress}% 달성</Text>
                      <Text style={styles.giftEmoji}>🎁</Text>
                    </View>
                  </View>
                ))}

              {suggestions
                .filter(s => s.is_achieved)
                .slice(0, 1)
                .map(sug => (
                  <View key={sug.rule_id} style={[styles.nudgeCard, styles.achievedCard, { marginHorizontal: 0, padding: 15 }]}>
                    <View style={styles.nudgeHeaderRow}>
                      <View style={[styles.badgeContainer, styles.achievedBadgeContainer, sug.is_cross_store && styles.crossStoreBadgeContainer]}>
                        <Text style={[styles.achievedBadge, sug.is_cross_store && styles.crossStoreBadge]}>
                          {sug.is_cross_store ? '🎉 상생 퀘스트 달성 완료!' : '🎉 퀘스트 달성 완료!'}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.nudgeMessage, styles.achievedMessage]}>
                      {sug.message} (주문 시 자동 적용)
                    </Text>
                    <View style={[styles.progressBarBg, styles.achievedBarBg]}>
                      <View style={[styles.progressBarFill, styles.achievedBarFill, { width: '100%' }]} />
                    </View>
                  </View>
                ))}
            </View>
          )}

          <View style={styles.totalPriceRow}>
            <Text style={styles.totalLabel}>
              주문 가능 {availableItems.length}개{soldOutCount > 0 ? ` (품절 ${soldOutCount})` : ''}
            </Text>
            <Text style={styles.totalPriceText}>{totalPrice.toLocaleString()}원</Text>
          </View>
          <TouchableOpacity
            style={[styles.orderButton, availableItems.length === 0 && styles.orderButtonDisabled]}
            onPress={handleOrder}
            disabled={availableItems.length === 0}
          >
            <Text style={styles.orderButtonText}>주문하기</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  header: { padding: 20, backgroundColor: '#fff', alignItems: 'center', borderBottomWidth: 1, borderColor: '#eee' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#333' },
  itemContainer: { backgroundColor: '#fff', marginBottom: 15, borderRadius: 16, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
  itemContainerSoldOut: { opacity: 0.55, backgroundColor: '#f8f8f8' },
  itemWrapper: { flexDirection: 'row', padding: 15, alignItems: 'center' },
  imgWrap: { position: 'relative' },
  soldOutOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldOutOverlayText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  textSoldOut: { color: '#999' },
  variantSkuText: { fontSize: 11, color: '#888', marginTop: 2 },
  soldOutLabel: { fontSize: 12, color: '#C62828', fontWeight: '700', marginTop: 5 },
  soldOutRemoveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  soldOutRemoveText: { fontSize: 13, color: '#666', fontWeight: '600' },
  img: { width: 70, height: 70, borderRadius: 12, backgroundColor: '#f0f0f0' },
  details: { flex: 1, marginLeft: 15 },
  itemName: { fontSize: 15, fontWeight: 'bold', color: '#1a1a1a' },
  itemPrice: { fontSize: 14, fontWeight: '900', color: '#000', marginTop: 5 },
  controller: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f3f5', borderRadius: 8 },
  ctrlBtn: { padding: 8 },
  ctrlDisplay: { paddingHorizontal: 10, minWidth: 35, alignItems: 'center' },
  ctrlText: { fontSize: 14, fontWeight: 'bold' },
  itemFooterBtns: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#f1f3f5' },
  infoBtn: { flex: 1, padding: 10, alignItems: 'center', borderRightWidth: 1, borderRightColor: '#f1f3f5' },
  infoBtnText: { fontSize: 12, color: '#666' },
  deleteBtn: { width: 60, padding: 10, alignItems: 'center' },
  expandedContent: { padding: 15, backgroundColor: '#fcfcfc', borderTopWidth: 1, borderTopColor: '#f1f3f5' },
  infoDesc: { fontSize: 12, color: '#888', lineHeight: 18, fontStyle: 'italic' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 25, backgroundColor: '#fff', borderTopLeftRadius: 25, borderTopRightRadius: 25, elevation: 15, shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.1, shadowRadius: 10 },
  totalPriceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  totalLabel: { fontSize: 14, color: '#888' },
  totalPriceText: { fontSize: 22, fontWeight: '900', color: '#e03131' },
  orderButton: { backgroundColor: '#000', padding: 18, borderRadius: 15, alignItems: 'center' },
  orderButtonDisabled: { backgroundColor: '#ccc' },
  orderButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { color: '#adb5bd', fontSize: 16, marginTop: 15, marginBottom: 25 },
  shopBtn: { paddingHorizontal: 25, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#dee2e6' },
  shopBtnText: { color: '#495057', fontSize: 14, fontWeight: 'bold' },

  // 🎁 Nudge Progress Quest UI Styles
  nudgeContainer: {
    paddingHorizontal: 0,
    paddingTop: 5,
    paddingBottom: 15,
  },
  nudgeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  achievedCard: {
    borderColor: '#37b24d',
    backgroundColor: '#ebfbee',
  },
  nudgeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeContainer: {
    backgroundColor: '#e8f7ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  nudgeBadge: {
    fontSize: 10,
    fontWeight: '900',
    color: '#0984e3',
  },
  achievedBadgeContainer: {
    backgroundColor: '#d3f9d8',
  },
  achievedBadge: {
    fontSize: 11,
    fontWeight: '900',
    color: '#2b8a3e',
  },
  remainingText: {
    fontSize: 12,
    color: '#495057',
    fontWeight: '600',
  },
  nudgeMessage: {
    fontSize: 14,
    fontWeight: '800',
    color: '#212529',
    marginBottom: 12,
  },
  achievedMessage: {
    color: '#2b8a3e',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#f1f3f5',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3182f6',
    borderRadius: 4,
  },
  achievedBarBg: {
    backgroundColor: '#d3f9d8',
  },
  achievedBarFill: {
    backgroundColor: '#2b8a3e',
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressPercent: {
    fontSize: 11,
    fontWeight: '700',
    color: '#868e96',
  },
  giftEmoji: {
    fontSize: 14,
  },
  crossStoreBadgeContainer: {
    backgroundColor: '#fff0f6', // Soft partnership pink tone
  },
  crossStoreBadge: {
    color: '#d91b5c', // Vibrant alliance berry/pink color
  },
  stickyNudgeContainer: {
    backgroundColor: '#f1f3f5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  stickyNudgeTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333d4b',
    flex: 1,
    marginRight: 10,
  },
  stickyNudgeRemaining: {
    fontSize: 12,
    fontWeight: '900',
    color: '#e03131',
  },
  stickyProgressBarBg: {
    height: 6,
    backgroundColor: '#dee2e6',
    borderRadius: 3,
    overflow: 'hidden',
    marginVertical: 6,
  },
  stickyProgressBarFill: {
    height: '100%',
    backgroundColor: '#3182f6',
    borderRadius: 3,
  },
  stickyProgressText: {
    fontSize: 10,
    color: '#868e96',
    fontWeight: '700',
  },
  achievedLabelContainer: {
    backgroundColor: '#e8f3ff',
    borderColor: '#3182f6',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 10,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  achievedLabelText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#3182f6',
  }
});

export default CartScreen;