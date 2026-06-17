import axiosInstance from './axiosInstance';

export const orderApi = {
    createOrder: async (orderData) => {
        const response = await axiosInstance.post('/api/orders', orderData);
        return response.data;
    },
    getOrderHistory: async (userId) => {
        const response = await axiosInstance.get(`/api/orders/user/${userId}`);
        return response.data;
    }
};

export default orderApi;
