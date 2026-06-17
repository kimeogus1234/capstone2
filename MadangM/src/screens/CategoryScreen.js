import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, TextInput, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import productApi from '../api/productapi';
import { IMAGE_BASE_URL } from '../api/config';

const getFullUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${IMAGE_BASE_URL}${path.startsWith('/') ? path : '/' + path}`;
};

const CategoryScreen = ({ navigation, route }) => {
  const [categories, setCategories] = useState([]);
  const [selectedMainId, setSelectedMainId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState([]);

  useEffect(() => {
    fetchCategories();
    fetchStores();
  }, []);

  // 외부(홈 등)에서 특정 카테고리를 눌러 들어왔을 때 처리
  useEffect(() => {
    if (route.params?.initialCategoryId && categories.length > 0) {
      setSelectedMainId(route.params.initialCategoryId);
    }
  }, [route.params?.initialCategoryId, categories]);

  const fetchStores = async () => {
    try {
      const result = await productApi.store.getStores();
      // 백엔드가 { stores: [], totalCount: ... } 형태로 반환함
      const storesArray = result.stores || (Array.isArray(result) ? result : []);
      setStores(storesArray);
    } catch (error) {
      console.error('스토어 로딩 에러:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const result = await productApi.category.getCategories(true); // asTree=true
      // 백엔드가 다이렉트 배열을 반환함
      const categoriesArray = Array.isArray(result) ? result : (result.data || []);
      if (categoriesArray.length > 0) {
        setCategories(categoriesArray);
        const firstId = categoriesArray[0]._id;
        setSelectedMainId(firstId ? firstId.toString() : null);
      }
    } catch (error) {
      console.error('카테고리 로딩 에러:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text, type = 'keyword', categoryId = null) => {
    if (!text.trim()) return;
    navigation.navigate('Search', { query: text.trim(), type, categoryId });
    setSearchQuery('');
  };

  const selectedCategory = categories.find(c => (c._id ? c._id.toString() : null) === selectedMainId);

  return (
    <View style={styles.safeArea}>
      {/* 🔝 1층: 프리미엄 브랜드 헤더 */}
      <View style={styles.header}>
        <Text style={styles.logoText}>MadangM</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={() => navigation.navigate('RootTabs', { screen: '맵탭' })}>
            <Ionicons name="location-outline" size={24} color="#000" />
          </TouchableOpacity>
          <View style={{ marginLeft: 20 }}>
            <TouchableOpacity>
              <Ionicons name="notifications-outline" size={24} color="#000" />
              <View style={styles.dot} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 🔍 검색바 */}
      <View style={styles.searchHeader}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#000" style={{ marginRight: 10 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="어떤 상품을 찾으시나요?"
            placeholderTextColor="#aaa"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => handleSearch(searchQuery)}
            returnKeyType="search"
          />
          {(isSearching || searchQuery.length > 0) && (
            <TouchableOpacity onPress={() => { setIsSearching(false); setSearchQuery(''); }}>
              <Ionicons name="close-circle" size={20} color="#ccc" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : categories.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="layers-outline" size={50} color="#ccc" />
          <Text style={{ marginTop: 10, color: '#999' }}>등록된 카테고리가 없습니다.</Text>
        </View>
      ) : (
        <View style={styles.container}>
          {/* 좌측: 대분류 사이드바 */}
          <View style={styles.sideBar}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {categories.map((cat, index) => (
                <TouchableOpacity
                  key={cat._id ? cat._id.toString() : `cat-${index}`}
                  style={[styles.menuItem, selectedMainId === (cat._id ? cat._id.toString() : null) && styles.activeMenu]}
                  onPress={() => setSelectedMainId(cat._id ? cat._id.toString() : null)}
                >
                  {selectedMainId === (cat._id ? cat._id.toString() : null) && <View style={styles.activeIndicator} />}
                  <Text style={[styles.menuText, selectedMainId === (cat._id ? cat._id.toString() : null) && styles.activeText]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}

              <View style={{ height: 1, backgroundColor: '#eee', marginVertical: 10, marginHorizontal: 20 }} />

              <TouchableOpacity
                style={[styles.menuItem, selectedMainId === 'store' && styles.activeMenu]}
                onPress={() => setSelectedMainId('store')}
              >
                {selectedMainId === 'store' && <View style={styles.activeIndicator} />}
                <Text style={[styles.menuText, selectedMainId === 'store' && styles.activeText]}>
                  마당M 매장
                </Text>
              </TouchableOpacity>
              


              <View style={{ height: 50 }} />
            </ScrollView>
          </View>

          {/* 우측: 중분류 & 소분류 콘텐츠 */}
          <View style={styles.content}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.mainTitle}>
                {selectedMainId === 'store' ? '마당M 매장' : selectedCategory?.name}
              </Text>
              
              {selectedMainId === 'store' ? (
                <View>
                    {stores.length > 0 ? stores.map(store => (
                    <TouchableOpacity 
                      key={store._id} 
                      style={styles.storeCard} 
                      onPress={() => handleSearch(store.name, 'store', store._id)}
                    >
                      {store.imageUrl ? (
                        <Image 
                          source={{ uri: getFullUrl(store.imageUrl) }} 
                          style={styles.storeImage} 
                        />
                      ) : (
                        <View style={[styles.storeImage, styles.emptyStoreImage]}>
                          <Ionicons name="business-outline" size={24} color="#adb5bd" />
                        </View>
                      )}
                      <View style={styles.storeInfoContainer}>
                        <Text style={styles.storeName}>{store.name}</Text>
                        <Text style={styles.storeFloor}>{store.floor} | {store.locationCode}</Text>
                        {store.description ? (
                          <Text style={styles.storeDesc} numberOfLines={1}>{store.description}</Text>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  )) : <Text style={{ color: '#999' }}>매장이 없습니다.</Text>}
                </View>
              ) : selectedCategory?.children?.length > 0 ? (
                selectedCategory.children.map((sub) => (
                  <View key={sub._id} style={styles.subSection}>
                    <View style={styles.subHeader}>
                      <Text style={styles.subTitle}>{sub.name}</Text>
                      <TouchableOpacity onPress={() => handleSearch(sub.name, 'category', sub._id)}>
                        <Text style={styles.seeAllText}>전체보기 {'>'}</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.itemGrid}>
                      {sub.children?.length > 0 ? (
                        sub.children.map((detail) => (
                          <TouchableOpacity
                            key={detail._id}
                            style={styles.detailBtn}
                            onPress={() => handleSearch(detail.name, 'category', detail._id)}
                          >
                            <Text style={styles.detailText}>{detail.name}</Text>
                          </TouchableOpacity>
                        ))
                      ) : (
                        <Text style={{ fontSize: 12, color: '#ccc', paddingVertical: 10 }}>
                          소분류가 없습니다.
                        </Text>
                      )}
                    </View>
                  </View>
                ))
              ) : (
                <Text style={{ fontSize: 13, color: '#999', marginTop: 20 }}>
                  선택한 대분류에 등록된 하위 카테고리가 없습니다.
                </Text>
              )}
              <View style={{ height: 100 }} />
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingHorizontal: 25,
    paddingBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  logoText: { fontSize: 20, fontWeight: '900', color: '#000' },
  headerIcons: { flexDirection: 'row', alignItems: 'center' },
  dot: { position: 'absolute', top: 2, right: 0, width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#FF3B30', borderWidth: 1, borderColor: '#fff' },

  searchHeader: { paddingHorizontal: 20, paddingBottom: 15 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f6f6f6', height: 48, borderRadius: 12, paddingHorizontal: 15 },
  searchInput: { flex: 1, fontSize: 14, color: '#000', fontWeight: '500' },

  container: { flex: 1, flexDirection: 'row' },
  sideBar: { width: 105, backgroundColor: '#f9f9f9', borderRightWidth: 1, borderColor: '#eee' },
  menuItem: { paddingVertical: 25, alignItems: 'center', justifyContent: 'center' },
  activeMenu: { backgroundColor: '#fff' },
  activeIndicator: { position: 'absolute', left: 0, width: 4, height: 20, backgroundColor: '#000', borderRadius: 2 },
  menuText: { fontSize: 13, color: '#888', textAlign: 'center' },
  activeText: { color: '#000', fontWeight: '900' },

  content: { flex: 1, padding: 20, backgroundColor: '#fff' },
  mainTitle: { fontSize: 20, fontWeight: '900', color: '#000', marginBottom: 25 },
  subSection: { marginBottom: 35 },
  subHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  subTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  seeAllText: { fontSize: 12, color: '#999', fontWeight: '600' },
  itemGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  detailBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eaeaea',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  detailText: { fontSize: 13, color: '#555', fontWeight: '500' },
  storeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee'
  },
  storeImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 14
  },
  emptyStoreImage: {
    backgroundColor: '#e9ecef',
    alignItems: 'center',
    justifyContent: 'center'
  },
  storeInfoContainer: {
    flex: 1,
    justifyContent: 'center'
  },
  storeName: { fontSize: 16, fontWeight: 'bold', color: '#111', marginBottom: 4 },
  storeFloor: { fontSize: 12, color: '#8b95a1', fontWeight: '600' },
  storeDesc: { fontSize: 11, color: '#888', marginTop: 4 }
});

export default CategoryScreen;
