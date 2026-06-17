import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Alert, Modal, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, SafeAreaView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Postcode from '@actbase/react-daum-postcode';
import userApi from '../api/userApi';
import { normalizeAddressList } from '../utils/addressUtils';

const AddressScreen = ({ navigation, route }) => {
    const isSelectMode = route.params?.isSelectMode;
    const onSelectAddress = route.params?.onSelectAddress;
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isModalVisible, setModalVisible] = useState(false);
    const [isPostcodeVisible, setPostcodeVisible] = useState(false);
    const [newName, setNewName] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [newBase, setNewBase] = useState('');
    const [newDetail, setNewDetail] = useState('');
    const [editingId, setEditingId] = useState(null);

    const fetchAddresses = async () => {
        try {
            setLoading(true);
            const res = await userApi.getAddresses();
            if (res.success && Array.isArray(res.addresses)) {
                setAddresses(normalizeAddressList(res.addresses));
            }
        } catch (error) {
            console.error("Failed to load addresses:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAddresses();
    }, []);

    const saveAddressesToDb = async (newAddressesList) => {
        try {
            await userApi.updateAddresses(newAddressesList);
        } catch (error) {
            console.error("Failed to save addresses:", error);
            Alert.alert("오류", "배송지 변경사항을 서버에 저장하지 못했습니다.");
        }
    };

    const handleAddAddress = () => {
        if (!newName || !newPhone || !newBase || !newDetail) {
            Alert.alert('알림', '모든 정보를 입력해주세요.');
            return;
        }

        let updatedAddresses = [];
        if (editingId) {
            updatedAddresses = addresses.map(a =>
                a.id === editingId
                    ? { ...a, name: newName, phone: newPhone, base: newBase, detail: newDetail }
                    : a
            );
        } else {
            const newAddress = {
                id: Math.random().toString(),
                name: newName,
                phone: newPhone,
                base: newBase,
                detail: newDetail,
                isDefault: addresses.length === 0, // 첫 배송지면 기본 배송지로
            };
            updatedAddresses = [...addresses, newAddress];
        }

        setAddresses(updatedAddresses);
        saveAddressesToDb(updatedAddresses);

        setEditingId(null);
        setModalVisible(false);

        // 폼 초기화
        setNewName('');
        setNewPhone('');
        setNewBase('');
        setNewDetail('');
    };

    const openEditModal = (item) => {
        setEditingId(item.id);
        setNewName(item.name);
        setNewPhone(item.phone);
        setNewBase(item.base);
        setNewDetail(item.detail);
        setModalVisible(true);
    };

    const openAddModal = () => {
        setEditingId(null);
        setNewName('');
        setNewPhone('');
        setNewBase('');
        setNewDetail('');
        setModalVisible(true);
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.addressCard}
            onPress={() => {
                if (isSelectMode) {
                    if (typeof onSelectAddress === 'function') {
                        onSelectAddress(item);
                    }
                    navigation.goBack();
                }
            }}
            disabled={!isSelectMode}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.nameText}>{item.name}</Text>
                {item.isDefault && (
                    <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>기본 배송지</Text>
                    </View>
                )}
            </View>
            <Text style={styles.infoText}>{item.phone}</Text>
            <Text style={styles.infoText}>{item.base} {item.detail}</Text>

            {!isSelectMode && (
            <View style={styles.cardActions}>
                {!item.isDefault && (
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => {
                            const updated = addresses.map(a => ({
                                ...a,
                                isDefault: a.id === item.id
                            }));
                            setAddresses(updated);
                            saveAddressesToDb(updated);
                            Alert.alert('알림', '기본 배송지로 설정되었습니다.');
                        }}
                    >
                        <Text style={styles.actionText}>기본 배송지 설정</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.actionBtn} onPress={() => openEditModal(item)}>
                    <Text style={styles.actionText}>수정</Text>
                </TouchableOpacity>
                {!item.isDefault && (
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => {
                            const updated = addresses.filter(a => a.id !== item.id);
                            setAddresses(updated);
                            saveAddressesToDb(updated);
                        }}
                    >
                        <Text style={[styles.actionText, { color: '#ff4d4d' }]}>삭제</Text>
                    </TouchableOpacity>
                )}
            </View>
            )}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>배송지 관리</Text>
                <View style={{ width: 40 }} />
            </View>
            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#2e7d32" />
                </View>
            ) : (
                <FlatList
                    data={addresses}
                    renderItem={renderItem}
                    keyExtractor={(item, index) => item.id || `addr_${index}`}
                    contentContainerStyle={{ padding: 15, paddingBottom: 100 }}
                    ListEmptyComponent={<Text style={styles.emptyText}>등록된 배송지가 없습니다.</Text>}
                />
            )}

            <View style={styles.bottomArea}>
                <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
                    <Ionicons name="add" size={20} color="#fff" />
                    <Text style={styles.addBtnText}>배송지 추가</Text>
                </TouchableOpacity>
            </View>

            <Modal visible={isModalVisible} animationType="slide" transparent={true}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{editingId ? '배송지 수정' : '새 배송지 추가'}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={26} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.formArea}>
                            <Text style={styles.label}>받는 사람</Text>
                            <TextInput style={styles.input} value={newName} onChangeText={setNewName} placeholder="이름 (예: 홍길동)" />

                            <Text style={styles.label}>휴대폰 번호</Text>
                            <TextInput style={styles.input} value={newPhone} onChangeText={setNewPhone} placeholder="010-0000-0000" keyboardType="phone-pad" />

                            <Text style={styles.label}>배송지 주소</Text>
                            <View style={styles.addressRow}>
                                <TextInput style={[styles.input, { flex: 1, marginRight: 10 }]} value={newBase} onChangeText={setNewBase} placeholder="도로명/지번 주소 (예: 서울 강남구)" />
                                <TouchableOpacity style={styles.searchBtn} onPress={() => setPostcodeVisible(true)}>
                                    <Text style={styles.searchBtnText}>주소 찾기</Text>
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.label}>상세 주소</Text>
                            <TextInput style={styles.input} value={newDetail} onChangeText={setNewDetail} placeholder="동/호수 등 상세 주소 입력" />
                        </ScrollView>

                        <TouchableOpacity style={styles.saveBtn} onPress={handleAddAddress}>
                            <Text style={styles.saveBtnText}>저장하기</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* 우편번호 검색 모달 (다음 주소록) */}
            <Modal visible={isPostcodeVisible} animationType="slide" transparent={false}>
                <View style={styles.postcodeModalContainer}>
                    <View style={styles.postcodeHeader}>
                        <TouchableOpacity onPress={() => setPostcodeVisible(false)} style={styles.postcodeCloseBtn}>
                            <Ionicons name="close" size={28} color="#333" />
                        </TouchableOpacity>
                        <Text style={styles.postcodeTitle}>우편번호 검색</Text>
                        <View style={{ width: 28 }} />
                    </View>
                    <Postcode
                        style={{ flex: 1, width: '100%', zIndex: 999 }}
                        jsOptions={{ animation: true, hideMapBtn: true }}
                        onSelected={(data) => {
                            let addr = data.roadAddress || data.jibunAddress;
                            if (data.buildingName) addr += ` (${data.buildingName})`;
                            setNewBase(addr);
                            setPostcodeVisible(false);
                        }}
                        onError={(err) => {
                            console.error(err);
                            Alert.alert('오류', '주소 검색 중 문제가 발생했습니다.');
                            setPostcodeVisible(false);
                        }}
                    />
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    backBtn: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#000' },
    addressCard: { backgroundColor: '#fff', padding: 20, marginBottom: 15, borderRadius: 12, elevation: 1 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    nameText: { fontSize: 17, fontWeight: 'bold', color: '#333', marginRight: 10 },
    defaultBadge: { backgroundColor: '#e8f5e9', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4, borderWidth: 1, borderColor: '#2e7d32' },
    defaultBadgeText: { fontSize: 11, color: '#2e7d32', fontWeight: 'bold' },
    infoText: { fontSize: 15, color: '#555', marginBottom: 5 },
    cardActions: { flexDirection: 'row', marginTop: 15, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 15 },
    actionBtn: { marginRight: 20 },
    actionText: { fontSize: 14, color: '#0073e9', fontWeight: 'bold' },
    emptyText: { textAlign: 'center', color: '#999', marginTop: 50 },
    bottomArea: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', elevation: 15 },
    addBtn: { backgroundColor: '#2e7d32', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 10 },
    addBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 5 },
    modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
    modalTitle: { fontSize: 18, fontWeight: 'bold' },
    formArea: { padding: 20 },
    label: { fontSize: 13, fontWeight: 'bold', color: '#444', marginBottom: 8, marginTop: 15 },
    input: { borderWidth: 1, borderColor: '#ddd', padding: 14, borderRadius: 8, fontSize: 15, backgroundColor: '#fafafa' },
    addressRow: { flexDirection: 'row', alignItems: 'center' },
    searchBtn: { backgroundColor: '#f0f0f0', borderWidth: 1, borderColor: '#ddd', paddingVertical: 14, paddingHorizontal: 15, borderRadius: 8, justifyContent: 'center' },
    searchBtnText: { fontSize: 14, color: '#333', fontWeight: 'bold' },
    saveBtn: { backgroundColor: '#2e7d32', padding: 18, alignItems: 'center', margin: 20, borderRadius: 10 },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    postcodeModalContainer: { flex: 1, backgroundColor: '#fff', paddingTop: Platform.OS === 'ios' ? 40 : 0 },
    postcodeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#fff' },
    postcodeCloseBtn: { padding: 5 },
    postcodeTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' }
});

export default AddressScreen;