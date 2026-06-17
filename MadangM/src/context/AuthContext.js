import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 앱 시작 시 자동 로그인 체크
        const loadStorageData = async () => {
            try {
                // AsyncStorage가 존재할 때만 실행
                if (AsyncStorage) {
                    const storedUser = await AsyncStorage.getItem('user');
                    if (storedUser) {
                        setUser(JSON.parse(storedUser));
                    }
                }
            } catch (e) {
                console.warn('AsyncStorage를 사용할 수 없습니다. (빌드 필요)', e.message);
            } finally {
                setLoading(false);
            }
        };
        loadStorageData();
    }, []);

    const login = async (userData) => {
        setUser(userData);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        if (userData.token) {
            await AsyncStorage.setItem('token', userData.token);
        }
    };

    const logout = async () => {
        setUser(null);
        await AsyncStorage.removeItem('user');
        await AsyncStorage.removeItem('token');
    };

    const updateUser = async (newUserData) => {
        const updatedUser = { ...user, ...newUserData };
        setUser(updatedUser);
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, updateUser, isLoading: loading, isLoggedIn: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
