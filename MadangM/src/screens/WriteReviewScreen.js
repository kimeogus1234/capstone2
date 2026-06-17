import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, ScrollView, Alert, Image, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import productApi from '../api/productapi';

const WriteReviewScreen = ({ navigation, route }) => {
    // 상품 상세에서 넘겨준 파라미터 수신 (ID 포함)
    const { productId, productName } = route.params || {};
    const { user } = useAuth(); // 로그인 정보 가져오기

    const [rating, setRating] = useState(5);
    const [reviewText, setReviewText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedPhotos, setSelectedPhotos] = useState([]); // 사진 목록 관리

    const renderStars = () => {
        let stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <TouchableOpacity key={i} onPress={() => setRating(i)}>
                    <Ionicons
                        name={i <= rating ? "star" : "star-outline"}
                        size={40}
                        color={i <= rating ? "#000" : "#ddd"}
                        style={{ marginHorizontal: 5 }}
                    />
                </TouchableOpacity>
            );
        }
        return stars;
    };

    /** 📸 사진 선택 시뮬레이션 (라이브러리 미설치 대비 우선 예시 주소 추가) */
    const handleAddPhoto = () => {
        // 실제 연동 시: launchImageLibrary 호출 자리
        Alert.alert('사진 라이브러리', '갤러리에서 사진을 선택합니다.', [
            { text: '취소' },
            {
                text: '예시 사진 추가',
                onPress: () => setSelectedPhotos([...selectedPhotos, 'https://images.unsplash.com/photo-1595166300481-6e8ca375ba73?q=80'])
            }
        ]);
    };

    /** ✍️ 실제 리뷰 데이터 서버 전송 */
    const handleSubmit = async () => {
        if (!productId) {
            Alert.alert('오류', '상품 정보가 없습니다.');
            return;
        }
        if (reviewText.trim().length < 5) {
            Alert.alert('알림', '리뷰를 5자 이상 작성해주세요.');
            return;
        }

        try {
            setIsSubmitting(true);
            const reviewData = {
                product_id: productId,
                user_email: user?.email || "guest@example.com",
                user_name: user?.name || "익명 쇼퍼",
                rating: rating,
                content: reviewText,
                media: selectedPhotos.map(url => ({ url })) // 사진 배열 포함
            };

            console.log("📤 리뷰 전송 시작:", reviewData);
            await productApi.submitReview(reviewData);

            Alert.alert('성공', '소중한 후기가 등록되었습니다!', [
                { text: '확인', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error("❌ 리뷰 등록 실패:", error);
            Alert.alert('실패', '서버 통신 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>후기 작성</Text>
                <View style={{ width: 40 }} />
            </View>
            <ScrollView contentContainerStyle={{ padding: 25 }}>

                {/* 🏷️ 상품 정보 */}
                <View style={styles.productRow}>
                    <View style={styles.productBadge}><Text style={styles.badgeText}>REVIEW</Text></View>
                    <Text style={styles.productTitle}>{productName || '상품명 없음'}</Text>
                    <Text style={styles.productSubtitle}>상품 품질은 어떠셨나요?</Text>
                </View>

                {/* ⭐ 별점 선택 */}
                <View style={styles.ratingContainer}>
                    <View style={styles.starsRow}>{renderStars()}</View>
                    <Text style={styles.ratingDesc}>
                        {rating === 5 ? '품질이 매우 뛰어납니다!' : rating === 4 ? '만족스러운 품질이에요' : '보통이에요'}
                    </Text>
                </View>

                {/* 📸 사진 첨부 (활성화됨) */}
                <View style={styles.photoContainer}>
                    <Text style={styles.sectionLabel}>사진 첨부 ({selectedPhotos.length}/10)</Text>
                    <View style={styles.photoList}>
                        <TouchableOpacity style={styles.photoBox} onPress={handleAddPhoto}>
                            <Ionicons name="camera-outline" size={30} color="#999" />
                        </TouchableOpacity>
                        {selectedPhotos.map((uri, i) => (
                            <Image key={i} source={{ uri }} style={styles.previewImage} />
                        ))}
                    </View>
                </View>

                {/* 📝 상세 리뷰 */}
                <View style={styles.textContainer}>
                    <Text style={styles.sectionLabel}>상세한 후기를 들려주세요</Text>
                    <TextInput
                        style={styles.textArea}
                        placeholder="이 상품을 구매하려는 분들께 큰 도움이 됩니다!"
                        placeholderTextColor="#ccc"
                        multiline
                        value={reviewText}
                        onChangeText={setReviewText}
                    />
                </View>
            </ScrollView>

            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={[styles.submitBtn, reviewText.length >= 5 ? styles.submitBtnActive : null]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>프리미엄 후기 등록</Text>}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    backBtn: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#000' },
    productRow: { alignItems: 'center', marginBottom: 40 },
    productBadge: { backgroundColor: '#f2f2f2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 5, marginBottom: 10 },
    badgeText: { fontSize: 10, fontWeight: '900', color: '#999' },
    productTitle: { fontSize: 22, fontWeight: '900', color: '#111', marginBottom: 10 },
    productSubtitle: { fontSize: 14, color: '#aaa' },

    ratingContainer: { alignItems: 'center', marginBottom: 40 },
    starsRow: { flexDirection: 'row', marginBottom: 15 },
    ratingDesc: { fontSize: 15, color: '#000', fontWeight: 'bold' },

    photoContainer: { marginBottom: 40 },
    sectionLabel: { fontSize: 16, fontWeight: '900', color: '#111', marginBottom: 15 },
    photoList: { flexDirection: 'row', flexWrap: 'wrap' },
    photoBox: { width: 85, height: 85, borderWith: 1, borderColor: '#f2f2f2', backgroundColor: '#f9f9f9', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    previewImage: { width: 85, height: 85, borderRadius: 12, marginRight: 10 },

    textContainer: { marginBottom: 30 },
    textArea: { backgroundColor: '#fdfdfd', borderWidth: 1, borderColor: '#f2f2f2', borderRadius: 15, padding: 20, fontSize: 15, minHeight: 180, textAlignVertical: 'top' },

    bottomBar: { padding: 25, borderTopWidth: 1, borderColor: '#f2f2f2' },
    submitBtn: { height: 60, backgroundColor: '#eee', borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
    submitBtnActive: { backgroundColor: '#000' },
    submitBtnText: { color: '#fff', fontSize: 17, fontWeight: '900' }
});

export default WriteReviewScreen;
