import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { LogBox, Platform, StatusBar, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

// 화면 임포트
import HomeScreen from './src/screens/HomeScreen';
import ProductDetail from './src/screens/ProductDetailScreen';
import CartScreen from './src/screens/CartScreen';
import QrScreen from './src/screens/QrScreen';
import CategoryScreen from './src/screens/CategoryScreen';
import SearchScreen from './src/screens/SearchScreen';
import MyCoupangScreen from './src/screens/MyCoupangScreen';
import MapScreen from './src/screens/MapScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import AddressScreen from './src/screens/AddressScreen';
import WriteReviewScreen from './src/screens/WriteReviewScreen';
import OrderTrackingScreen from './src/screens/OrderTrackingScreen';
import CancelReturnExchangeScreen from './src/screens/CancelReturnExchangeScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import FindAccountScreen from './src/screens/FindAccountScreen';
import DeleteAccountScreen from './src/screens/DeleteAccountScreen';
import CouponBoxScreen from './src/screens/CouponBoxScreen'; // 🎫 [NEW] 쿠폰함 추가
import DiningScreen from './src/screens/DiningScreen'; // 🍽️ [NEW] 다이닝 추가
import RestaurantMenuScreen from './src/screens/RestaurantMenuScreen'; // 🍱 [NEW] 다이닝 메뉴 추가
import EditProfileScreen from './src/screens/EditProfileScreen'; // 👤 [NEW] 개인정보 변경 화면
import PolicyScreen from './src/screens/PolicyScreen';
import WishlistScreen from './src/screens/WishlistScreen'; // ❤️ [NEW] 찜목록 화면 추가

const RootStack = createStackNavigator();
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const navigationRef = createNavigationContainerRef();

/** 🏠 1. 홈 스택 (홈에서 발생하는 모든 이동 - 탭바 유지됨) */
const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HomeScreen" component={HomeScreen} />
    <Stack.Screen name="Search" component={SearchScreen} />
    <Stack.Screen name="ProductDetail" component={ProductDetail} options={{ headerShown: false }} />
  </Stack.Navigator>
);

/** 📂 2. 카테고리 스택 (카테고리 화면 & 검색 결과 - 탭바 유지됨) */
const CategoryStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="CategoryScreen" component={CategoryScreen} />
    <Stack.Screen name="Search" component={SearchScreen} />
    <Stack.Screen name="ProductDetail" component={ProductDetail} options={{ headerShown: false }} />
  </Stack.Navigator>
);

/** 🥘 3. 다이닝 스택 (음식점 메뉴 - 탭바 유지됨) */
const DiningStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="DiningScreen" component={DiningScreen} />
    <Stack.Screen name="RestaurantMenu" component={RestaurantMenuScreen} />
    <Stack.Screen name="ProductDetail" component={ProductDetail} options={{ headerShown: false }} />
  </Stack.Navigator>
);

/** 🏢 메인 하단 탭 (7인 탭 - 시스템 인셋 대응) */
const MainTabs = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      initialRouteName="홈탭"
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: '#000',
        tabBarInactiveTintColor: '#bbb',
        headerShown: false,
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 60 + insets.bottom : 70 + insets.bottom,
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderColor: '#f2f2f2',
          paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
          paddingTop: 10,
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: 'bold',
          marginTop: 2,
        },
        tabBarIcon: ({ focused, color }) => {
          let iconName;
          if (route.name === '홈탭') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === '카테고리탭') iconName = focused ? 'list' : 'list-outline';
          else if (route.name === '다이닝탭') iconName = focused ? 'restaurant' : 'restaurant-outline';
          else if (route.name === '맵탭') iconName = focused ? 'map' : 'map-outline';
          else if (route.name === '스캔탭') iconName = focused ? 'qr-code' : 'qr-code-outline';
          else if (route.name === '장바구니탭') iconName = focused ? 'cart' : 'cart-outline';
          else if (route.name === '마이탭') iconName = focused ? 'person' : 'person-outline';

          return (
            <View style={{ width: 24, height: 24, justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name={iconName} size={22} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="홈탭" component={HomeStack} options={{ title: '홈' }} />
      <Tab.Screen name="카테고리탭" component={CategoryStack} options={{ title: '카테고리' }} />
      <Tab.Screen name="맵탭" component={MapScreen} options={{ title: '층별안내' }} />
      <Tab.Screen name="장바구니탭" component={CartScreen} options={{ title: '장바구니' }} />
      <Tab.Screen name="마이탭" component={MyCoupangScreen} options={{ title: '내정보' }} />
    </Tab.Navigator>
  );
};

const linking = {
  prefixes: ['smartstore://', 'madangm://'],
  config: {
    screens: {
      ProductDetail: 'nfc/product/:nfcId',
    },
  },
};

const App = () => {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'bottom']}>
        <AuthProvider>
          <NavigationContainer ref={navigationRef} linking={linking}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
            <RootStack.Navigator initialRouteName="RootTabs" screenOptions={{ headerShown: false }}>
              <RootStack.Screen name="RootTabs" component={MainTabs} />
              {/* 📍 전면 화면들 (이제 부모가 SafeAreaView이므로 모든 화면이 자동으로 피하게 됨) */}
              <RootStack.Screen name="ProductDetail" component={ProductDetail} options={{ headerShown: false }} />
              <RootStack.Screen name="Checkout" component={CheckoutScreen} options={{ headerShown: false }} />
              <RootStack.Screen name="Address" component={AddressScreen} options={{ headerShown: false }} />
              <RootStack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: false }} />
              <RootStack.Screen name="Search" component={SearchScreen} options={{ headerShown: false }} />
              <RootStack.Screen name="PolicyScreen" component={PolicyScreen} options={{ headerShown: false }} />
              <RootStack.Screen name="WriteReview" component={WriteReviewScreen} options={{ headerShown: false }} />
              <RootStack.Screen name="OrderTrackingScreen" component={OrderTrackingScreen} options={{ headerShown: false }} />
              <RootStack.Screen name="CancelReturnExchange" component={CancelReturnExchangeScreen} options={{ headerShown: false }} />
              <RootStack.Screen name="WishlistScreen" component={WishlistScreen} options={{ headerShown: false }} />
              <RootStack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
              <RootStack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
              <RootStack.Screen name="FindAccount" component={FindAccountScreen} options={{ headerShown: false }} />
              <RootStack.Screen name="DeleteAccount" component={DeleteAccountScreen} options={{ headerShown: true, title: '회원 탈퇴' }} />
              <RootStack.Screen name="CouponBox" component={CouponBoxScreen} options={{ headerShown: false }} />
              <RootStack.Screen name="Dining" component={DiningStack} options={{ headerShown: false }} />
              <RootStack.Screen name="QrScan" component={QrScreen} options={{ headerShown: false }} />
            </RootStack.Navigator>
          </NavigationContainer>
        </AuthProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default App;
