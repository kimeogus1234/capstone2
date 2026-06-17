import axiosInstance from './axiosInstance';

const authApi = {
    // 1. 회원가입 (signup -> register로 변경)
    signup: async (userData) => {
        // userData는 { username, password } 형태여야 합니다.
        const response = await axiosInstance.post('/api/auth/register', userData);
        return response.data;
    },
    // 2. 로그인
    login: async (credentials) => {
        // credentials는 { username, password } 형태여야 합니다.
        const response = await axiosInstance.post('/api/auth/login', credentials);
        return response.data; // 서버에서 { token, user }를 반환합니다.
    },
    // 3. 아이디 찾기
    findId: async (email) => {
        const response = await axiosInstance.post('/api/auth/find-id', { email });
        return response.data;
    },
    // 4. 비밀번호 재설정
    resetPassword: async (data) => {
        const response = await axiosInstance.post('/api/auth/reset-password', data);
        return response.data;
    },
    // 5. 아이디 중복 확인
    checkUsername: async (username) => {
        const response = await axiosInstance.post('/api/auth/check-username', { username });
        return response.data;
    },
    // 6. 이메일 인증코드 발송
    sendCode: async (email) => {
        const response = await axiosInstance.post('/api/auth/send-code', { email });
        return response.data;
    },
    // 7. 이메일 인증코드 검증 (서버 측)
    verifyEmailCode: async (email, code) => {
        const response = await axiosInstance.post('/api/auth/verify-code', { email, code });
        return response.data;
    },
    // 8. 회원정보 수정 (RESTful PUT 방식으로 번호(id) 포함 호출)
    updateProfile: async (id, data) => {
        const response = await axiosInstance.put(`/api/auth/profile/${id}`, data);
        return response.data;
    },
    // 9. 회원 탈퇴 (비밀번호 본인 확인 포함)
    deleteAccount: async (userId, password) => {
        const response = await axiosInstance.post('/api/auth/delete-account', { userId, password });
        return response.data;
    },
    logout: async () => {
        // 필요 시 로그아웃 로직 추가
    },
    // 10. 카카오 로그인
    kakaoLogin: async (data) => {
        const response = await axiosInstance.post('/api/auth/kakao-login', data);
        return response.data;
    },
    // 11. 구글 로그인
    googleLogin: async (data) => {
        const response = await axiosInstance.post('/api/auth/google-login', data);
        return response.data;
    },
    // 12. 네이버 로그인
    naverLogin: async (data) => {
        const response = await axiosInstance.post('/api/auth/naver-login', data);
        return response.data;
    },
    // 13. 프로필 이미지 업로드
    uploadProfileImage: async (formData) => {
        const response = await axiosInstance.post('/api/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    }
};
export default authApi;