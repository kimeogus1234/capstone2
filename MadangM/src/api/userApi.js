import axiosInstance from './axiosInstance';

const userApi = {
    getAddresses: async () => {
        try {
            const response = await axiosInstance.get('/api/users/addresses');
            return response.data;
        } catch (error) {
            console.error('getAddresses error:', error);
            throw error;
        }
    },

    updateAddresses: async (addresses) => {
        try {
            const response = await axiosInstance.put('/api/users/addresses', { addresses });
            return response.data;
        } catch (error) {
            console.error('updateAddresses error:', error);
            throw error;
        }
    }
};

export default userApi;
