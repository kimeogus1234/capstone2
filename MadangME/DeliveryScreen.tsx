import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, ActivityIndicator, Alert, LayoutAnimation, Platform, UIManager, TextInput, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from './config';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  address: string;
  totalPrice: number;
  status: 'PENDING' | 'SHIPPING' | 'DELIVERED' | 'RETURNED' | 'CANCEL_REQUESTED' | 'RETURN_REQUESTED' | 'EXCHANGE_REQUESTED' | 'EXCHANGED' | 'CANCELLED';
  orderMemo?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

const DeliveryScreen = ({ onBack, token }: any) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'SHIPPING' | 'DELIVERED' | 'RETURNS'>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/orders/delivery-all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('서버 데이터 수신 실패');

      const data = await response.json();
      const mappedOrders: Order[] = data.map((o: any) => {
        let address = '매장 수령 또는 주소 누락';
        let phone = '010-0000-0000';
        let customerName = '고객';

        if (typeof o.shippingAddress === 'string') {
          address = o.shippingAddress;
          phone = o.shippingPhone || '010-0000-0000';
          customerName = o.customerName || o.user?.name || '고객';
        } else if (o.shippingAddress && typeof o.shippingAddress === 'object') {
          address = `${o.shippingAddress.address || ''} ${o.shippingAddress.detailAddress || ''}`.trim() || '매장 수령 또는 주소 누락';
          phone = o.shippingAddress.phone || o.shippingPhone || '010-0000-0000';
          customerName = o.shippingAddress.receiver || o.customerName || o.user?.name || '고객';
        } else {
          address = '매장 수령 또는 주소 누락';
          phone = o.shippingPhone || '010-0000-0000';
          customerName = o.customerName || o.user?.name || '고객';
        }

        let orderStatus: Order['status'] = 'PENDING';
        if (o.status === 'PREPARING' || o.status === 'PENDING' || o.status === 'PAID') {
          orderStatus = 'PENDING';
        } else if (['SHIPPING', 'DELIVERING'].includes(o.status)) {
          orderStatus = 'SHIPPING';
        } else {
          orderStatus = o.status || 'PENDING';
        }

        return {
          id: o._id,
          orderNumber: o.orderId || o.orderNumber || o._id.substring(0, 8).toUpperCase(),
          customerName,
          phone,
          address,
          totalPrice: o.totalAmount || o.price || 0,
          status: orderStatus,
          orderMemo: o.orderMemo || o.memo || '',
          items: o.items || []
        };
      });

      setOrders(mappedOrders);
    } catch (e) {
      console.error(e);
      Alert.alert('통신 오류', '주문 데이터를 서버에서 가져오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateStatus = async (id: string, newStatus: 'SHIPPING' | 'DELIVERED' | 'RETURNED' | 'EXCHANGED') => {
    try {
      const res = await fetch(`${API_URL}/orders/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) throw new Error('상태 업데이트 실패');

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
      Alert.alert('상태 변경 완료', `주문 상태가 변경되었습니다.`);
    } catch (e) {
      console.error(e);
      Alert.alert('오류', '주문 상태 업데이트에 실패했습니다.');
    }
  };

  const makeCall = (phone: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {
      Alert.alert('전화 연결 불가', '이 기기에서는 전화 연결 기능을 지원하지 않습니다.');
    });
  };

  const openNavigation = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    const fallbackUrl = Platform.select({
      ios: `maps://?q=${encodedAddress}`,
      android: `geo:0,0?q=${encodedAddress}`
    }) || `https://maps.google.com/?q=${encodedAddress}`;

    Linking.openURL(fallbackUrl).catch(err => {
      console.error(err);
      Alert.alert('길안내 실패', '기기에서 지도 앱을 실행할 수 없습니다.');
    });
  };

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(prev => prev === id ? null : id);
  };

  const filteredOrders = React.useMemo(() => {
    let result = orders;

    if (activeTab === 'PENDING') {
      result = result.filter(o => o.status === 'PENDING');
    } else if (activeTab === 'SHIPPING') {
      result = result.filter(o => o.status === 'SHIPPING');
    } else if (activeTab === 'RETURNS') {
      result = result.filter(o => ['RETURN_REQUESTED', 'EXCHANGE_REQUESTED'].includes(o.status));
    } else if (activeTab === 'DELIVERED') {
      result = result.filter(o => ['DELIVERED', 'RETURNED', 'EXCHANGED', 'CANCELLED'].includes(o.status));
    }

    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      result = result.filter(o =>
        o.customerName.toLowerCase().includes(q) ||
        o.address.toLowerCase().includes(q) ||
        o.orderNumber.toLowerCase().includes(q)
      );
    }

    return result;
  }, [orders, activeTab, searchQuery]);

  const renderStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'PENDING':
        return (
          <View style={[styles.badge, styles.badgePending]}>
            <Text style={[styles.badgeText, styles.badgeTextPending]}>결제완료</Text>
          </View>
        );
      case 'SHIPPING':
        return (
          <View style={[styles.badge, styles.badgeShipping]}>
            <Text style={[styles.badgeText, styles.badgeTextShipping]}>배송중 🚚</Text>
          </View>
        );
      case 'DELIVERED':
        return (
          <View style={[styles.badge, styles.badgeDelivered]}>
            <Text style={[styles.badgeText, styles.badgeTextDelivered]}>배송완료 ✅</Text>
          </View>
        );
      case 'RETURNED':
        return (
          <View style={[styles.badge, styles.badgeReturned]}>
            <Text style={[styles.badgeText, styles.badgeTextReturned]}>반품완료 ⚠️</Text>
          </View>
        );
      case 'CANCEL_REQUESTED':
        return (
          <View style={[styles.badge, { backgroundColor: '#FEE2E2' }]}>
            <Text style={[styles.badgeText, { color: '#B91C1C' }]}>취소대기 ⚠️</Text>
          </View>
        );
      case 'RETURN_REQUESTED':
        return (
          <View style={[styles.badge, { backgroundColor: '#FEF3C7' }]}>
            <Text style={[styles.badgeText, { color: '#D97706' }]}>반품대기 ⚠️</Text>
          </View>
        );
      case 'EXCHANGE_REQUESTED':
        return (
          <View style={[styles.badge, { backgroundColor: '#E0F2FE' }]}>
            <Text style={[styles.badgeText, { color: '#0369A1' }]}>교환대기 🔄</Text>
          </View>
        );
      case 'EXCHANGED':
        return (
          <View style={[styles.badge, { backgroundColor: '#F3E8FF' }]}>
            <Text style={[styles.badgeText, { color: '#7E22CE' }]}>교환완료 🔄</Text>
          </View>
        );
      case 'CANCELLED':
        return (
          <View style={[styles.badge, { backgroundColor: '#F3F4F6' }]}>
            <Text style={[styles.badgeText, { color: '#9CA3AF' }]}>취소완료</Text>
          </View>
        );
      default:
        return (
          <View style={[styles.badge, styles.badgePending]}>
            <Text style={[styles.badgeText, styles.badgeTextPending]}>{status}</Text>
          </View>
        );
    }
  };

  const renderItem = ({ item }: { item: Order }) => {
    const isExpanded = expandedId === item.id;
    return (
      <View style={[styles.card, isExpanded && styles.cardExpanded]}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => toggleExpand(item.id)}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.orderNo}>주문번호: {item.orderNumber}</Text>
            {renderStatusBadge(item.status)}
          </View>

          <View style={styles.summaryRow}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.customerName}>{item.customerName} 고객님</Text>
              <Text style={styles.addressSummary} numberOfLines={isExpanded ? undefined : 1}>
                {item.address}
              </Text>
            </View>
            <Text style={styles.priceSummary}>
              {item.totalPrice.toLocaleString()}원
            </Text>
          </View>

          {!isExpanded && (
            <View style={styles.touchHint}>
              <Text style={styles.touchHintText}>상세 정보 및 배달 처리 열기 ▾</Text>
            </View>
          )}
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.detailArea}>
            <View style={styles.divider} />

            <Text style={styles.detailTitle}>📦 주문 품목 명세</Text>
            {item.items.map((prod, idx) => (
              <View key={idx} style={styles.prodRow}>
                <Text style={styles.prodName}>{prod.name}</Text>
                <Text style={styles.prodQty}>{prod.quantity}개</Text>
              </View>
            ))}

            {item.orderMemo ? (
              <View style={styles.memoBox}>
                <Text style={styles.memoTitle}>📝 라이더 전달 사항</Text>
                <Text style={styles.memoText}>{item.orderMemo}</Text>
              </View>
            ) : null}

            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.actionBtn, styles.callBtn]} onPress={() => makeCall(item.phone)} activeOpacity={0.8}>
                <Text style={styles.callBtnText}>📞 전화 걸기</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.naviBtn]} onPress={() => openNavigation(item.address)} activeOpacity={0.8}>
                <Text style={styles.naviBtnText}>🗺️ 내비 길찾기</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.stateTransitionRow}>
              {item.status === 'PENDING' && (
                <TouchableOpacity style={[styles.transitionBtn, styles.btnShipping]} onPress={() => updateStatus(item.id, 'SHIPPING')} activeOpacity={0.8}>
                  <Text style={styles.btnText}>배달 출발하기 🚚</Text>
                </TouchableOpacity>
              )}
              {item.status === 'SHIPPING' && (
                <TouchableOpacity style={[styles.transitionBtn, styles.btnDelivered]} onPress={() => updateStatus(item.id, 'DELIVERED')} activeOpacity={0.8}>
                  <Text style={styles.btnText}>배달 완료 처리 ✅</Text>
                </TouchableOpacity>
              )}

              {/* 반품/교환 회수용 버튼 (RETURNS 탭에서 활성화) */}
              {activeTab === 'RETURNS' && item.status === 'RETURN_REQUESTED' && (
                <TouchableOpacity style={[styles.transitionBtn, { backgroundColor: '#F59E0B' }]} onPress={() => updateStatus(item.id, 'RETURNED')} activeOpacity={0.8}>
                  <Text style={styles.btnText}>반품 수거 완료 📦</Text>
                </TouchableOpacity>
              )}
              {activeTab === 'RETURNS' && item.status === 'EXCHANGE_REQUESTED' && (
                <TouchableOpacity style={[styles.transitionBtn, { backgroundColor: '#7E22CE' }]} onPress={() => updateStatus(item.id, 'EXCHANGED')} activeOpacity={0.8}>
                  <Text style={styles.btnText}>교환 수거 및 배달 완료 🔄</Text>
                </TouchableOpacity>
              )}

              {/* PENDING 이나 SHIPPING 탭인데 반품/취소 요청이 들어왔을 때만 경고 메세지 표시 */}
              {activeTab !== 'RETURNS' && ['CANCEL_REQUESTED', 'RETURN_REQUESTED', 'EXCHANGE_REQUESTED'].includes(item.status) && (
                <View style={{ width: '100%', backgroundColor: '#FFFBEB', padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: '#F59E0B', alignItems: 'center' }}>
                  <Text style={{ color: '#D97706', fontWeight: 'bold', fontSize: 13 }}>고객 요청(취소/반품) 대기 중인 주문입니다 ⏳</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 서브 탑 헤더 */}
      <View style={styles.header}>
        <View style={{ width: 30 }} />
        <Text style={styles.headerTitle}>배달 관제 시스템 📡</Text>
        <TouchableOpacity onPress={fetchOrders} disabled={loading} style={styles.refreshBtn} activeOpacity={0.7}>
          {loading ? (
            <ActivityIndicator size="small" color="#3182F6" />
          ) : (
            <Text style={styles.refreshIcon}>🔄</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* 검색 바 */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="고객명, 배달 주소, 주문번호 검색 🔍"
          placeholderTextColor="#8B95A1"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
      </View>

      {/* 탭 네비게이션 */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'PENDING' && styles.activeTab]}
          onPress={() => setActiveTab('PENDING')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'PENDING' && styles.activeTabText]}>배달대기</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'SHIPPING' && styles.activeTab]}
          onPress={() => setActiveTab('SHIPPING')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'SHIPPING' && styles.activeTabText]}>배달중</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'RETURNS' && styles.activeTab]}
          onPress={() => setActiveTab('RETURNS')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'RETURNS' && styles.activeTabText]}>반품/회수</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'DELIVERED' && styles.activeTab]}
          onPress={() => setActiveTab('DELIVERED')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'DELIVERED' && styles.activeTabText]}>종료이력</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3182F6" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>조건에 일치하는 배달 주문 내역이 없습니다. 📭</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E8EB'
  },
  backBtn: { paddingVertical: 4, paddingHorizontal: 8 },
  backText: { color: '#4E5968', fontSize: 15, fontWeight: '700' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#1A1F27' },
  refreshBtn: { padding: 4 },
  refreshIcon: { fontSize: 18 },

  searchContainer: { paddingHorizontal: 20, marginTop: 12 },
  searchInput: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E8EB',
    fontSize: 14,
    color: '#1A1F27',
    fontWeight: '500',
  },

  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 6
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent'
  },
  activeTab: { borderBottomColor: '#3182F6' },
  tabText: { fontSize: 14, color: '#8B95A1', fontWeight: '700' },
  activeTabText: { color: '#3182F6' },

  listContent: { padding: 20, paddingBottom: 40 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E8EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1
  },
  cardExpanded: {
    borderColor: '#3182F6',
    borderWidth: 1.5,
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  orderNo: { fontSize: 11, color: '#8B95A1', fontWeight: '800' },

  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '800' },
  badgePending: { backgroundColor: '#F2F4F6' },
  badgeTextPending: { color: '#4E5968' },
  badgeShipping: { backgroundColor: '#EAF2FF' },
  badgeTextShipping: { color: '#1B64D1' },
  badgeDelivered: { backgroundColor: '#E8F8EE' },
  badgeTextDelivered: { color: '#1E7E34' },
  badgeReturned: { backgroundColor: '#FEE2E2' },
  badgeTextReturned: { color: '#B91C1C' },

  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  customerName: { fontSize: 16, fontWeight: '900', color: '#1A1F27', marginBottom: 4 },
  addressSummary: { fontSize: 13, color: '#4E5968', fontWeight: '500', lineHeight: 18 },
  priceSummary: { fontSize: 17, fontWeight: '900', color: '#1A1F27' },

  touchHint: { marginTop: 12, alignSelf: 'center' },
  touchHintText: { fontSize: 11, color: '#8B95A1', fontWeight: '700' },

  detailArea: { marginTop: 15 },
  divider: { height: 1.5, backgroundColor: '#F2F4F6', marginBottom: 15 },
  detailTitle: { fontSize: 13, fontWeight: '800', color: '#8B95A1', marginBottom: 8 },
  prodRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, paddingHorizontal: 4 },
  prodName: { fontSize: 14, color: '#1A1F27', fontWeight: '600' },
  prodQty: { fontSize: 14, color: '#4E5968', fontWeight: '700' },

  memoBox: { backgroundColor: '#FAF9F9', padding: 12, borderRadius: 10, marginVertical: 14, borderWidth: 1, borderColor: '#F2EAEA' },
  memoTitle: { fontSize: 11, fontWeight: '800', color: '#FF3B30', marginBottom: 4 },
  memoText: { fontSize: 13, color: '#4E5968', fontWeight: '600', lineHeight: 18 },

  actionRow: { flexDirection: 'row', marginTop: 15, gap: 8 },
  actionBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  callBtn: { backgroundColor: '#F2F4F6' },
  callBtnText: { color: '#4E5968', fontWeight: '800', fontSize: 14 },
  naviBtn: { backgroundColor: '#3182F6' },
  naviBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  stateTransitionRow: { marginTop: 10 },
  transitionBtn: { width: '100%', paddingVertical: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnShipping: { backgroundColor: '#EAF2FF', borderWidth: 1.5, borderColor: '#3182F6' },
  btnDelivered: { backgroundColor: '#1A1F27' },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '900' },

  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 13, color: '#8B95A1', textAlign: 'center', fontWeight: '600' }
});

export default DeliveryScreen;
