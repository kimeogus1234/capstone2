import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

/** ⭐️ 프리미엄 실시간 리뷰 시스템 */
export const ReviewSummary = ({ reviews = [], onWriteReview }) => {
  // 💡 데이터가 없을 때의 기본값 처리
  const displayReviews = reviews.length > 0 ? reviews : [];

  // 별점 평균 계산 (리뷰가 있을 때만)
  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>구매 후기 ({reviews.length}건)</Text>
        <TouchableOpacity>
          <Text style={styles.allReviewsBtn}>전체보기</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryContainer}>
        <View style={styles.totalScoreBox}>
          <Text style={styles.scoreText}>{averageRating}</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map(i => (
              <Ionicons key={i} name="star" size={14} color={i <= Math.round(averageRating) ? "#000" : "#eee"} />
            ))}
          </View>
          <Text style={styles.satisfactionText}>리얼 유저의 생생한 후기</Text>
        </View>

        <View style={styles.graphBox}>
          <Text style={styles.introText}>백화점 퀄리티 그대로{"\n"}고객님들이 직접 남겨주신{"\n"}소중한 리뷰입니다.</Text>
        </View>
      </View>

      {/* 💬 실시간 리뷰 목록 (DB 연동) */}
      <View style={styles.reviewList}>
        {displayReviews.length > 0 ? (
          displayReviews.map((review, index) => (
            <View key={review._id || index} style={styles.reviewItem}>
              <View style={styles.itemHeader}>
                <View style={styles.miniStars}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <Ionicons key={i} name="star" size={10} color={i <= review.rating ? "#000" : "#f2f2f2"} />
                  ))}
                </View>
                <Text style={styles.userId}>{review.user_name || '익명'} <Text style={styles.verified}>구매인증</Text></Text>
                <Text style={styles.dateText}>{review.created_at ? new Date(review.created_at).toLocaleDateString() : '최근'}</Text>
              </View>
              <Text style={styles.commentContent}>{review.content}</Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-ellipses-outline" size={40} color="#eee" />
            <Text style={styles.emptyText}>아직 작성된 리뷰가 없습니다.{"\n"}첫 번째 후기의 주인공이 되어보세요!</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={styles.writeReviewBtn}
        activeOpacity={0.8}
        onPress={onWriteReview}
      >
        <Text style={styles.writeReviewText}>직접 리뷰 작성하기</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: 25, paddingVertical: 45, backgroundColor: '#fff', borderTopWidth: 10, borderColor: '#f9f9f9' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#111' },
  allReviewsBtn: { fontSize: 13, color: '#bbb' },

  summaryContainer: { flexDirection: 'row', paddingBottom: 40, borderBottomWidth: 1, borderBottomColor: '#f4f4f4' },
  totalScoreBox: { width: '40%', alignItems: 'center', borderRightWidth: 1, borderColor: '#eee', paddingRight: 10 },
  scoreText: { fontSize: 38, fontWeight: '900', color: '#000', marginBottom: 5 },
  starsRow: { flexDirection: 'row', marginBottom: 10 },
  satisfactionText: { fontSize: 10, color: '#aaa', fontWeight: 'bold' },

  graphBox: { flex: 1, paddingLeft: 20, justifyContent: 'center' },
  introText: { fontSize: 12, color: '#666', lineHeight: 20, fontWeight: '500' },

  reviewList: { marginTop: 10 },
  reviewItem: { paddingVertical: 25, borderBottomWidth: 1, borderBottomColor: '#f9f9f9' },
  itemHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  miniStars: { flexDirection: 'row', marginRight: 10 },
  userId: { fontSize: 12, fontWeight: 'bold', color: '#222' },
  verified: { fontSize: 8, color: '#999', marginLeft: 5, fontWeight: 'bold' },
  dateText: { fontSize: 11, color: '#ccc', marginLeft: 'auto' },
  commentContent: { fontSize: 14, color: '#444', lineHeight: 24 },

  emptyContainer: { paddingVertical: 50, alignItems: 'center' },
  emptyText: { fontSize: 13, color: '#ccc', textAlign: 'center', marginTop: 15, lineHeight: 22 },

  writeReviewBtn: { height: 56, backgroundColor: '#000', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 40 },
  writeReviewText: { color: '#fff', fontSize: 16, fontWeight: '900' },
});