import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axiosInstance from '../api/axiosInstance';
import { BASE_URL, IMAGE_BASE_URL } from '../api/config';

const { width } = Dimensions.get('window');

const MapScreen = ({ navigation, route }) => {
    const [floors, setFloors] = useState([]);
    const [selectedFloor, setSelectedFloor] = useState(null);
    const [mapData, setMapData] = useState(null);
    const [markers, setMarkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMarker, setSelectedMarker] = useState(null);

    const lastHandledTargetKeyRef = useRef(null);

    const targetStoreId = route?.params?.targetStoreId || null;
    const targetFloor = route?.params?.targetFloor || null;
    const targetMarkerId = route?.params?.targetMarkerId || null;

    // 1. 서버에 존재하는 층 목록 가져오기
    useEffect(() => {
        const fetchFloors = async () => {
            try {
                const res = await axiosInstance.get('/api/map/floors');
                if (res.data.success && res.data.floors.length > 0) {
                    setFloors(res.data.floors);
                    setSelectedFloor(res.data.floors[0]); // 첫 번째 층을 기본 선택
                }
            } catch (error) {
                console.error('Fetch floors error:', error);
            }
        };
        fetchFloors();
    }, []);

    // 상품 상세 등에서 특정 층으로 진입한 경우 자동으로 층 선택
    useEffect(() => {
        if (!targetFloor) return;
        if (selectedFloor === targetFloor) return;
        setSelectedFloor(targetFloor);
    }, [targetFloor, selectedFloor]);

    // 2. 선택된 층의 지도와 핀 가져오기
    useEffect(() => {
        const fetchMapData = async (floor) => {
            if (!floor) return;
            try {
                setLoading(true);
                setSelectedMarker(null); // 층 변경 시 선택된 마커 초기화
                const res = await axiosInstance.get(`/api/map?floor=${floor}`);
                if (res.data.success) {
                    setMapData(res.data.floorPlanUrl);
                    setMarkers(res.data.markers || []);
                }
            } catch (error) {
                console.error('Fetch map data error:', error);
                setMapData(null);
                setMarkers([]);
            } finally {
                setLoading(false);
            }
        };

        fetchMapData(selectedFloor);
    }, [selectedFloor]);

    // 마커 로딩 후 targetStoreId와 일치하는 매장을 자동 선택
    useEffect(() => {
        if (!targetStoreId || !targetFloor) return;
        if (selectedFloor !== targetFloor) return;

        const key = `${targetStoreId}|${targetFloor}`;
        if (lastHandledTargetKeyRef.current === key) return;

        const match = (markers || []).find((m) => {
            const markerStoreId =
                m?.storeId?._id?.toString?.() ?? m?.storeId?.toString?.();
            return markerStoreId && markerStoreId === targetStoreId.toString();
        });

        if (match) {
            setSelectedMarker(match);
            lastHandledTargetKeyRef.current = key;
        }
    }, [markers, selectedFloor, targetStoreId, targetFloor]);

    // 3. targetMarkerId를 전달받은 경우 (NFC 위치 태그 스캔) 해당 마커 정보를 서버에서 실시간 조회하여 층 변경 및 핀 자동 하이라이트
    useEffect(() => {
        if (!targetMarkerId) return;

        const fetchMarkerInfo = async () => {
            try {
                setLoading(true);
                const res = await axiosInstance.get(`/api/map/markers/${targetMarkerId}`);
                if (res.data.success && res.data.marker) {
                    const marker = res.data.marker;
                    setSelectedFloor(marker.floor);
                    setSelectedMarker(marker);
                }
            } catch (error) {
                console.error('Fetch marker info error:', error);
                Alert.alert('알림', '해당 위치 정보를 불러오지 못했습니다.');
            } finally {
                setLoading(false);
            }
        };

        fetchMarkerInfo();
    }, [targetMarkerId]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>FLOOR GUIDE</Text>
                <Text style={styles.headerSub}>{selectedFloor ? `${selectedFloor}층 매장 안내` : '층 정보를 불러오는 중...'}</Text>
            </View>

            <View style={styles.mapContainer}>
                {/* 층별 선택 버튼 (왼쪽 사이드바 - DB 동적 생성) */}
                <View style={styles.sideBar}>
                    {floors.map((floor) => (
                        <TouchableOpacity
                            key={floor}
                            style={[styles.floorBtn, selectedFloor === floor && styles.activeFloorBtn]}
                            onPress={() => setSelectedFloor(floor)}
                        >
                            <Text style={[styles.floorText, selectedFloor === floor && styles.activeFloorText]}>{floor}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* 🗺️ 메인 맵 영역 (서버에서 가져온 도면 및 핀) */}
                <View style={styles.mapView}>
                    <View style={styles.mapWrapper}>
                        {loading ? (
                            <View style={styles.mapPlaceholder}>
                                <ActivityIndicator size="large" color="#2e7d32" />
                                <Text style={styles.mapHint}>지도를 불러오는 중...</Text>
                            </View>
                        ) : (
                            <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                                {mapData ? (
                                    <Image 
                                        source={{ uri: mapData.startsWith('http') ? mapData : `${IMAGE_BASE_URL}${mapData.startsWith('/') ? mapData : '/' + mapData}` }} 
                                        style={[styles.floorPlan, { position: 'absolute' }]} 
                                        resizeMode="contain"
                                    />
                                ) : (
                                    <View style={styles.mapPlaceholder}>
                                        <Ionicons name="map-outline" size={100} color="#f0f0f0" />
                                        <Text style={styles.mapHint}>{selectedFloor} 평면도가 등록되지 않았습니다.</Text>
                                    </View>
                                )}

                                {/* 📍 서버에서 가져온 매장 핀 포인트들 (지도가 없어도 표시) */}
                                {markers.map((marker) => {
                                    const isSelected = selectedMarker?._id === marker._id;
                                    return (
                                        <TouchableOpacity 
                                            key={marker._id}
                                            style={[styles.pin, { top: `${marker.y}%`, left: `${marker.x}%`, zIndex: isSelected ? 100 : 10 }]}
                                            onPress={() => setSelectedMarker(marker)}
                                        >
                                            <View style={[
                                                styles.pinCircle, 
                                                marker.type !== 'STORE' && { backgroundColor: '#FFD700' },
                                                isSelected && { 
                                                    backgroundColor: '#FF3B30', 
                                                    transform: [{ scale: 1.4 }], 
                                                    borderWidth: 3, 
                                                    borderColor: '#fff' 
                                                }
                                            ]} />
                                            <Text style={[styles.pinLabel, isSelected && { color: '#FF3B30', fontWeight: 'bold' }]}>
                                                {marker.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}
                    </View>
                </View>
            </View>

            {/* 🏢 현재 층 매장 리스트 (서버 핀 정보 기반) */}
            <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>{selectedFloor} 주요 매장</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.shopList}>
                    {markers.length > 0 ? markers.map((marker, i) => (
                        <TouchableOpacity 
                            key={i} 
                            style={styles.shopItem}
                            onPress={() => setSelectedMarker(marker)}
                        >
                            <Text style={styles.shopText}>{marker.label}</Text>
                        </TouchableOpacity>
                    )) : (
                        <Text style={{ color: '#ccc', fontSize: 12 }}>매장 정보가 없습니다.</Text>
                    )}
                </ScrollView>
            </View>

            {/* 📋 핀 클릭 시 등장하는 슬라이드형 하단 매장 정보 카드 */}
            {selectedMarker && (
                <View style={styles.bottomSheet}>
                    <TouchableOpacity 
                        style={styles.closeSheetBtn}
                        onPress={() => setSelectedMarker(null)}
                    >
                        <Ionicons name="close" size={20} color="#666" />
                    </TouchableOpacity>
                    <View style={styles.sheetContent}>
                        {selectedMarker.storeId?.imageUrl ? (
                            <Image 
                                source={{ uri: selectedMarker.storeId.imageUrl.startsWith('http') 
                                    ? selectedMarker.storeId.imageUrl 
                                    : `${IMAGE_BASE_URL}${selectedMarker.storeId.imageUrl.startsWith('/') ? '' : '/'}${selectedMarker.storeId.imageUrl}` 
                                }} 
                                style={styles.sheetImage}
                            />
                        ) : (
                            <View style={[styles.sheetImage, styles.sheetImageEmpty]}>
                                <Ionicons name="storefront-outline" size={30} color="#bbb" />
                            </View>
                        )}
                        <View style={styles.sheetTextContainer}>
                            <Text style={styles.sheetTitle} numberOfLines={1}>
                                {selectedMarker.storeId?.name || selectedMarker.label}
                            </Text>
                            <Text style={styles.sheetSubtitle}>
                                🕒 {selectedMarker.storeId?.hours || '10:00 - 22:00'}
                            </Text>
                            <Text style={styles.sheetLocation}>
                                📍 {selectedMarker.floor}층 ({selectedMarker.storeId?.locationCode || '미기재'})
                            </Text>
                        </View>
                    </View>
                    {selectedMarker.storeId && (
                        <TouchableOpacity 
                            style={styles.sheetButton}
                            onPress={() => {
                                setSelectedMarker(null);
                                if (selectedMarker.storeId?.type === 'STORE') {
                                    navigation.navigate('카테고리탭', {
                                        screen: 'Search',
                                        params: { query: selectedMarker.storeId.name, type: 'store', categoryId: selectedMarker.storeId._id },
                                    });
                                } else if (selectedMarker.storeId?.type === 'RESTAURANT') {
                                    navigation.navigate('Dining', { screen: 'RestaurantMenu', params: { restaurant: selectedMarker.storeId } });
                                }
                            }}
                        >
                            <Text style={styles.sheetButtonText}>매장 구경하러 가기 ➔</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { padding: 30, alignItems: 'center' },
    headerTitle: { fontSize: 22, fontWeight: '900', letterSpacing: 5 },
    headerSub: { fontSize: 10, color: '#aaa', marginTop: 10, letterSpacing: 2 },

    mapContainer: { flex: 1, flexDirection: 'row' },
    sideBar: { width: 70, borderRightWidth: 1.5, borderColor: '#f2f2f2', alignItems: 'center', paddingTop: 20 },
    floorBtn: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 20, backgroundColor: '#f9f9f9' },
    activeFloorBtn: { backgroundColor: '#000', elevation: 8 },
    floorText: { fontSize: 14, fontWeight: '900', color: '#ccc' },
    activeFloorText: { color: '#fff' },

    mapView: { flex: 1, padding: 20, position: 'relative' },
    mapWrapper: { flex: 1, backgroundColor: '#fdfdfd', borderRadius: 20, borderWidth: 1, borderColor: '#f0f0f0', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
    floorPlan: { width: '100%', height: '100%' },
    mapPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    mapHint: { fontSize: 11, color: '#ddd', marginTop: 20 },

    pin: { position: 'absolute', alignItems: 'center' },
    pinCircle: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#000', borderWidth: 2, borderColor: '#fff', elevation: 5 },
    pinLabel: { fontSize: 9, color: '#000', fontWeight: 'bold', marginTop: 4, backgroundColor: 'rgba(255,255,255,0.8)', paddingHorizontal: 4, borderRadius: 2 },

    infoCard: { height: 160, backgroundColor: '#fff', borderTopWidth: 1.5, borderColor: '#f2f2f2', padding: 25 },
    infoTitle: { fontSize: 14, fontWeight: '900', color: '#111', marginBottom: 15 },
    shopList: { flexDirection: 'row' },
    shopItem: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#f9f9f9', borderRadius: 10, marginRight: 12, height: 45, justifyContent: 'center' },
    shopText: { fontSize: 13, color: '#000', fontWeight: '500' },

    // 📋 Slide Bottom Sheet Styles
    bottomSheet: {
        position: 'absolute',
        bottom: 25,
        left: 20,
        right: 20,
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 15,
        elevation: 10,
        borderWidth: 1,
        borderColor: '#f2f2f2',
        zIndex: 9999
    },
    closeSheetBtn: {
        position: 'absolute',
        top: 15,
        right: 15,
        zIndex: 10,
        padding: 4
    },
    sheetContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15
    },
    sheetImage: {
        width: 65,
        height: 65,
        borderRadius: 16,
        marginRight: 15,
        backgroundColor: '#f9f9f9'
    },
    sheetImageEmpty: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e8e8e8',
        borderStyle: 'dashed'
    },
    sheetTextContainer: {
        flex: 1,
        justifyContent: 'center'
    },
    sheetTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: '#1a1f27',
        marginBottom: 4,
        paddingRight: 15
    },
    sheetSubtitle: {
        fontSize: 11,
        color: '#8b95a1',
        marginBottom: 2
    },
    sheetLocation: {
        fontSize: 12,
        color: '#3182f6',
        fontWeight: '800'
    },
    sheetButton: {
        backgroundColor: '#1a1f27',
        borderRadius: 14,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center'
    },
    sheetButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '800'
    }
});

export default MapScreen;
