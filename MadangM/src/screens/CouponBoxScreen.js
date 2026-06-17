import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import productApi from '../api/productapi';

const CouponBoxScreen = ({ navigation, route }) => {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const onSelectCoupon = route.params?.onSelectCoupon; // 결제화면에서 넘어왔을 때 사용

    const fetchCoupons = useCallback(async () => {
        try {
            setLoading(true);
            const result = await productApi.coupon.getCoupons();
            if (result.success) setCoupons(result.data);
        } catch (error) {
            console.error('Coupon Box Fetch Error:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchCoupons();
        }, [fetchCoupons])
    );

    const renderCoupon = ({ item }) => {
        const isExpired = new Date(item.valid_until) < new Date();
        
        return (
            <TouchableOpacity 
                style={[styles.couponCard, isExpired && styles.expiredCard]}
                disabled={isExpired}
                onPress={() => {
                    if (onSelectCoupon) {
                        onSelectCoupon(item);
                        navigation.goBack();
                    }
                }}
            >
                <View style={styles.couponLeft}>
                    <Text style={styles.couponValue}>
                        {item.discount_type === 'AMOUNT' ? `${item.discount_value.toLocaleString()}원` : `${item.discount_value}%`}
                    </Text>
                    <Text style={styles.couponType}>DISCOUNT</Text>
                </View>
                <View style={styles.couponRight}>
                    <View style={styles.couponHeader}>
                        <Text style={styles.couponName}>{item.name}</Text>
                        {item.is_active && !isExpired && (
                            <View style={styles.activeBadge}>
                                <Text style={styles.activeBadgeText}>사용가능</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.couponCode}>코드: {item.code}</Text>
                    <Text style={styles.couponLimit}>최소 {item.min_order_amount.toLocaleString()}원 이상 구매 시</Text>
                    <View style={styles.dateRow}>
                        <Ionicons name="time-outline" size={12} color={isExpired ? "#999" : "#FF3B30"} />
                        <Text style={[styles.couponDate, isExpired && styles.expiredText]}>
                            {new Date(item.valid_until).toLocaleDateString()} 까지
                        </Text>
                    </View>
                </View>
                {/* 티켓 효과 */}
                <View style={styles.punchHoleTop} />
                <View style={styles.punchHoleBottom} />
                {onSelectCoupon && !isExpired && (
                    <View style={styles.selectIndicator}>
                        <Ionicons name="chevron-forward" size={20} color="#ddd" />
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>마이 쿠폰함</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#000" />
                </View>
            ) : (
                <FlatList
                    data={coupons}
                    renderItem={renderCoupon}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.listPadding}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="ticket-outline" size={60} color="#eee" />
                            <Text style={styles.emptyText}>보유하신 쿠폰이 없습니다.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    header: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    backBtn: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#000' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listPadding: { padding: 20 },
    
    couponCard: { height: 120, backgroundColor: '#fff', borderRadius: 16, marginBottom: 15, flexDirection: 'row', overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, position: 'relative' },
    expiredCard: { opacity: 0.6, backgroundColor: '#f0f0f0' },
    couponLeft: { width: '30%', backgroundColor: '#111', justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderRightColor: '#eee', borderStyle: 'dashed' },
    couponValue: { color: '#fff', fontSize: 20, fontWeight: '900' },
    couponType: { color: '#aaa', fontSize: 10, fontWeight: 'bold', marginTop: 5 },
    
    couponRight: { flex: 1, padding: 15, justifyContent: 'center' },
    couponHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 },
    couponName: { fontSize: 16, fontWeight: 'bold', color: '#000', flex: 1 },
    activeBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    activeBadgeText: { color: '#2E7D32', fontSize: 10, fontWeight: 'bold' },
    
    couponCode: { fontSize: 12, color: '#666', marginBottom: 4 },
    couponLimit: { fontSize: 11, color: '#888', marginBottom: 8 },
    dateRow: { flexDirection: 'row', alignItems: 'center' },
    couponDate: { fontSize: 11, color: '#FF3B30', fontWeight: 'bold', marginLeft: 4 },
    expiredText: { color: '#999' },
    
    punchHoleTop: { position: 'absolute', top: -10, left: '30%', marginLeft: -10, width: 20, height: 20, borderRadius: 10, backgroundColor: '#f8f9fa' },
    punchHoleBottom: { position: 'absolute', bottom: -10, left: '30%', marginLeft: -10, width: 20, height: 20, borderRadius: 10, backgroundColor: '#f8f9fa' },
    
    selectIndicator: { justifyContent: 'center', paddingRight: 10 },
    
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { marginTop: 20, fontSize: 16, color: '#ccc', fontWeight: '500' }
});

export default CouponBoxScreen;
