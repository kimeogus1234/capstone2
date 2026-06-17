import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import productApi from '../api/productapi';
import { BASE_URL, IMAGE_BASE_URL } from '../api/config';

const { width } = Dimensions.get('window');

const MyCoupangScreen = () => {
  const { user, isLoggedIn, logout } = useAuth();
  const navigation = useNavigation();

  const [coupons, setCoupons] = useState([]);
  const [statusCounts, setStatusCounts] = useState({ pending: 0, shipping: 0, delivered: 0, canceled: 0 });

  useEffect(() => {
    if (user) {
      fetchCoupons();
      fetchStatusCounts();
    }
  }, [user]);

  const fetchCoupons = async () => {
    try {
      const result = await productApi.coupon.getCoupons();
      if (result.success) setCoupons(result.data);
    } catch (error) {
      if (error.response?.status !== 401) console.warn('Coupons Fetch Error:', error.message);
    }
  };

  const fetchStatusCounts = async () => {
    try {
      const result = await productApi.order.getStatusCounts();
      if (result) setStatusCounts(result);
    } catch (error) {
      if (error.response?.status !== 401) console.warn('Status Counts Fetch Error:', error.message);
    }
  };

  const getDisplayName = () => user?.name || user?.username || 'Premium Member';

  if (!isLoggedIn) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="person-circle-outline" size={80} color="#eee" />
        <Text style={styles.title}>로그인이 필요합니다</Text>
        <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginBtnText}>로그인 / 회원가입</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* 🏙️ 프로필 섹션 */}
        <View style={styles.profileSection}>
          <View style={styles.avatarWrapper}>
            <Image
              source={{ uri: user?.profileImage ? (user.profileImage.startsWith('http') ? user.profileImage : `${IMAGE_BASE_URL}${user.profileImage.startsWith('/') ? user.profileImage : '/uploads/' + user.profileImage}`) : 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=200' }}
              style={styles.avatar}
            />
          </View>
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.userName} numberOfLines={1}>{getDisplayName()}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('EditProfile')} style={styles.editBtn}>
                <Ionicons name="settings-outline" size={18} color="#999" />
              </TouchableOpacity>
            </View>
            <Text style={styles.userEmail}>{user?.email}</Text>

          </View>
        </View>

        {/* 💳 주문 현황 */}
        <View style={styles.statsCard}>
          <Text style={styles.cardTitle}>나의 주문 현황</Text>
          <View style={styles.statsRow}>
            {[
              { label: '결제완료', icon: 'card-outline', count: statusCounts.pending, filter: '배달대기' },
              { label: '배송중', icon: 'car-outline', count: statusCounts.shipping, filter: '배달중' },
              { label: '배송완료', icon: 'checkmark-done-outline', count: statusCounts.delivered, filter: '종료이력' },
              { label: '취소/반품', icon: 'refresh-outline', count: statusCounts.canceled, filter: '반품/회수' },
            ].map((stat, i) => (
              <TouchableOpacity key={i} style={styles.statItem} onPress={() => navigation.navigate('OrderTrackingScreen', { filterStatus: stat.filter })}>
                <View style={styles.iconCircle}>
                  <Ionicons name={stat.icon} size={22} color="#333" />
                  {stat.count > 0 && (
                    <View style={styles.badge}><Text style={styles.badgeText}>{stat.count}</Text></View>
                  )}
                </View>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 🎫 나의 혜택 */}
        <TouchableOpacity style={styles.couponSummaryCard} onPress={() => navigation.navigate('CouponBox')}>
          <View style={styles.couponSummaryLeft}>
            <Ionicons name="ticket" size={22} color="#FF3B30" />
            <Text style={styles.couponSummaryTitle}>사용 가능한 쿠폰</Text>
          </View>
          <View style={styles.couponSummaryRight}>
            <Text style={styles.couponCountText}>{coupons.length}장</Text>
            <Ionicons name="chevron-forward" size={16} color="#ccc" />
          </View>
        </TouchableOpacity>

        {/* 📂 통합 메뉴 (고객지원 및 정책 포함) */}
        <View style={styles.menuContainer}>
          {[
            { label: '주문내역', screen: 'OrderTrackingScreen' },
            { label: '찜목록', screen: 'WishlistScreen' },
            { label: '취소/반품/교환 내역', screen: 'CancelReturnExchange' },
            { label: '배송지 관리', screen: 'Address' },
            { label: '개인정보 변경', screen: 'EditProfile' },
            { label: '고객 센터', screen: 'PolicyScreen', params: { type: 'customer' } },
            { label: '서비스 이용약관', screen: 'PolicyScreen', params: { type: 'terms' } },
            { label: '개인정보 처리방침', screen: 'PolicyScreen', params: { type: 'privacy' } },
            { label: '전자금융거래 약관', screen: 'PolicyScreen', params: { type: 'finance' } },
          ].map((item, i) => (
            <TouchableOpacity
              key={i}
              style={styles.menuItem}
              onPress={() => (item.screen ? navigation.navigate(item.screen, item.params) : Alert.alert('안내', '서비스를 준비 중입니다.'))}
            >
              <Text style={styles.menuText}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={14} color="#ddd" />
            </TouchableOpacity>
          ))}
        </View>

        {/* 🚪 로그아웃 및 회원탈퇴 (통합 메뉴 바로 밑) */}
        <View style={styles.bottomActionSection}>
          <View style={styles.footerActionRow}>
            <TouchableOpacity onPress={logout} style={styles.footerActionBtn}>
              <Text style={styles.footerActionText}>로그아웃</Text>
            </TouchableOpacity>
            <View style={styles.vDivider} />
            <TouchableOpacity onPress={() => navigation.navigate('DeleteAccount')} style={styles.footerActionBtn}>
              <Text style={styles.footerActionText}>회원탈퇴</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  title: { fontSize: 18, fontWeight: 'bold', marginVertical: 20 },
  loginBtn: { backgroundColor: '#000', paddingHorizontal: 40, paddingVertical: 15, borderRadius: 30 },
  loginBtnText: { color: '#fff', fontWeight: 'bold' },

  profileSection: { flexDirection: 'row', padding: 25, alignItems: 'center' },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#f9f9f9' },
  profileInfo: { marginLeft: 15, flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  userName: { fontSize: 18, fontWeight: 'bold', color: '#111' },
  editBtn: { marginLeft: 8, padding: 4 },
  userEmail: { fontSize: 13, color: '#999', marginTop: 4 },

  statsCard: { marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 16, padding: 20, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, marginBottom: 20 },
  cardTitle: { fontSize: 13, fontWeight: 'bold', color: '#666', marginBottom: 15 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statItem: { alignItems: 'center', width: '25%' },
  iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f9f9f9', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  badge: { position: 'absolute', top: -2, right: -2, backgroundColor: '#FF3B30', minWidth: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  statLabel: { fontSize: 11, color: '#555' },

  couponSummaryCard: { marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 12, padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#f2f2f2' },
  couponSummaryLeft: { flexDirection: 'row', alignItems: 'center' },
  couponSummaryTitle: { fontSize: 14, fontWeight: '600', color: '#333', marginLeft: 10 },
  couponSummaryRight: { flexDirection: 'row', alignItems: 'center' },
  couponCountText: { fontSize: 15, fontWeight: 'bold', color: '#FF3B30', marginRight: 5 },

  menuContainer: { marginTop: 20, paddingHorizontal: 25 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#f9f9f9' },
  menuText: { fontSize: 15, color: '#333' },

  bottomActionSection: { marginTop: 20, paddingHorizontal: 25, paddingVertical: 10 },
  footerActionRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerActionBtn: { paddingHorizontal: 15, paddingVertical: 8 },
  footerActionText: { color: '#999', fontSize: 13, textDecorationLine: 'underline' },
  vDivider: { width: 1, height: 10, backgroundColor: '#ddd' },
});

export default MyCoupangScreen;
