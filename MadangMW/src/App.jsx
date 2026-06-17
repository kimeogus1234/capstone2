import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import StoreManager from './components/StoreManager';
import EventManager from './components/EventManager';
import ParkingManager from './components/ParkingManager';
import UserManager from './components/UserManager';
import ProductManager from './components/ProductManager';
import OrderManager from './components/OrderManager';
import PromotionManager from './components/PromotionManager';
import Dashboard from './components/Dashboard';
import MapManager from './components/MapManager';
import CategoryManager from './components/CategoryManager';
import RestaurantManager from './components/RestaurantManager';
import MenuManager from './components/MenuManager';
import { login } from './api';

function AppContent() {
    const [user, setUser] = useState(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
        return localStorage.getItem('sidebar_collapsed') === 'true';
    });
    const [loading, setLoading] = useState(true);

    const [isHovered, setIsHovered] = useState(false);      // ☰ 버튼 호버 상태
    const [isLogoHovered, setIsLogoHovered] = useState(false);  // ⭐️ MadangM 로고 호버 상태 추가

    const navigate = useNavigate();
    const location = useLocation();

    const isAdmin = user?.user?.role === 'ADMIN';

    useEffect(() => {
        const savedUser = localStorage.getItem('admin_user');
        if (savedUser) {
            try {
                const parsed = JSON.parse(savedUser);
                setUser(parsed);
                // 📡 토큰 유효성 즉시 확인
                import('./api').then(m => m.getDashboardStats()).catch(err => {
                    if (err.response?.status === 401) {
                        localStorage.removeItem('admin_user');
                        setUser(null);
                    }
                });
            } catch (e) {
                localStorage.removeItem('admin_user');
            }
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        localStorage.setItem('sidebar_collapsed', isSidebarCollapsed);
    }, [isSidebarCollapsed]);

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const data = await login(email, password);
            if (['ADMIN', 'STAFF'].includes(data.user.role)) {
                setUser(data);
                localStorage.setItem('admin_user', JSON.stringify(data));
                navigate('/');
            } else {
                alert('접근 거부: 관리자 또는 직원 권한이 필요합니다.');
            }
        } catch (error) {
            alert('로그인 실패: 아이디 또는 비밀번호를 확인하세요.');
        }
    };

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem('admin_user');
        navigate('/');
    };

    if (loading) return null;

    if (!user) {
        return (
            <div className="login-container">
                <div className="login-card">
                    <div style={{ marginBottom: 32 }}>
                        <h1 style={{ marginBottom: 8, fontSize: 24, color: 'var(--point-color)' }}>MadangM Console</h1>
                        <p style={{ color: '#4e5968', fontSize: 15 }}>쇼핑몰 관리 시스템에 로그인하세요</p>
                    </div>
                    <form onSubmit={handleLogin}>
                        <div className="form-group">
                            <input placeholder="아이디" value={email} onChange={e => setEmail(e.target.value)} autoFocus />
                        </div>
                        <div className="form-group">
                            <input type="password" placeholder="비밀번호" value={password} onChange={e => setPassword(e.target.value)} />
                        </div>
                        <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 12 }}>로그인</button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className={`dashboard ${isSidebarOpen ? 'sidebar-open' : ''} ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>

            {/* 상단 고정 헤더 영역 */}
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    height: '60px',
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: '20px',
                    zIndex: 1010,
                    pointerEvents: 'auto'
                }}
            >
                <button
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    style={{
                        background: isHovered ? '#f1f3f5' : 'none',
                        border: 'none',
                        fontSize: '24px',
                        cursor: 'pointer',
                        color: '#1a1f27',
                        marginRight: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '8px',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        transition: 'background-color 0.2s ease'
                    }}
                    title={isSidebarCollapsed ? "메뉴 열기" : "메뉴 접기"}
                >
                    ☰
                </button>

                {/* ⭐️ 호버 시 배경색이 생기는 MadangM 로고 버튼 */}
                <span
                    onClick={() => {
                        navigate('/');
                        setIsSidebarOpen(false);
                    }}
                    onMouseEnter={() => setIsLogoHovered(true)}
                    onMouseLeave={() => setIsLogoHovered(false)}
                    style={{
                        fontWeight: 800,
                        fontSize: '20px',
                        color: 'var(--point-color)',
                        cursor: 'pointer',
                        userSelect: 'none',

                        // 글자 크기에 맞게 호버 배경 영역을 지정하기 위해 스타일 추가
                        background: isLogoHovered ? '#f1f3f5' : 'none',
                        padding: '6px 12px',         /* 상하좌우 여백을 주어 자연스러운 사각형 배경 형성 */
                        borderRadius: '8px',         /* 모서리가 살짝 둥근 부드러운 사각형 버튼 모양 */
                        transition: 'background-color 0.2s ease',
                        display: 'inline-flex',
                        alignItems: 'center'
                    }}
                >
                    MadangM
                </span>
            </div>

            {/* 모바일 전용 탑네비 (기존 유지) */}
            <div className="mobile-top-nav">
                <button onClick={() => setIsSidebarOpen(true)} className="menu-toggle">☰</button>
                <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--primary-color)' }}>MadangM</div>
                <div style={{ width: 40 }}></div>
            </div>

            {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>}

            {/* 사이드바 영역 */}
            <div className={`sidebar ${isSidebarOpen ? 'show' : ''}`}>
                <div className="sidebar-menu" style={{ marginTop: '60px' }}>
                    <button className={location.pathname === '/' ? 'active' : ''} onClick={() => { navigate('/'); setIsSidebarOpen(false); }}>📊 대시보드</button>

                    {/* 🔹 관리자 전용 메뉴 */}
                    {isAdmin && (
                        <>
                            <button className={location.pathname === '/stores' ? 'active' : ''} onClick={() => { navigate('/stores'); setIsSidebarOpen(false); }}>🏢 매장 관리</button>
                            <button className={location.pathname === '/events' ? 'active' : ''} onClick={() => { navigate('/events'); setIsSidebarOpen(false); }}>🎉 이벤트/공지</button>
                            <button className={location.pathname === '/maps' ? 'active' : ''} onClick={() => { navigate('/maps'); setIsSidebarOpen(false); }}>🗺️ 지도 관리</button>
                            <button className={location.pathname === '/parking' ? 'active' : ''} onClick={() => { navigate('/parking'); setIsSidebarOpen(false); }}>🅿️ 주차 관리</button>
                            <button className={location.pathname === '/categories' ? 'active' : ''} onClick={() => { navigate('/categories'); setIsSidebarOpen(false); }}>🏷️ 카테고리 관리</button>
                            <button className={location.pathname === '/restaurants' ? 'active' : ''} onClick={() => { navigate('/restaurants'); setIsSidebarOpen(false); }}>🍴 식당/메뉴 관리</button>
                            <button className={location.pathname === '/users' ? 'active' : ''} onClick={() => { navigate('/users'); setIsSidebarOpen(false); }}>👥 사용자 관리</button>
                        </>
                    )}

                    <button className={location.pathname === '/products' ? 'active' : ''} onClick={() => { navigate('/products'); setIsSidebarOpen(false); }}>📦 상품 관리</button>
                    <button className={location.pathname === '/menus' ? 'active' : ''} onClick={() => { navigate('/menus'); setIsSidebarOpen(false); }}>🍴 메뉴 관리</button>
                    <button className={location.pathname === '/orders' ? 'active' : ''} onClick={() => { navigate('/orders'); setIsSidebarOpen(false); }}>🚚 주문/배송 관리</button>
                    <button className={location.pathname === '/promotions' ? 'active' : ''} onClick={() => { navigate('/promotions'); setIsSidebarOpen(false); }}>🎁 프로모션 관리</button>
                </div>

                <div style={{ borderTop: '1px solid #e5e8eb', paddingTop: 20, marginTop: 20 }}>
                    <div style={{ padding: '0 8px 12px 8px' }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#4e5968' }}>{user.user.username}</p>
                        <p style={{ fontSize: 12, color: '#8b95a1' }}>{user.user.role}</p>
                    </div>
                    <button onClick={handleLogout} style={{ color: '#f04452' }}>로그아웃</button>
                </div>
            </div>

            {/* 메인 콘텐츠 영역 */}
            <main className="main-content" style={{ paddingTop: '60px' }}>
                <Routes>
                    <Route path="/" element={<Dashboard token={user.token} />} />

                    {/* 🔹 관리자 전용 라우트 보호 */}
                    {isAdmin && (
                        <>
                            <Route path="/stores" element={<StoreManager token={user.token} user={user.user} />} />
                            <Route path="/events" element={<EventManager token={user.token} />} />
                            <Route path="/maps" element={<MapManager token={user.token} />} />
                            <Route path="/parking" element={<ParkingManager token={user.token} />} />
                            <Route path="/categories" element={<CategoryManager token={user.token} />} />
                            <Route path="/restaurants" element={<RestaurantManager token={user.token} user={user.user} />} />
                            <Route path="/users" element={<UserManager token={user.token} />} />
                        </>
                    )}

                    <Route path="/products" element={<ProductManager token={user.token} user={user.user} />} />
                    <Route path="/menus" element={<MenuManager token={user.token} user={user.user} />} />
                    <Route path="/orders" element={<OrderManager token={user.token} />} />
                    <Route path="/promotions" element={<PromotionManager token={user.token} />} />

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
        </div>
    );
}

function App() {
    return (
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AppContent />
        </BrowserRouter>
    );
}

export default App;