import axios from 'axios';

// ✅ 대현님, 이 3줄로 완전히 깔끔하게 교체해 주세요!
// 환경 변수가 있으면 그대로 쓰고, 없으면 프록시(/api)를 타도록 상대 경로를 기본값으로 지정합니다.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const API_URL = BASE_URL ? `${BASE_URL.replace(/\/$/, '')}/api` : '/api';

export const getFullImageUrl = (path) => {
    if (!path || path === '/') return null;
    if (path.startsWith('http')) return path;

    // .env 파일에 등록된 VITE_UPLOADS_BASE_URL이 있으면 쓰고, 없으면 프록시 타겟으로 결합
    const uploadsBase = import.meta.env.VITE_UPLOADS_BASE_URL || (BASE_URL ? `${BASE_URL}/uploads` : '/uploads');
    let cleanPath = path.startsWith('/') ? path : `/${path}`;

    // 💡 이미지 경로 중복 방지: 데이터베이스에 이미 /uploads/가 포함되어 저장된 경우 중복을 제거합니다.
    let base = uploadsBase.replace(/\/$/, '');
    if (cleanPath.startsWith('/uploads/')) {
        base = base.replace(/\/uploads$/, '');
    }

    return `${base}${cleanPath}`;
};

const api = axios.create({
    baseURL: API_URL
});

