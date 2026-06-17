import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import productApi from '../api/productapi';
import { IMAGE_BASE_URL } from '../api/config';

const CancelReturnExchangeScreen = ({ navigation }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('전체');

    const tabs = ['전체', '취소/반품', '교환'];

    const fetchClaimOrders = async (isRefreshing = false) => {
        try {
            if (!isRefreshing) setLoading(true);
            const data = await productApi.order.getMyOrders();
            // 취소, 반품, 교환 관련 상태만 필터링
            const claimStatuses = [
                'CANCEL_REQUESTED', 'CANCELLED', 'CANCELED',
                'RETURN_REQUESTED', 'RETURNED',
                'EXCHANGE_REQUESTED', 'EXCHANGED'
            ];
            const claims = (data || []).filter(order => claimStatuses.includes(order.status));
            setOrders(claims);
        } catch (error) {
            console.error("Claim History Fetch Error:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchClaimOrders();
    }, []);

    const getStatusLabelAndColor = (status) => {
        switch (status) {
            case 'CANCEL_REQUESTED': return { label: '취소신청중', color: '#ff8f00' };
            case 'CANCELLED':
            case 'CANCELED': return { label: '취소완료', color: '#d32f2f' };
            case 'RETURN_REQUESTED': return { label: '반품신청중', color: '#e65100' };
            case 'RETURNED': return { label: '반품완료', color: '#c62828' };
            case 'EXCHANGE_REQUESTED': return { label: '교환신청중', color: '#0288d1' };
            case 'EXCHANGED': return { label: '교환완료', color: '#6a1b9a' };
            default: return { label: status, color: '#666' };
        }
    };

    const getFilteredOrders = () => {
        if (activeTab === '취소/반품') {
            return orders.filter(o => 
                ['CANCEL_REQUESTED', 'CANCELLED', 'CANCELED', 'RETURN_REQUESTED', 'RETURNED'].includes(o.status)
            );
        } else if (activeTab === '교환') {
            return orders.filter(o => 
                ['EXCHANGE_REQUESTED', 'EXCHANGED'].includes(o.status)
            );
        }
        return orders;
    };

    const getFullUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        const cleanPath = url.startsWith('/') ? url : `/uploads/${url}`;
        return `${IMAGE_BASE_URL}${cleanPath}`;
    };

    const renderOrderItem = ({ item }) => {
        const { label, color } = getStatusLabelAndColor(item.status);
        const orderDate = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '날짜 미상';

        return (
            <View style={styles.orderCard}>
                <View style={styles.orderHeader}>
                    <View>
                        <Text style={styles.orderDate}>{orderDate}</Text>
                        <Text style={styles.orderIdText}>{item.orderId}</Text>
                    </View>
                    <View style={[styles.statusBadge, { borderColor: color }]}>
                        <Text style={[styles.statusBadgeText, { color }]}>{label}</Text>
                    </View>
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

                <View style={styles.priceSummaryRow}>
                    <Text style={styles.totalPriceLabel}>환불/원거래 금액</Text>
                    <Text style={styles.historyTotal}>{Number(item.totalAmount).toLocaleString()}원</Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>취소/반품/교환 내역</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* 상단 3단 탭필터 */}
            <View style={styles.tabContainer}>
                {tabs.map((tab, idx) => (
                    <TouchableOpacity
                        key={idx}
                        style={[styles.tabBtn, activeTab === tab && styles.activeTabBtn]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0073e9" />
                    <Text style={styles.loadingText}>내역을 불러오는 중...</Text>
                </View>
            ) : (
                <FlatList
                    data={getFilteredOrders()}
                    renderItem={renderOrderItem}
                    keyExtractor={item => item._id || item.orderId}
                    contentContainerStyle={{ padding: 15 }}
                    refreshing={refreshing}
                    onRefresh={() => fetchClaimOrders(true)}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="receipt-outline" size={50} color="#ddd" />
                            <Text style={styles.emptyText}>{activeTab} 신청 및 처리 내역이 없습니다.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f2f2f2' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 10, fontSize: 14, color: '#666' },
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
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    backBtn: { padding: 8 },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        height: 48,
    },
    tabBtn: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
    },
    activeTabBtn: {
        borderBottomColor: '#0073e9',
    },
    tabText: { fontSize: 14, color: '#666', fontWeight: '600' },
    activeTabText: { color: '#0073e9', fontWeight: 'bold' },
    orderCard: { backgroundColor: '#fff', padding: 18, marginBottom: 15, borderRadius: 12 },
    orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingBottom: 10 },
    orderDate: { fontSize: 15, fontWeight: 'bold', color: '#333' },
    orderIdText: { fontSize: 11, color: '#999', marginTop: 2 },
    statusBadge: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
    statusBadgeText: { fontSize: 12, fontWeight: 'bold' },
    productRow: { flexDirection: 'row', marginBottom: 15, alignItems: 'center' },
    productImage: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#f9f9f9' },
    productInfo: { flex: 1, marginLeft: 12 },
    productName: { fontSize: 14, color: '#333', marginBottom: 4 },
    productPrice: { fontSize: 13, color: '#777' },
    priceSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#f5f5f5' },
    totalPriceLabel: { fontSize: 13, color: '#666', fontWeight: 'bold' },
    historyTotal: { fontSize: 16, fontWeight: 'bold', color: '#000' },
    emptyContainer: { alignItems: 'center', marginTop: 80 },
    emptyText: { marginTop: 15, fontSize: 15, color: '#888', fontWeight: '600' }
});

export default CancelReturnExchangeScreen;
