import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './config';

/**
 * 📡 [Standard API Client]
 * 모든 요청에 JWT 토큰을 자동으로 주입하고, 네트워크 오류 시 자동 재시도를 수행합니다.
 */
const axiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 20000, // 20초로 약간 연장
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
});

// 🛡️ 요청 인터셉터 (토큰 자동 삽입)
axiosInstance.interceptors.request.use(
    async (config) => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (token) {
                config.headers['Authorization'] = `Bearer ${token}`;
            }
        } catch (e) {
            console.warn('[Token Fetch Error]', e);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 🚑 응답 인터셉터 (자동 재시도 및 에러 로깅)
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const { config, response } = error;

        // 재시도 설정 (네트워크 에러이거나 5xx 에러일 때 최대 3번 시도)
        const MAX_RETRIES = 3;
        config._retryCount = config._retryCount || 0;

        if (!response && config._retryCount < MAX_RETRIES) {
            config._retryCount += 1;
            console.log(`🔄 [Retry] 서버 연결 재시도 중... (${config._retryCount}/${MAX_RETRIES})`);
            
            // 지연 후 재시도
            await new Promise(resolve => setTimeout(resolve, 1000 * config._retryCount));
            return axiosInstance(config);
        }

        if (response?.status === 401) {
            console.warn('[Session Expired] 인증이 만료되었습니다.');
            AsyncStorage.multiRemove(['token', 'user']);
        } else if (!response) {
            console.warn(`[Network Error] 서버(${BASE_URL}) 연결 실패. 네트워크 상태를 확인하세요.`);
        } else {
            console.warn(`[API Error] ${response.status}: ${response.data?.message || error.message}`);
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
export { axiosInstance };