// 🔐 모든 요청에 토큰 자동 포함 (인터셉터)
api.interceptors.request.use((config) => {
    const savedUser = localStorage.getItem('admin_user');
    if (savedUser) {
        try {
            const { token } = JSON.parse(savedUser);
            if (token && token !== 'undefined') {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (e) {
            console.error('Token parsing error', e);
        }
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// 🔓 토큰 만료 및 인증 에러 자동 처리 (Response 인터셉터)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.warn('토큰이 만료되었거나 권한이 없습니다. 로그아웃 처리합니다.');
            localStorage.removeItem('admin_user');
            // 로그인 페이지로 강제 이동 (새로고침 방식이 가장 확실함)
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

// Auth
export const login = async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
};

// 🏢 Stores
export const getStores = async (params) => {
    const response = await api.get('/stores', { params });
    return response.data;
};
export const createStore = async (data) => {
    const response = await api.post('/stores', data);
    return response.data;
};
export const updateStore = async (id, data) => {
    const response = await api.put(`/stores/${id}`, data);
    return response.data;
};
export const deleteStore = async (id) => {
    const response = await api.delete(`/stores/${id}`);
    return response.data;
};
export const getStoreDeletePreview = async (id) => {
    const response = await api.get(`/stores/${id}/delete-preview`);
    return response.data;
};

// 🍴 Restaurants (Completely Separated)
export const getRestaurants = async (params) => {
    const response = await api.get('/restaurants', { params });
    return response.data;
};
export const createRestaurant = async (data) => {
    const response = await api.post('/restaurants', data);
    return response.data;
};
export const updateRestaurant = async (id, data) => {
    const response = await api.put(`/restaurants/${id}`, data);
    return response.data;
};
export const deleteRestaurant = async (id) => {
    const response = await api.delete(`/restaurants/${id}`);
    return response.data;
};

// 🎉 Events
export const getEvents = async () => {
    const response = await api.get('/events');
    return response.data;
};
export const createEvent = async (data) => {
    const response = await api.post('/events', data);
    return response.data;
};
export const updateEvent = async (id, data) => {
    const response = await api.put(`/events/${id}`, data);
    return response.data;
};
export const deleteEvent = async (id) => {
    const response = await api.delete(`/events/${id}`);
    return response.data;
};
export const reorderEvents = async (eventIds) => {
    const response = await api.post('/events/reorder', { eventIds });
    return response.data;
};

// 🅿️ Parking
export const getParkingStatus = async () => {
    const response = await api.get('/parking');
    return response.data;
};
export const simulateParking = async (data) => {
    const response = await api.post('/parking/simulate', data);
    return response.data;
};

// 📂 Categories
export const getCategoryTree = async (storeId) => {
    const response = await api.get('/categories/tree', { params: { storeId } });
    return response.data;
};
export const createCategory = async (data) => {
    const response = await api.post('/categories', data);
    return response.data;
};
export const updateCategory = async (id, data) => {
    const response = await api.put(`/categories/${id}`, data);
    return response.data;
};
export const deleteCategory = async (id) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
};

// 📦 Products
export const getProducts = async (params) => {
    const response = await api.get('/products', { params });
    return response.data;
};
export const getProductDetail = async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
};
export const createProduct = async (data) => {
    const response = await api.post('/products', data);
    return response.data;
};
export const updateProduct = async (id, data) => {
    const response = await api.put(`/products/${id}`, data);
    return response.data;
};
export const deleteProduct = async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
};

export const bulkDeleteProducts = async (ids) => {
    const response = await api.post('/products/bulk-delete', { ids });
    return response.data;
};

export const bulkUpdateProductStatus = async (ids, status) => {
    const response = await api.post('/products/bulk-update-status', { ids, status });
    return response.data;
};

// 🍴 Menus (Restaurant Specific)
export const getMenus = async (params) => {
    const response = await api.get('/menus', { params });
    return response.data;
};
export const createMenu = async (data) => {
    const response = await api.post('/menus', data);
    return response.data;
};
export const updateMenu = async (id, data) => {
    const response = await api.put(`/menus/${id}`, data);
    return response.data;
};
export const deleteMenu = async (id) => {
    const response = await api.delete(`/menus/${id}`);
    return response.data;
};

// 🗺️ Maps & Markers
export const getMapsAndMarkers = async () => {
    const response = await api.get('/map');
    return response.data;
};
export const createMarker = async (data) => {
    const response = await api.post('/map/markers', data);
    return response.data;
};
export const deleteMarker = async (id) => {
    const response = await api.delete(`/map/markers/${id}`);
    return response.data;
};

export const updateMarker = async (id, data) => {
    const response = await api.put(`/map/markers/${id}`, data);
    return response.data;
};

export const bulkDeleteMarkers = async (ids) => {
    const response = await api.post('/map/markers/bulk-delete', { ids });
    return response.data;
};
export const updateMap = async (data) => {
    const response = await api.post('/map', data);
    return response.data;
};
export const getFloors = async () => {
    const response = await api.get('/map/floors');
    return response.data;
};
export const addFloor = async (floor) => {
    const response = await api.post('/map/floors', { floor });
    return response.data;
};
export const deleteFloor = async (floor) => {
    const response = await api.delete(`/map/floors/${floor}`);
    return response.data;
};

// 🛒 장바구니 및 주문 API
export const getCart = async () => {
    const response = await api.get('/cart');
    return response.data;
};
export const addToCart = async (data) => {
    const response = await api.post('/cart', data);
    return response.data;
};
export const removeFromCart = async (itemId) => {
    const response = await api.delete(`/cart/${itemId}`);
    return response.data;
};
export const createOrder = async (data) => {
    const response = await api.post('/orders', data);
    return response.data;
};
export const getMyOrders = async () => {
    const response = await api.get('/orders/my');
    return response.data;
};
export const getAllOrders = async () => {
    const response = await api.get('/orders/all');
    return response.data;
};
export const updateOrderStatus = async (orderId, status) => {
    const response = await api.put(`/orders/status/${orderId}`, { status });
    return response.data;
};

// 🎁 프로모션 및 쿠폰 API
export const getAvailableCoupons = async (totalAmount) => {
    const response = await api.get('/promotions/available', { params: { total_amount: totalAmount } });
    return response.data;
};
export const validateCoupon = async (code, totalAmount) => {
    const response = await api.post('/promotions/validate', { code, total_amount: totalAmount });
    return response.data;
};
export const getAllCoupons = async () => {
    const response = await api.get('/promotions');
    return response.data;
};
export const createCoupon = async (data) => {
    const response = await api.post('/promotions', data);
    return response.data;
};
export const updateCoupon = async (id, data) => {
    const response = await api.put(`/promotions/${id}`, data);
    return response.data;
};
export const deleteCoupon = async (id) => {
    const response = await api.delete(`/promotions/${id}`);
    return response.data;
};
export const getAllPromotionRules = async () => {
    const response = await api.get('/promotions/rules');
    return response.data;
};
export const createPromotionRule = async (data) => {
    const response = await api.post('/promotions/rules', data);
    return response.data;
};
export const updatePromotionRule = async (id, data) => {
    const response = await api.put(`/promotions/rules/${id}`, data);
    return response.data;
};
export const deletePromotionRule = async (id) => {
    const response = await api.delete(`/promotions/rules/${id}`);
    return response.data;
};

// 👥 Users
export const getUsers = async (params) => {
    const response = await api.get('/users', { params });
    return response.data;
};
export const createUser = async (data) => {
    const response = await api.post('/users', data);
    return response.data;
};
export const updateUserRole = async (userId, role, department, managed_categories, assignedStoreId) => {
    const response = await api.put(`/users/${userId}/role`, { role, department, managed_categories, assignedStoreId });
    return response.data;
};
export const deleteUser = async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
};

// 📊 Stats
export const getDashboardStats = async () => {
    const response = await api.get('/stats/dashboard');
    return response.data;
};

// 🖼️ Media
export const uploadImage = async (formData) => {
    const response = await api.post('/upload', formData);
    return response.data;
};

export default api;
