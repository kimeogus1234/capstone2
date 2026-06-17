import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert, Platform, ActivityIndicator, Modal, TextInput, Image } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import productApi from '../api/productapi';
import { useAuth } from '../context/AuthContext'; // 👤 유저 정보 가져오기
import { usePaymentWidget, PaymentWidgetProvider, PaymentMethodWidget, AgreementWidget } from '@tosspayments/widget-sdk-react-native';
import { BASE_URL, IMAGE_BASE_URL } from '../api/config';
import userApi from '../api/userApi';
import { normalizeAddressList } from '../utils/addressUtils';

const TOSS_CLIENT_KEY = "test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm";
const CUSTOMER_KEY = "CUSTOMER_KEY_12345";
const PAYMENT_METHOD_SELECTOR = "payment-method";
const AGREEMENT_SELECTOR = "agreement";

const getFullUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const cleanPath = url.startsWith('/') ? url : `/uploads/${url}`;
    return `${IMAGE_BASE_URL}${cleanPath}`;
};

const CheckoutScreenInner = ({ navigation, route }) => {
    const { user, isLoggedIn } = useAuth(); // 👤 로그인된 유저 정보
    const [paymentMethod, setPaymentMethod] = useState('토스페이먼츠 (Toss)');
    const [loading, setLoading] = useState(false);
    const [showTossModal, setShowTossModal] = useState(false);
    const [paymentWidgetReady, setPaymentWidgetReady] = useState(false);
    const [agreementReady, setAgreementReady] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [isValidating, setIsValidating] = useState(false);
    const [orderMemo, setOrderMemo] = useState('문 앞에 두고 벨 눌러주세요!');
    const [rewardInfo, setRewardInfo] = useState({ met: [], upcoming: [] }); // 🎁 추가된 리워드 정보

    const items = route.params?.items || [];
    const totalPrice = items.reduce((sum, item) => sum + (item.price * (item.qty || item.quantity || 1)), 0);
    const [selectedAddress, setSelectedAddress] = useState(null);

    // 📍 초기 진입 시 기본 배송지 자동 로드
    useEffect(() => {
        const fetchDefaultAddress = async () => {
            try {
                const res = await userApi.getAddresses();
                if (res && res.success && Array.isArray(res.addresses)) {
                    const list = normalizeAddressList(res.addresses);
                    const defaultAddr = list.find(a => a.isDefault) || list[0];
                    if (defaultAddr) {
                        setSelectedAddress(defaultAddr);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch default address:", error);
            }
        };
        fetchDefaultAddress();
    }, []);

    // 📍 주소 선택 처리 (AddressScreen에서 돌아올 때)
    useEffect(() => {
        if (route.params?.selectedAddress) {
            setSelectedAddress(route.params.selectedAddress);
        }
    }, [route.params?.selectedAddress]);

    // 🎁 [NEW] 리워드 체크 로직 (최초 로드 및 금액 변경 시)
    useEffect(() => {
        const fetchRewards = async () => {
            try {
                const res = await productApi.coupon.checkRewards(items, totalPrice);
                if (!res.success) return;

                let met = res.met || [];
                let upcoming = res.upcoming || [];

                // 사용 완료 쿠폰은 결제창 리워드 배너에서 제외
                if (isLoggedIn) {
                    try {
                        const couponRes = await productApi.coupon.getCoupons();
                        if (couponRes?.success && Array.isArray(couponRes.data)) {
                            const availableIds = new Set(couponRes.data.map((c) => String(c._id)));
                            met = met.filter((r) => r.coupon && availableIds.has(String(r.coupon._id)));
                            upcoming = upcoming.filter((r) => availableIds.has(String(r.ruleId)));
                        }
                    } catch (_) { /* ignore */ }
                }

                setRewardInfo({ met, upcoming });
            } catch (err) {
                console.log("Reward Check Error:", err);
            }
        };
        fetchRewards();
    }, [totalPrice, isLoggedIn]);

    const paymentWidgetControl = usePaymentWidget();
    const paymentMethodsWidgetRef = useRef(null);
    const paymentAttemptRef = useRef(0);

    const closeTossModal = useCallback(() => {
        // Invalidate in-flight requestPayment() so late resolves don't keep "loading" or show success.
        paymentAttemptRef.current += 1;
        setLoading(false);
        setShowTossModal(false);
    }, []);

    // 🎫 쿠폰 적용 시 결제 금액 동기화
    useEffect(() => {
        if (paymentMethodsWidgetRef.current) {
            paymentMethodsWidgetRef.current.updateAmount(discountedPrice);
        }
    }, [discountedPrice]);

    // ⚡ [OPTIMIZE] 모달 슬라이드 애니메이션 완료 후 결제 위젯을 안전하게 로드하기 위해 400ms 지연 설정
    const [isModalReady, setIsModalReady] = useState(false);
    useEffect(() => {
        if (showTossModal) {
            const timer = setTimeout(() => setIsModalReady(true), 400);
            return () => clearTimeout(timer);
        } else {
            setIsModalReady(false);
            setPaymentWidgetReady(false);
            setAgreementReady(false);
            setLoading(false);
        }
    }, [showTossModal]);

    // 결제 수단 위젯 로드 완료 → renderPaymentMethods 호출
    const handlePaymentMethodLoad = useCallback(async () => {
        if (!isModalReady) return;
        try {
            const control = await paymentWidgetControl.renderPaymentMethods(
                PAYMENT_METHOD_SELECTOR,
                { value: discountedPrice, currency: 'KRW', country: 'KR' }
            );
            paymentMethodsWidgetRef.current = control;
            setPaymentWidgetReady(true);
        } catch (e) {
            console.error('renderPaymentMethods 오류:', e);
        }
    }, [paymentWidgetControl, discountedPrice, isModalReady]);

    // 약관 위젯 로드 완료 → renderAgreement 호출
    const handleAgreementLoad = useCallback(async () => {
        if (!isModalReady) return;
        try {
            await paymentWidgetControl.renderAgreement(AGREEMENT_SELECTOR);
            setAgreementReady(true);
        } catch (e) {
            console.error('renderAgreement 오류:', e);
        }
    }, [paymentWidgetControl, isModalReady]);

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;

        try {
            setIsValidating(true);
            const mappedItems = items.map(item => ({
                productId: item.productId?._id || item.productId,
                storeId: item.storeId,
                categoryId: item.categoryId || item.productId?.categoryId,
                price: item.price,
                quantity: item.qty || item.quantity || 1
            }));

            const result = await productApi.coupon.validateCoupon(couponCode.trim(), totalPrice, mappedItems);
            if (result.success) {
                setAppliedCoupon({ ...result.data, isSurprise: false });
                Alert.alert('성공', `${result.data.name}이 적용되었습니다.`);
            } else if (result) {
                setLoading(false);
                setShowTossModal(false);
                Alert.alert('寃곗젣 ?ㅽ뙣', 'Toss 寃곗젣 ?뱀씤??(paymentKey)瑜?諛쏆? 紐삵뻽?듬땲??. 寃곗젣瑜? ?ㅼ떆 ?쒕룄?댁＜?몄슂.');
            }
        } catch (error) {
            Alert.alert('오류', error.response?.data?.message || '쿠폰 적용에 실패했습니다.');
        } finally {
            setIsValidating(false);
        }
    };

    const handleApplyCouponByObject = async (coupon) => {
        if (!coupon) return Alert.alert('오류', '쿠폰 정보를 불러올 수 없습니다.');
        try {
            setIsValidating(true);
            const mappedItems = items.map(item => ({
                productId: item.productId?._id || item.productId,
                storeId: item.storeId,
                categoryId: item.categoryId || item.productId?.categoryId,
                price: item.price,
                quantity: item.qty || item.quantity || 1
            }));

            const result = await productApi.coupon.validateCoupon(coupon.code, totalPrice, mappedItems);
            if (result.success) {
                setAppliedCoupon({ ...result.data, isSurprise: true });
                Alert.alert('쿠폰 적용 완료', `-[${result.data.discount.toLocaleString()}원] 할인이 적용되었습니다!`);
            }
        } catch (error) {
            Alert.alert('오류', error.response?.data?.message || '쿠폰 적용에 실패했습니다.');
        } finally {
            setIsValidating(false);
        }
    };

    const discountedPrice = appliedCoupon ? Math.max(0, totalPrice - appliedCoupon.discount) : totalPrice;

    const executeOrder = async (paymentPayload = null) => {
        try {
            const orderData = {
                items: items.map(i => ({
                    productId: i.productId,
                    name: i.name,
                    price: i.price,
                    quantity: i.qty || i.quantity || 1,
                    image: i.image
                })),
                customerName: user?.name || "사용자",
                totalAmount: discountedPrice,
                shippingAddress: selectedAddress
                    ? `${selectedAddress.base} ${selectedAddress.detail}`
                    : "마당M 하남점 픽업 데스크",
                shippingPhone: selectedAddress?.phone || user?.phone || "010-0000-0000",
                paymentMethod: "토스페이먼츠 (Toss)",
                paymentProvider: paymentPayload?.paymentProvider,
                tossPaymentKey: paymentPayload?.tossPaymentKey,
                tossOrderId: paymentPayload?.tossOrderId,
                tossAmount: paymentPayload?.tossAmount,
                orderMemo: orderMemo,
                couponId: appliedCoupon?.id,
                discountAmount: appliedCoupon?.discount || 0
            };
            await productApi.order.createOrder(orderData);
            await productApi.cart.clearCart().catch(e => console.log("Cart clear failed:", e));
            return true;
        } catch (error) {
            console.error("Order Creation Error:", error);
            Alert.alert(
                '주문 등록 실패 ❌',
                error.response?.data?.message || error.response?.data?.error || error.message || '결제 승인 과정에 실패했거나 주문 정보를 등록할 수 없습니다.'
            );
            return false;
        }
    };

    const handleProcessPayment = () => {
        if (items.length === 0) {
            return Alert.alert('오류', '주문할 상품이 없습니다.');
        }
        if (!selectedAddress || !selectedAddress.base || !selectedAddress.detail || !selectedAddress.phone) {
            return Alert.alert(
                '배송 정보 입력 필요 🚚',
                '정확한 배송을 위해 배송지 주소와 상세 주소, 연락처가 기입된 기본 배송지를 먼저 선택/등록해 주세요.'
            );
        }
        setShowTossModal(true);
    };

    const handleTossPaymentSubmit = async () => {
        const attemptId = ++paymentAttemptRef.current;
        try {
            setLoading(true);
            const tossOrderId = "ORDER_" + new Date().getTime();
            const firstItemName = items[0]?.productId?.name || items[0]?.name || '상품 결제';
            console.log("💳 [TOSS_DEBUG] Initiating payment with TOSS_CLIENT_KEY:", TOSS_CLIENT_KEY);
            const result = await paymentWidgetControl.requestPayment({
                orderId: tossOrderId,
                orderName: items.length > 1 ? `${firstItemName} 외 ${items.length - 1}건` : firstItemName,
                customerName: user?.name || "사용자",
                successUrl: 'smartstore://success',
                failUrl: 'smartstore://fail',
            });

            if (attemptId !== paymentAttemptRef.current) return;

            const successData = result?.success;
            if (successData?.paymentKey) {
                const orderSuccess = await executeOrder({
                    paymentProvider: 'TOSS',
                    tossPaymentKey: successData.paymentKey,
                    tossOrderId: successData.orderId || tossOrderId,
                    tossAmount: typeof successData.amount === 'number' ? successData.amount : discountedPrice
                });
                setShowTossModal(false);
                setLoading(false);
                if (orderSuccess) {
                    Alert.alert(
                        '결제 완료 🎉',
                        '토스페이먼츠 결제가 성공적으로 완료되었습니다!',
                        [{ text: '주문내역 확인', onPress: () => navigation.navigate('OrderTrackingScreen') }]
                    );
                }
            } else if (result) {
                setLoading(false);
                setShowTossModal(false);
                const failMsg = result?.fail?.message || 'Toss 결제 승인 정보(paymentKey)를 받지 못했습니다. 결제를 다시 시도해주세요.';
                Alert.alert('결제 실패', failMsg);
            }
        } catch (error) {
            if (attemptId !== paymentAttemptRef.current) return;
            setLoading(false);
            console.log("Toss Payment Error/Cancel:", error);
            
            // ❌ 사용자가 취소(USER_CANCEL)했거나 뒤로 가기를 누른 경우 주문을 생성하지 않음
            if (error?.code === 'USER_CANCEL' || error?.message?.includes('cancel')) {
                Alert.alert('결제 취소', '결제가 취소되었습니다. 주문이 접수되지 않았습니다.');
            } else {
                Alert.alert('결제 실패', error?.message || '결제 진행 중 문제가 발생했습니다.');
            }
            if (attemptId !== paymentAttemptRef.current) return;
            setShowTossModal(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={26} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>주문/결제</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 150 }}>
                {/* 🏢 배송 정보 */}
                <View style={styles.section}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                        <Text style={styles.sectionLabel}>배송지</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Address', {
                            isSelectMode: true,
                            onSelectAddress: (addr) => setSelectedAddress(addr),
                        })}>
                            <Text style={{ fontSize: 12, color: '#3182F6', fontWeight: 'bold' }}>변경</Text>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                        style={styles.addressCard}
                        onPress={() => navigation.navigate('Address', {
                            isSelectMode: true,
                            onSelectAddress: (addr) => setSelectedAddress(addr),
                        })}
                    >
                        <Text style={styles.addressName}>
                            {selectedAddress ? selectedAddress.name : '마당M 매장 픽업'}
                            {!selectedAddress && <Text style={styles.addressBadge}>추천</Text>}
                        </Text>
                        <Text style={styles.addressDetail}>
                            {selectedAddress ? `${selectedAddress.base} ${selectedAddress.detail}` : '하남점 1층 중앙 안내데스크 (QR코드 제시)'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* 📝 배송 요청사항 */}
                <View style={styles.section}>
                    <Text style={[styles.sectionLabel, { marginBottom: 10 }]}>배송 요청사항</Text>
                    <TextInput
                        style={styles.memoInput}
                        placeholder="배송 요청사항을 입력해주세요"
                        placeholderTextColor="#ccc"
                        value={orderMemo}
                        onChangeText={setOrderMemo}
                    />
                </View>

                {/* 🛍️ 주문 상품 요약 (장바구니 스타일) */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>주문 상품 ({items.length}개)</Text>
                    <View style={styles.checkoutItemBox}>
                        {items.map((item, id) => {
                            const product = item.productId;
                            const productImage = product?.images?.main || (product?.images?.gallery?.[0]) || item.image || '';
                            const itemQty = item.qty || item.quantity || 1;

                            return (
                                <View key={id} style={styles.checkoutItemRow}>
                                     {getFullUrl(productImage) ? (
                                         <Image source={{ uri: getFullUrl(productImage) }} style={styles.checkoutItemImg} />
                                     ) : (
                                         <View style={[styles.checkoutItemImg, { backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee' }]} />
                                     )}
                                    <View style={styles.checkoutItemDetails}>
                                        <Text style={styles.checkoutItemName} numberOfLines={1}>
                                            {product?.name || item.name || '알 수 없는 상품'}
                                        </Text>
                                        {item.variantSku && (
                                            <Text style={styles.checkoutItemVariant}>옵션: {item.variantSku}</Text>
                                        )}
                                        <View style={styles.checkoutItemPriceQtyRow}>
                                            <Text style={styles.checkoutItemPrice}>
                                                {item.price?.toLocaleString()}원
                                            </Text>
                                            <Text style={styles.checkoutItemQty}>
                                                {itemQty}개
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* 🎫 쿠폰 입력 */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>쿠폰 할인</Text>
                    <View style={styles.couponInputWrapper}>
                        <TextInput
                            style={[styles.couponInput, appliedCoupon?.isSurprise && { color: '#999' }]}
                            placeholder={appliedCoupon?.isSurprise ? "깜짝 쿠폰 혜택 적용 중" : "쿠폰 코드를 입력하세요"}
                            placeholderTextColor="#ccc"
                            value={couponCode}
                            onChangeText={setCouponCode}
                            autoCapitalize="none"
                            editable={!appliedCoupon}
                        />
                        <TouchableOpacity
                            style={[styles.couponSearchBtn, appliedCoupon?.isSurprise && { opacity: 0.5 }]}
                            disabled={!!appliedCoupon?.isSurprise}
                            onPress={() => navigation.navigate('CouponBox', {
                                onSelectCoupon: (coupon) => {
                                    setCouponCode(coupon.code);
                                    handleApplyCouponByObject(coupon);
                                }
                            })}
                        >
                            <Ionicons name="list" size={20} color="#666" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.couponApplyBtn, (appliedCoupon || !couponCode) && { backgroundColor: '#eee' }]}
                            onPress={handleApplyCoupon}
                            disabled={!!appliedCoupon || !couponCode || isValidating}
                        >
                            {isValidating ? <ActivityIndicator size="small" color="#fff" /> :
                                <Text style={[styles.couponApplyText, (appliedCoupon || !couponCode) && { color: '#aaa' }]}>
                                    {appliedCoupon ? '적용됨' : '적용'}
                                </Text>}
                        </TouchableOpacity>
                    </View>
                    {appliedCoupon && (
                        <View style={styles.appliedBadge}>
                            <Text style={styles.appliedText}>-{appliedCoupon.discount.toLocaleString()}원 할인 적용 중</Text>
                            <TouchableOpacity onPress={() => { setAppliedCoupon(null); setCouponCode(''); }}>
                                <Ionicons name="close-circle" size={16} color="#FF3B30" />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* 🎁 [Baemin Style] 조건 달성 리워드 및 쿠폰 적용 */}
                {(rewardInfo.met.length > 0 || rewardInfo.upcoming.length > 0) && (
                    <View style={styles.rewardSection}>
                        {/* 🏆 달성 완료 (쿠폰 발급 완료) */}
                        {rewardInfo.met.map((reward, idx) => (
                            <View key={`met-${idx}`} style={styles.baeminBanner}>
                                <View style={styles.baeminIconBox}>
                                    <Text style={{fontSize: 24}}>🎉</Text>
                                </View>
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={styles.baeminTitle}>조건 달성 혜택 도착!</Text>
                                    <Text style={styles.baeminDesc}>{reward.message}</Text>
                                    <TouchableOpacity 
                                        style={styles.baeminApplyBtn}
                                        onPress={() => {
                                            if (reward.coupon) {
                                                setCouponCode(reward.coupon.code || '');
                                                handleApplyCouponByObject(reward.coupon);
                                            }
                                        }}
                                    >
                                        <Text style={styles.baeminApplyBtnText}>쿠폰 적용하고 할인받기</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}

                        {/* 📈 미션 진행 중 */}
                        {rewardInfo.upcoming.map((reward, idx) => (
                            <View key={`up-${idx}`} style={styles.baeminUpcomingCard}>
                                <Text style={styles.baeminUpcomingText}>
                                    <Text style={{ color: '#2AC1BC', fontWeight: '900' }}>{(reward.remaining || 0).toLocaleString()}원</Text> 더 추가하면 
                                    {"\n"}<Text style={{ fontWeight: 'bold', color: '#333' }}>특별 할인 쿠폰</Text>을 드려요!
                                </Text>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>

            <View style={styles.checkoutFooter}>
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>주문 총액</Text>
                    <View style={{ alignItems: 'flex-end' }}>
                        {appliedCoupon && (
                            <Text style={styles.originalPrice}>{totalPrice.toLocaleString()}원</Text>
                        )}
                        <Text style={styles.totalAmount}>{discountedPrice.toLocaleString()}원</Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={[styles.oneTouchBtn, loading && { backgroundColor: '#666' }]}
                    activeOpacity={0.8}
                    onPress={handleProcessPayment}
                    disabled={loading || showTossModal}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.oneTouchText}>{discountedPrice.toLocaleString()}원 결제하기</Text>
                    )}
                </TouchableOpacity>
            </View>

            <Modal visible={showTossModal} animationType="slide" transparent={false} onRequestClose={closeTossModal}>
                <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
                    <View style={styles.tossHeader}>
                        <TouchableOpacity onPress={closeTossModal}>
                            <Ionicons name="close" size={28} color="#000" />
                        </TouchableOpacity>
                        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>결제하기</Text>
                        <View style={{ width: 28 }} />
                    </View>

                    <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                        {isModalReady && (
                            <>
                                <PaymentMethodWidget
                                    selector={PAYMENT_METHOD_SELECTOR}
                                    onLoadEnd={handlePaymentMethodLoad}
                                />
                                <AgreementWidget
                                    selector={AGREEMENT_SELECTOR}
                                    onLoadEnd={handleAgreementLoad}
                                />
                            </>
                        )}

                        <TouchableOpacity
                            style={[styles.tossRealPayBtn, (!paymentWidgetReady || loading) && { backgroundColor: '#aaa' }]}
                            onPress={handleTossPaymentSubmit}
                            disabled={!paymentWidgetReady || loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.tossRealPayBtnText}>{discountedPrice.toLocaleString()}원 결제 요청</Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: {
        height: 60, paddingHorizontal: 20, flexDirection: 'row',
        alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: '#f2f2f2'
    },
    headerTitle: { fontSize: 18, fontWeight: '900', color: '#333' },

    section: { paddingHorizontal: 25, marginTop: 30 },
    sectionLabel: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 12 },

    addressCard: { backgroundColor: '#f9f9f9', padding: 20, borderRadius: 12 },
    addressName: { fontSize: 16, fontWeight: 'bold', color: '#000', marginBottom: 8 },
    addressBadge: { fontSize: 10, backgroundColor: '#111', color: '#fff', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4, overflow: 'hidden' },
    addressDetail: { fontSize: 13, color: '#888', lineHeight: 18 },
    memoInput: { backgroundColor: '#f9f9f9', borderRadius: 8, padding: 12, fontSize: 13, color: '#333', borderWidth: 1, borderColor: '#eee' },
    
    // 장바구니 스타일 아이템 리스트 스타일
    checkoutItemBox: { backgroundColor: '#fff', borderRadius: 12 },
    checkoutItemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
    checkoutItemImg: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#f0f0f0' },
    checkoutItemDetails: { flex: 1, marginLeft: 15 },
    checkoutItemName: { fontSize: 14, fontWeight: 'bold', color: '#333' },
    checkoutItemVariant: { fontSize: 11, color: '#888', marginTop: 2 },
    checkoutItemPriceQtyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 },
    checkoutItemPrice: { fontSize: 14, fontWeight: '900', color: '#000' },
    checkoutItemQty: { fontSize: 13, color: '#666', fontWeight: 'bold' },

    couponInputWrapper: { flexDirection: 'row', backgroundColor: '#f9f9f9', borderRadius: 12, height: 50, alignItems: 'center', paddingHorizontal: 15 },
    couponInput: { flex: 1, fontSize: 14, color: '#000', fontWeight: '600' },
    couponSearchBtn: { padding: 10, marginRight: 5 },
    couponApplyBtn: { backgroundColor: '#111', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
    couponApplyText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    appliedBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 10, alignSelf: 'flex-start', backgroundColor: '#FFF0F0', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
    appliedText: { color: '#FF3B30', fontSize: 12, fontWeight: 'bold', marginRight: 5 },
    originalPrice: { fontSize: 14, color: '#aaa', textDecorationLine: 'line-through', marginBottom: 2 },

    checkoutFooter: {
        padding: 20, backgroundColor: '#fff', borderRadius: 20,
        margin: 20,
        shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 15
    },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    totalLabel: { fontSize: 14, color: '#888' },
    totalAmount: { fontSize: 24, fontWeight: '900', color: '#000' },
    oneTouchBtn: { height: 60, backgroundColor: '#111', borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
    oneTouchText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

    tossHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderColor: '#eee' },
    tossRealPayBtn: { backgroundColor: '#3182F6', padding: 18, borderRadius: 12, alignItems: 'center', marginHorizontal: 20, marginTop: 10 },
    tossRealPayBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

    // 🎁 리워드 배달의 민족 스타일
    rewardSection: { paddingHorizontal: 20, marginTop: 15, marginBottom: 10 },
    baeminBanner: { 
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#F6F9FA', 
        padding: 18, borderRadius: 12, marginBottom: 10,
        borderWidth: 1, borderColor: '#E8F3F4'
    },
    baeminIconBox: { justifyContent: 'center', alignItems: 'center' },
    baeminTitle: { fontSize: 14, color: '#333', fontWeight: 'bold', marginBottom: 4 },
    baeminDesc: { fontSize: 13, color: '#666', marginBottom: 10, lineHeight: 18 },
    baeminApplyBtn: { backgroundColor: '#2AC1BC', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8, alignSelf: 'flex-start' },
    baeminApplyBtnText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
    
    baeminUpcomingCard: { 
        backgroundColor: '#FFF', padding: 18, borderRadius: 12, marginBottom: 10,
        borderWidth: 1, borderColor: '#EEE', borderStyle: 'dashed'
    },
    baeminUpcomingText: { fontSize: 14, color: '#555', lineHeight: 22, textAlign: 'center' },
});

const CheckoutScreen = (props) => (
    <PaymentWidgetProvider clientKey={TOSS_CLIENT_KEY} customerKey={CUSTOMER_KEY}>
        <CheckoutScreenInner {...props} />
    </PaymentWidgetProvider>
);

export default CheckoutScreen;
