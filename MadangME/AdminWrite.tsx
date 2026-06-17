import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, ActivityIndicator, Alert, Modal, SectionList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NfcManager, { NfcTech, Ndef } from 'react-native-nfc-manager';
import QRCode from 'react-native-qrcode-svg';
import { API_URL } from './config';



const AdminWrite = ({ onBack, token }: any) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [expandedStores, setExpandedStores] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('상품을 선택하세요');
  const [nfcState, setNfcState] = useState<'supported' | 'unsupported' | 'disabled'>('supported');
  const [statusColor, setStatusColor] = useState('#3182F6'); // 블루 기본
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<{ type: 'all' | 'store' | 'category', storeId?: string, categoryId?: string }>({ type: 'all' });
  const [customAlert, setCustomAlert] = useState<{ title: string; message: string; buttons: Array<{ text: string; onPress: () => void }> } | null>(null);

  useEffect(() => {
    fetchSummary();
    const initNfc = async () => {
      try {
        const supported = await NfcManager.isSupported();
        if (!supported) {
          setNfcState('unsupported');
          setStatus('NFC 미지원 기기 ⚠️ (대신 QR코드를 이용해 주세요)');
          setStatusColor('#F04452');
          return;
        }
        await NfcManager.start();
        const enabled = await NfcManager.isEnabled();
        if (!enabled) {
          setNfcState('disabled');
          setStatus('NFC 기능 꺼짐 ⚠️ (설정에서 NFC를 활성화해주세요)');
          setStatusColor('#FF9500');
          return;
        }
        setNfcState('supported');
      } catch (err) {
        setNfcState('unsupported');
        setStatus('NFC 센서 초기화 실패 ✕');
        setStatusColor('#F04452');
      }
    };
    initNfc();
    return () => {
      NfcManager.cancelTechnologyRequest().catch(() => 0);
    };
  }, []);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/products/summary`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('서버 응답 없음');

      const data = await response.json();
      setCategories(data.categories || []);
      setProducts(data.products || []);
      setStatus('발행할 상품을 아래 목록에서 선택하세요 📡');
      setStatusColor('#3182F6');
    } catch (e) {
      console.error(e);
      setStatus('서버 연결 실패 ⚠️');
      setStatusColor('#F04452');
    } finally {
      setLoading(false);
    }
  };

  const registerTagToBackend = async (productId: string, nfcUid: string) => {
    try {
      const res = await fetch(`${API_URL}/products/${productId}/nfc`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ nfc_uid: nfcUid })
      });
      return res.ok;
    } catch (e) {
      console.error('NFC 등록 실패:', e);
      return false;
    }
  };

  async function writeTag(product: any) {
    console.log('NFC 쓰기 버튼 클릭됨:', product?.name, '현재 nfcState:', nfcState);
    if (nfcState === 'unsupported') {
      setCustomAlert({
        title: 'NFC 미지원 단말기 ✕',
        message: '이 단말기는 NFC 하드웨어를 지원하지 않습니다. 대신 [QR 코드] 기능을 이용해 주세요.',
        buttons: [{ text: '확인', onPress: () => {} }]
      });
      return;
    }
    if (nfcState === 'disabled') {
      setCustomAlert({
        title: 'NFC 기능 비활성화 ⚠️',
        message: '현재 기기의 NFC 기능이 꺼져 있습니다. 시스템 설정창으로 이동하여 활성화하시겠습니까?',
        buttons: [
          { text: '취소', onPress: () => {} },
          { text: '설정창 열기', onPress: () => NfcManager.goToNfcSetting().catch(() => 0) }
        ]
      });
      return;
    }

    try {
      setStatus(`[${product.name}] NFC 태그 인식 대기 중... 📡`);
      setStatusColor('#FF9500'); // 오렌지: 진행 중
      
      await NfcManager.requestTechnology(NfcTech.Ndef);

      const tag = await NfcManager.getTag();
      const nfcUid = tag?.id || '';

      const appUrl = `smartstore://nfc/product/${product._id}`;
      const price = product.base_price || product.price || 0;
      const quantity = product.total_stock || product.variants?.[0]?.stock_quantity || 0;
      const textData = `${product.name}:${price}:${quantity}`;
      const messages = [
        Ndef.uriRecord(appUrl),
        Ndef.textRecord(textData)
      ];
      const bytes = Ndef.encodeMessage(messages);

      await NfcManager.ndefHandler.writeNdefMessage(bytes);

      // 백엔드에 NFC UID 연동 등록
      const regSuccess = await registerTagToBackend(product._id, nfcUid);

      if (regSuccess) {
        setCustomAlert({
          title: '발행 성공 🎉',
          message: 'NFC 태그 기록 및 시스템 등록이 완료되었습니다.',
          buttons: [{ text: '확인', onPress: () => {} }]
        });
        setStatus('태그 발행 성공 ✅');
        setStatusColor('#00D166'); // 초록
      } else {
        setCustomAlert({
          title: '시스템 경고 ⚠️',
          message: 'NFC 태그는 입력되었으나 시스템 데이터베이스 등록에 실패했습니다. 관리자에게 문의하세요.',
          buttons: [{ text: '확인', onPress: () => {} }]
        });
        setStatus('태그 입력완료 (DB 오류) ⚠️');
        setStatusColor('#FF9500');
      }
    } catch (ex) {
      console.log(ex);
      setCustomAlert({
        title: '오류 ✕',
        message: 'NFC 태그 기록에 실패했습니다. 다시 시도해 주세요.',
        buttons: [{ text: '확인', onPress: () => {} }]
      });
      setStatus('발행 실패 ✕');
      setStatusColor('#F04452');
    } finally {
      NfcManager.cancelTechnologyRequest().catch(() => 0);
    }
  }

  const showQR = (product: any) => {
    console.log('QR 코드 버튼 클릭됨:', product?.name);
    setSelectedProduct(product);
    setQrModalVisible(true);
  };

  const storeCategoryTree = React.useMemo(() => {
    const tree: any = {};
    const catMap: any = {};
    categories.forEach((c: any) => { catMap[c._id.toString()] = c; });

    products.forEach((p: any) => {
      const store = p.storeId;
      if (!store) return;
      const sId = store._id.toString();
      if (!tree[sId]) {
        tree[sId] = { store, categories: {} };
      }
      
      const pCatId = p.category?._id || p.category;
      if (pCatId) {
        const cId = pCatId.toString();
        if (!tree[sId].categories[cId]) {
          tree[sId].categories[cId] = catMap[cId] || { _id: cId, name: p.category?.name || '미분류' };
        }
      }
    });

    return Object.values(tree).map((node: any) => ({
      store: node.store,
      categories: Object.values(node.categories)
    }));
  }, [products, categories]);

  const displayProducts = React.useMemo(() => {
    const sectionsMap: any = {};
    const catMap: any = {};
    categories.forEach((c: any) => { catMap[c._id.toString()] = c.name; });

    let filteredProducts = products;
    if (selectedFilter.type === 'store' && selectedFilter.storeId) {
      filteredProducts = products.filter((p: any) => p.storeId?._id?.toString() === selectedFilter.storeId);
    } else if (selectedFilter.type === 'category' && selectedFilter.categoryId) {
      filteredProducts = products.filter((p: any) => 
        p.storeId?._id?.toString() === selectedFilter.storeId && 
        (p.category?._id?.toString() || p.category?.toString()) === selectedFilter.categoryId
      );
    }

    filteredProducts.forEach((p: any) => {
      const pCatId = p.category?._id || p.category || 'unassigned';
      const catName = p.category?.name || catMap[pCatId] || '미분류';
      const storeName = p.storeId?.name || '미지정 매장';
      
      const sectionTitle = `${storeName} > ${catName}`;
      if (!sectionsMap[sectionTitle]) sectionsMap[sectionTitle] = [];
      sectionsMap[sectionTitle].push(p);
    });

    return Object.keys(sectionsMap).map(key => ({
      title: key,
      data: sectionsMap[key]
    }));
  }, [products, categories, selectedFilter]);

  return (
    <SafeAreaView style={styles.container}>
      {/* 상단 통제 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCategoryModalVisible(true)} style={styles.hamburgerBtn} activeOpacity={0.7}>
          <Text style={styles.hamburgerText}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.title}>태그 발행용 관제</Text>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backText}>종료</Text>
        </TouchableOpacity>
      </View>

      {/* 스마트 NFC 인코더 콘솔 패널 느낌의 상태창 */}
      <View style={styles.consolePanel}>
        <View style={styles.consoleHeader}>
          <View style={[styles.ledIndicator, { backgroundColor: statusColor }]} />
          <Text style={styles.consoleLabel}>NFC / QR ENCODER STATUS</Text>
        </View>
        <Text style={[styles.statusText, { color: statusColor }]}>{status}</Text>
      </View>

      <TouchableOpacity onPress={fetchSummary} style={styles.refreshBtn} activeOpacity={0.7}>
        <Text style={styles.refreshText}>상품 목록 새로고침 🔄</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color="#3182F6" style={{ marginTop: 30 }} />
      ) : (
        <SectionList
          sections={displayProducts}
          keyExtractor={(item: any) => item._id}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.sectionTitle}>{title}</Text>
          )}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }: any) => (
            <View style={styles.card}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.prodName}>{item.name}</Text>
                <Text style={styles.prodPrice}>
                  {item.price ? item.price.toLocaleString() : 0}원
                </Text>
                <View style={styles.stockBadge}>
                  <Text style={styles.stockText}>재고 {item.total_stock || item.variants?.[0]?.stock_quantity || 0}개</Text>
                </View>
              </View>
              
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.qrButton} onPress={() => showQR(item)} activeOpacity={0.8}>
                  <Text style={styles.actionBtnLabel}>QR 코드</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.writeButton} onPress={() => writeTag(item)} activeOpacity={0.8}>
                  <Text style={styles.actionBtnLabel}>NFC 쓰기</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* QR 코드 표시 모달 - 커스텀 절대 좌표 오버레이로 변경 */}
      {qrModalVisible && (
        <View style={styles.customModalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>[{selectedProduct?.name}] QR코드</Text>
            {selectedProduct && (
              <View style={styles.qrWrapper}>
                <QRCode
                  value={`smartstore://nfc/product/${selectedProduct._id}`}
                  size={180}
                />
              </View>
            )}
            <Text style={styles.qrDesc}>카메라 또는 디바이스 스캐너로{"\n"}QR코드를 비추면 해당 상품으로 자동 연결됩니다.</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setQrModalVisible(false)} activeOpacity={0.8}>
              <Text style={styles.closeBtnText}>인쇄 닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 카테고리 필터 모달 - 커스텀 절대 좌표 오버레이로 변경 */}
      {categoryModalVisible && (
        <View style={[styles.customModalBg, { justifyContent: 'flex-start', alignItems: 'flex-start' }]}>
          <View style={styles.sideMenuContent}>
            <Text style={styles.sideMenuTitle}>카테고리 필터</Text>
            <TouchableOpacity style={styles.allCategoryItem} onPress={() => { setSelectedFilter({ type: 'all' }); setCategoryModalVisible(false); }} activeOpacity={0.7}>
              <Text style={[styles.categoryText, selectedFilter.type === 'all' && styles.categoryTextActive]}>전체 상품 보기</Text>
            </TouchableOpacity>
            <FlatList 
              data={storeCategoryTree}
              keyExtractor={(item: any) => item.store._id}
              renderItem={({ item }: any) => {
                const sId = item.store._id;
                const isExpanded = expandedStores[sId];
                return (
                  <View>
                    <TouchableOpacity 
                      style={styles.categoryItem} 
                      onPress={() => setExpandedStores((prev: any) => ({ ...prev, [sId]: !prev[sId] }))}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.categoryText, selectedFilter.storeId === sId && selectedFilter.type === 'store' && styles.categoryTextActive]}>
                        {isExpanded ? '▼ ' : '▶ '} {item.store.name}
                      </Text>
                    </TouchableOpacity>
                    {isExpanded && (
                      <View>
                        <TouchableOpacity 
                          style={[styles.categoryItem, { paddingLeft: 28 }]} 
                          onPress={() => { setSelectedFilter({ type: 'store', storeId: sId }); setCategoryModalVisible(false); }}
                        >
                          <Text style={[styles.categoryText, selectedFilter.type === 'store' && selectedFilter.storeId === sId && styles.categoryTextActive]}>
                            • 매장 전체 상품
                          </Text>
                        </TouchableOpacity>
                        {item.categories.map((cat: any) => (
                          <TouchableOpacity 
                            key={cat._id}
                            style={[styles.categoryItem, { paddingLeft: 28 }]} 
                            onPress={() => {
                              setSelectedFilter({ type: 'category', storeId: sId, categoryId: cat._id });
                              setCategoryModalVisible(false);
                            }}
                            activeOpacity={0.7}
                          >
                            <Text style={[styles.categoryText, selectedFilter.categoryId === cat._id && selectedFilter.storeId === sId && styles.categoryTextActive]}>
                              • {cat.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                );
              }}
            />
            <TouchableOpacity style={styles.closeSideMenuBtn} onPress={() => setCategoryModalVisible(false)} activeOpacity={0.8}>
              <Text style={{ color: '#4E5968', fontSize: 14, fontWeight: '800' }}>필터 닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 커스텀 얼럿 대화상자 */}
      {customAlert && (
        <View style={[styles.customModalBg, { zIndex: 9999 }]}>
          <View style={[styles.modalContent, { padding: 24, width: '80%' }]}>
            <Text style={[styles.modalTitle, { marginBottom: 12 }]}>{customAlert.title}</Text>
            <Text style={{ fontSize: 14, color: '#4E5968', textAlign: 'center', lineHeight: 20, marginBottom: 24, fontWeight: '500' }}>
              {customAlert.message}
            </Text>
            <View style={{ width: '100%', flexDirection: 'column' }}>
              {customAlert.buttons.map((btn, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.closeBtn,
                    {
                      backgroundColor: idx === 0 && customAlert.buttons.length > 1 ? '#F2F4F6' : '#1A1F27',
                      marginTop: idx > 0 ? 8 : 0,
                    }
                  ]}
                  onPress={() => {
                    setCustomAlert(null);
                    btn.onPress();
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: idx === 0 && customAlert.buttons.length > 1 ? '#4E5968' : '#fff', fontWeight: '800', fontSize: 14 }}>
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingVertical: 15, 
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E8EB'
  },
  hamburgerBtn: { padding: 4 },
  hamburgerText: { fontSize: 22, color: '#1A1F27' },
  backBtn: { paddingVertical: 4, paddingHorizontal: 8 },
  backText: { color: '#FF3B30', fontSize: 14, fontWeight: '700' },
  title: { fontSize: 16, fontWeight: '800', flex: 1, textAlign: 'center', color: '#1A1F27' },

  consolePanel: { 
    backgroundColor: '#fff', 
    padding: 20, 
    margin: 20, 
    borderRadius: 18, 
    borderWidth: 1.5, 
    borderColor: '#E5E8EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1
  },
  consoleHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  ledIndicator: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  consoleLabel: { fontSize: 10, fontWeight: '800', color: '#8B95A1', letterSpacing: 0.8 },
  statusText: { fontSize: 14, fontWeight: '800', lineHeight: 20 },
  
  refreshBtn: { alignSelf: 'center', marginBottom: 15 },
  refreshText: { color: '#6B7684', fontSize: 12, fontWeight: '600' },

  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#8B95A1', marginTop: 20, marginBottom: 10, letterSpacing: -0.3 },
  card: { 
    backgroundColor: '#fff', 
    padding: 18, 
    marginBottom: 12, 
    borderRadius: 16, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E8EB'
  },
  prodName: { fontSize: 15, fontWeight: '800', color: '#1A1F27', marginBottom: 4 },
  prodPrice: { fontSize: 13, color: '#4E5968', fontWeight: '600' },
  stockBadge: { backgroundColor: '#F2F4F6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginTop: 6 },
  stockText: { fontSize: 11, color: '#6B7684', fontWeight: '700' },

  actionButtons: { flexDirection: 'row', alignItems: 'center' },
  qrButton: { backgroundColor: '#FF9500', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, marginRight: 6 },
  writeButton: { backgroundColor: '#3182F6', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10 },
  actionBtnLabel: { color: '#fff', fontWeight: '800', fontSize: 11 },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  customModalBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  modalContent: { backgroundColor: '#fff', padding: 30, borderRadius: 24, alignItems: 'center', width: '85%' },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#1A1F27', textAlign: 'center' },
  qrWrapper: { marginVertical: 24, padding: 16, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#E5E8EB' },
  qrDesc: { fontSize: 11, color: '#8B95A1', textAlign: 'center', lineHeight: 16, fontWeight: '600', marginBottom: 20 },
  closeBtn: { width: '100%', backgroundColor: '#1A1F27', paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
  closeBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },

  sideMenuBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-start' },
  sideMenuContent: { backgroundColor: '#fff', width: 250, height: '100%', padding: 20, paddingTop: 60, borderTopRightRadius: 20, borderBottomRightRadius: 20 },
  sideMenuTitle: { fontSize: 19, fontWeight: '800', marginBottom: 20, color: '#1A1F27', letterSpacing: -0.5 },
  allCategoryItem: { paddingVertical: 12, borderBottomWidth: 1.5, borderBottomColor: '#F2F4F6', marginBottom: 10 },
  categoryItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F2F4F6' },
  categoryText: { fontSize: 14, color: '#4E5968', fontWeight: '600' },
  categoryTextActive: { color: '#3182F6', fontWeight: '800' },
  closeSideMenuBtn: { marginTop: 30, backgroundColor: '#F2F4F6', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }
});

export default AdminWrite;