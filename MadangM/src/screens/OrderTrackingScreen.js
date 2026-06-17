import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ScrollView, SafeAreaView, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import productApi from '../api/productapi';
import { BASE_URL, IMAGE_BASE_URL } from '../api/config';

const OrderTrackingScreen = ({ navigation, route }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeStatus, setActiveStatus] = useState(route.params?.filterStatus || '배달대기');

    const statusFilters = ['배달대기', '배달중', '반품/회수', '종료이력'];

    const fetchOrders = async (isRefreshing = false) => {
        try {
            if (!isRefreshing) setLoading(true);
            const data = await productApi.order.getMyOrders();
            setOrders(data || []);
        } catch (error) {
            console.error("Order History Error:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const getStatusLabelAndColor = (status) => {
        switch (status) {
            case 'PAID': return { label: '결제완료', color: '#000' };
            case 'PREPARING': return { label: '상품준비중', color: '#9c27b0' };
            case 'SHIPPING': return { label: '배송중', color: '#0073e9' };
            case 'COMPLETED':
            case 'DELIVERED': return { label: '배송완료', color: '#2e7d32' };
            case 'CANCEL_REQUESTED': return { label: '취소신청중', color: '#b71c1c' };
            case 'CANCELLED':
            case 'CANCELED': return { label: '취소완료', color: '#d32f2f' };
            case 'RETURN_REQUESTED': return { label: '반품신청중', color: '#bf360c' };
            case 'RETURNED': return { label: '반품완료', color: '#e65100' };
            case 'EXCHANGE_REQUESTED': return { label: '교환신청중', color: '#e65100' };
            case 'EXCHANGED': return { label: '교환완료', color: '#6a1b9a' };
            default: return { label: status, color: '#666' };
        }
    };

    const filteredOrders = orders.filter(order => {
        const s = order.status;
        if (activeStatus === '배달대기') {
            return s === 'PAID' || s === 'PREPARING';
        } else if (activeStatus === '배달중') {
            return s === 'SHIPPING' || s === 'DELIVERING';
        } else if (activeStatus === '반품/회수') {
            return s === 'RETURN_REQUESTED' || s === 'EXCHANGE_REQUESTED' || s === 'CANCEL_REQUESTED';
        } else if (activeStatus === '종료이력') {
            return s === 'DELIVERED' || s === 'COMPLETED' || s === 'RETURNED' || s === 'EXCHANGED' || s === 'CANCELLED' || s === 'CANCELED';
        }
        return true;
    });

    const getFullUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        const cleanPath = url.startsWith('/') ? url : `/uploads/${url}`;
        return `${IMAGE_BASE_URL}${cleanPath}`;
    };

    const handleCancelOrder = (item) => {
        Alert.alert(
            '주문 취소',
            '주문을 취소하시겠습니까?',
            [
                { text: '아니요', style: 'cancel' },
                {
                    text: '취소하기',
                    onPress: async () => {
                        try {
                            await productApi.order.cancelOrder(item._id);
                            fetchOrders(true);
                        } catch (error) {
                            Alert.alert('오류', '취소 처리 중 문제가 발생했습니다.');
                        }
                    }
                }
            ]
        );
    };

    const handleReturnOrder = (item) => {
        Alert.alert(
            '반품 신청',
            '이 주문을 반품/환불 신청하시겠습니까?',
            [
                { text: '아니요', style: 'cancel' },
                {
                    text: '신청하기',
                    onPress: async () => {
                        try {
                            await productApi.order.returnOrder(item._id);
                            fetchOrders(true);
                        } catch (error) {
                            Alert.alert('오류', '반품 처리 중 문제가 발생했습니다.');
                        }
                    }
                }
            ]
        );
    };

    const handleExchangeOrder = (item) => {
        Alert.alert(
            '교환 신청',
            '이 주문의 상품을 교환 신청하시겠습니까?',
            [
                { text: '아니요', style: 'cancel' },
                {
                    text: '신청하기',
                    onPress: async () => {
                        try {
                            await productApi.order.exchangeOrder(item._id);
                            fetchOrders(true);
                        } catch (error) {
                            Alert.alert('오류', '교환 처리 중 문제가 발생했습니다.');
                        }
                    }
                }
            ]
        );
    };

    const renderOrderItem = ({ item }) => {
        const { label, color } = getStatusLabelAndColor(item.status);
        const orderDate = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '날짜 미상';

        return (
            <View style={styles.orderCard}>
                <View style={styles.orderHeader}>
                    <Text style={styles.orderDate}>{orderDate}</Text>
                    <Text style={styles.orderIdText}>{item.orderId}</Text>
                </View>

                <View style={styles.statusRow}>
                    <Text style={[styles.statusText, { color }]}>{label}</Text>
                </View>

                {item.items.map((product, index) => (
                    <View key={index} style={styles.productRow}>
                        {getFullUrl(product.image) ? (
                            <Image source={{ uri: getFullUrl(product.image) }} style={styles.productImage} />
                        ) : (
                            <View style={[styles.productImage, { backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee' }]} />
                        )}
                        <View style={styles.productInfo}>
                            <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                            <Text style={styles.productPrice}>{Number(product.price).toLocaleString()}원 · {product.quantity}개</Text>
                        </View>
                    </View>
                ))}

                {/* 🚚 배송 및 요청사항 정보 통합 섹션 */}
                <View style={styles.shippingInfoBox}>
                    <View style={styles.shippingRow}>
                        <Ionicons name="location-outline" size={14} color="#0073e9" />
                        <Text style={styles.shippingAddressText} numberOfLines={2}>
                            {item.shippingAddress || '배송지 정보 없음'}
                        </Text>
                    </View>
                    <View style={[styles.shippingRow, { marginTop: 6 }]}>
                        <Ionicons name="call-outline" size={14} color="#555" />
                        <Text style={styles.shippingPhoneText}>
                            {item.shippingPhone || '연락처 정보 없음'}
                        </Text>
                    </View>
                    {item.orderMemo && (
                        <View style={[styles.shippingRow, { marginTop: 6 }]}>
                            <Ionicons name="chatbubble-outline" size={14} color="#888" />
                            <Text style={styles.memoText}>{item.orderMemo}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.priceSummaryRow}>
                    <Text style={styles.totalPriceLabel}>최종 결제 금액</Text>
                    <View style={{ alignItems: 'flex-end' }}>
                        {item.discountAmount > 0 && (
                            <Text style={styles.historyDiscount}>-{(item.discountAmount).toLocaleString()}원 할인</Text>
                        )}
                        <Text style={styles.historyTotal}>{Number(item.totalAmount).toLocaleString()}원</Text>
                    </View>
                </View>

                <View style={styles.actionRow}>
                    {/* 배송 완료일 때만 리뷰 작성 가능 */}
                    {['DELIVERED', 'COMPLETED'].includes(item.status) && (
                        <TouchableOpacity 
                            style={[styles.actionBtn, { borderColor: '#000' }]}
                            onPress={() => {
                                if (item.items && item.items.length > 0) {
                                    navigation.navigate('WriteReview', {
                                        productId: item.items[0].productId,
                                        productName: item.items[0].name
                                    });
                                }
                            }}
                        >
                            <Text style={[styles.actionBtnText, { color: '#000' }]}>리뷰작성</Text>
                        </TouchableOpacity>
                    )}

                    {/* 결제완료, 준비중일 때만 주문취소 */}
                    {['PAID', 'PREPARING'].includes(item.status) && (
                        <TouchableOpacity style={[styles.actionBtn, { borderColor: '#d32f2f' }]} onPress={() => handleCancelOrder(item)}>
                            <Text style={[styles.actionBtnText, { color: '#d32f2f' }]}>주문취소</Text>
                        </TouchableOpacity>
                    )}

                    {/* 배송 완료일 때만 반품신청 및 교환신청 */}
                    {['DELIVERED', 'COMPLETED'].includes(item.status) && (
                        <>
                            <TouchableOpacity style={[styles.actionBtn, { borderColor: '#e65100' }]} onPress={() => handleReturnOrder(item)}>
                                <Text style={[styles.actionBtnText, { color: '#e65100' }]}>반품신청</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionBtn, { borderColor: '#6a1b9a' }]} onPress={() => handleExchangeOrder(item)}>
                                <Text style={[styles.actionBtnText, { color: '#6a1b9a' }]}>교환신청</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {/* 신청중 상태인 경우 안내문구 표시 */}
                    {['CANCEL_REQUESTED', 'RETURN_REQUESTED', 'EXCHANGE_REQUESTED'].includes(item.status) && (
                        <View style={{ flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: '#fff8e1', borderRadius: 6, marginHorizontal: 3 }}>
                            <Text style={{ fontSize: 13, color: '#ff8f00', fontWeight: 'bold' }}>요청 처리 대기 중 ⏳</Text>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Text>주문 내역을 불러오는 중...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>주문/배송 조회</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.statusFilterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 15 }}>
                    {statusFilters.map((status, idx) => (
                        <TouchableOpacity
                            key={idx}
                            style={[styles.statusFilterBtn, activeStatus === status && styles.activeStatusFilterBtn]}
                            onPress={() => setActiveStatus(status)}
                        >
                            <Text style={[styles.statusFilterText, activeStatus === status && styles.activeStatusFilterText]}>{status}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <FlatList
                data={filteredOrders}
                renderItem={renderOrderItem}
                keyExtractor={item => item._id || item.orderId}
                contentContainerStyle={{ padding: 15 }}
                refreshing={refreshing}
                onRefresh={() => fetchOrders(true)}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="cube-outline" size={50} color="#ddd" />
                        <Text style={styles.emptyText}>{activeStatus} 내역이 없습니다.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f2f2f2' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        height: 56,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    backBtn: {
        padding: 8,
    },
    statusFilterContainer: { backgroundColor: '#fff', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#ddd' },
    statusFilterBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#eee', backgroundColor: '#f9f9f9', marginRight: 8 },
    activeStatusFilterBtn: { backgroundColor: '#2e7d32', borderColor: '#2e7d32' },
    statusFilterText: { fontSize: 13, color: '#666' },
    activeStatusFilterText: { color: '#fff', fontWeight: 'bold' },
    orderCard: { backgroundColor: '#fff', padding: 18, marginBottom: 15, borderRadius: 12 },
    orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingBottom: 10 },
    orderDate: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    orderIdText: { fontSize: 11, color: '#999' },
    statusRow: { marginBottom: 15 },
    statusText: { fontSize: 18, fontWeight: 'bold' },
    productRow: { flexDirection: 'row', marginBottom: 15, alignItems: 'center' },
    productImage: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#f9f9f9' },
    productInfo: { flex: 1, marginLeft: 12 },
    productName: { fontSize: 14, color: '#333', marginBottom: 4 },
    productPrice: { fontSize: 13, color: '#777' },
    shippingInfoBox: { backgroundColor: '#f9f9f9', padding: 12, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#f0f0f0' },
    shippingRow: { flexDirection: 'row', alignItems: 'flex-start' },
    shippingAddressText: { fontSize: 12, color: '#333', marginLeft: 8, flex: 1, lineHeight: 18, fontWeight: '600' },
    shippingPhoneText: { fontSize: 12, color: '#555', marginLeft: 8 },
    memoText: { fontSize: 12, color: '#666', marginLeft: 8, flex: 1 },
    priceSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#f5f5f5', marginBottom: 10 },
    totalPriceLabel: { fontSize: 13, color: '#666', fontWeight: 'bold' },
    historyDiscount: { fontSize: 12, color: '#FF3B30', fontWeight: 'bold' },
    historyTotal: { fontSize: 18, fontWeight: '900', color: '#000' },
    actionRow: { flexDirection: 'row', justifyContent: 'space-between' },
    actionBtn: { flex: 1, borderWidth: 1, borderColor: '#ddd', paddingVertical: 10, borderRadius: 6, alignItems: 'center', marginHorizontal: 3 },
    actionBtnText: { fontSize: 13, color: '#555', fontWeight: '600' },
    emptyContainer: { alignItems: 'center', marginTop: 50 },
    emptyText: { marginTop: 15, fontSize: 15, color: '#888' }
});

export default OrderTrackingScreen;
