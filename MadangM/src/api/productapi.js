import axiosInstance from './axiosInstance';

/**
 * 🏢 백화점 상품 및 리뷰 통신 API 서비스
 */
const productApi = {
    getProductDetail: async (idOrUid) => {
        const cleanId = idOrUid.includes('/') ? idOrUid.split('/').pop() : idOrUid;
        
        // 💡 [지능형 감지] 24자리 Hex 문자열이면 ID 조회, 아니면 NFC UID 조회를 수행합니다.
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(cleanId);
        const endpoint = isObjectId ? `/api/products/${cleanId}` : `/api/products/nfc/${cleanId}`;
        
        const response = await axiosInstance.get(endpoint);
        return response.data;
    },
    searchProducts: async (query, type = 'keyword', categoryId = null) => {
        let url = `/api/products/search?name=${encodeURIComponent(query)}&type=${type}`;
        if (categoryId) {
            if (type === 'store') url += `&storeId=${categoryId}`;
            else url += `&categoryId=${categoryId}`;
        }
        const response = await axiosInstance.get(url);
        return response.data;
    },
    getProductReviews: async (productId) => {
        try {
            const response = await axiosInstance.get(`/api/reviews/${productId}`);
            return response.data;
        } catch (error) {
            if (error.response?.status !== 401) {
                console.warn("리뷰 수신 오류:", error.message);
            }
            return [];
        }
    },
    submitReview: async (reviewData) => {
        try {
            const response = await axiosInstance.post('/api/reviews', reviewData);
            return response.data;
        } catch (error) {
            if (error.response?.status !== 401) {
                console.warn("리뷰 등록 오류:", error.message);
            }
            throw error;
        }
    },
    cart: {
        getCart: async () => {
            const response = await axiosInstance.get('/api/cart');
            return response.data;
        },
        addToCart: async (itemData) => {
            // Backend expects { productId, variantSku, quantity }
            const payload = {
                productId: itemData.productId,
                variantSku: itemData.variantSku || itemData.sku,
                quantity: itemData.quantity || 1
            };
            const response = await axiosInstance.post('/api/cart', payload);
            return response.data;
        },
        updateItem: async (productId, quantity, variantSku = null) => {
            const response = await axiosInstance.put('/api/cart', { productId, quantity, variantSku });
            return response.data;
        },
        removeFromCart: async (itemId) => {
            const response = await axiosInstance.delete(`/api/cart/${itemId}`);
            return response.data;
        },
        clearCart: async () => {
            const response = await axiosInstance.delete('/api/cart/clear');
            return response.data;
        }
    },
    order: {
        createOrder: async (orderData) => {
            const response = await axiosInstance.post('/api/orders', orderData);
            return response.data;
        },
        getMyOrders: async () => {
            const response = await axiosInstance.get('/api/orders/my');
            return response.data;
        },
        getStatusCounts: async () => {
            const response = await axiosInstance.get('/api/orders/status-counts');
            return response.data;
        },
        cancelOrder: async (orderId) => {
            const response = await axiosInstance.patch(`/api/orders/${orderId}/cancel`);
            return response.data;
        },
        returnOrder: async (orderId) => {
            const response = await axiosInstance.patch(`/api/orders/${orderId}/return`);
            return response.data;
        },
        exchangeOrder: async (orderId) => {
            const response = await axiosInstance.patch(`/api/orders/${orderId}/exchange`);
            return response.data;
        }
    },
    store: {
        getStores: async () => {
            const response = await axiosInstance.get('/api/stores');
            return response.data;
        }
    },
    category: {
        getCategories: async (asTree = true) => {
            const url = asTree ? '/api/categories/tree' : '/api/categories';
            const response = await axiosInstance.get(url);
            return response.data;
        }
    },
    coupon: {
        getCoupons: async () => {
            const response = await axiosInstance.get('/api/coupons');
            return response.data;
        },
        validateCoupon: async (code, amount, items) => {
            const response = await axiosInstance.post('/api/coupons/validate', { code, amount, items });
            return response.data;
        },
        checkRewards: async (items, totalAmount) => {
            const response = await axiosInstance.post('/api/coupons/check-rewards', { items, totalAmount });
            return response.data;
        }
    },
    promotion: {
        getPromotions: async () => {
            const response = await axiosInstance.get('/api/promotions');
            return response.data;
        },
        getSuggestions: async (items) => {
            const response = await axiosInstance.post('/api/promotions/suggestions', { items });
            return response.data;
        }
    },
    wishlist: {
        getWishlist: async () => {
            const response = await axiosInstance.get('/api/users/wishlist');
            return response.data;
        },
        addToWishlist: async (productId) => {
            const response = await axiosInstance.post('/api/users/wishlist', { productId });
            return response.data;
        },
        removeFromWishlist: async (productId) => {
            const response = await axiosInstance.delete(`/api/users/wishlist/${productId}`);
            return response.data;
        }
    }
};


export default productApi;
