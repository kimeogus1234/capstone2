import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const POLICY_CONTENT = {
  customer: {
    title: '고객 센터',
    body: [
      '문의: support@madangm.example',
      '운영시간: 10:00 - 18:00 (주말/공휴일 제외)',
      '',
      '앱 내 문의가 어려우면 이메일로 주문번호/연락처를 함께 보내주세요.'
    ].join('\n')
  },
  terms: {
    title: '서비스 이용약관',
    body: [
      '이 화면은 앱 내 정책 안내를 위한 기본 페이지입니다.',
      '',
      '실제 약관 전문/버전 관리가 필요하면 웹 링크 또는 CMS 연동으로 교체하는 것을 권장합니다.'
    ].join('\n')
  },
  privacy: {
    title: '개인정보 처리방침',
    body: [
      '개인정보 처리방침 요약 안내 페이지입니다.',
      '',
      '수집 항목, 이용 목적, 보관 기간, 제3자 제공 여부 등을 최신 상태로 유지해야 합니다.'
    ].join('\n')
  },
  finance: {
    title: '전자금융거래 약관',
    body: [
      '전자금융거래 약관 안내 페이지입니다.',
      '',
      '결제/환불/분쟁 처리 관련 내용은 실제 서비스 정책에 맞게 업데이트해야 합니다.'
    ].join('\n')
  }
};

const PolicyScreen = ({ navigation, route }) => {
  const type = route?.params?.type || 'terms';

  const content = useMemo(() => {
    return POLICY_CONTENT[type] || POLICY_CONTENT.terms;
  }, [type]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>{content.title}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.body}>{content.body}</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '900', color: '#111' },
  content: { padding: 18 },
  body: { fontSize: 13, lineHeight: 20, color: '#333' }
});

export default PolicyScreen;
