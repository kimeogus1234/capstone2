import React, { useState, useEffect } from 'react';
import { getMenus, createMenu, updateMenu, deleteMenu, getFullImageUrl, getRestaurants } from '../api';
import { useLocation, useNavigate } from 'react-router-dom';
import { ImageUploader } from './ContentBlockEditor';

export default function MenuManager({ token, user }) {
    const [menus, setMenus] = useState([]);
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMenu, setEditingMenu] = useState(null);
    
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const restaurantId = queryParams.get('restaurantId') || '';
    
    const [currentStore, setCurrentStore] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: 0,
        imageUrl: '',
        category: '메인 메뉴',
        isAvailable: true,
        recommend: false,
        spicyLevel: 0,
        restaurantId: restaurantId
    });

    useEffect(() => {
        fetchInitialData();
    }, [restaurantId]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [menuData, restaurantData] = await Promise.all([
                getMenus({ restaurantId }),
                getRestaurants()
            ]);
            setMenus(menuData);
            setStores(restaurantData);
            
            if (restaurantId) {
                const s = restaurantData.find(x => x._id === restaurantId);
                setCurrentStore(s);
            }
        } catch (error) {
            console.error('Failed to fetch menus', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingMenu) {
                await updateMenu(editingMenu._id, formData);
            } else {
                await createMenu(formData);
            }
            setIsModalOpen(false);
            setEditingMenu(null);
            fetchInitialData();
        } catch (error) {
            alert('저장 중 오류가 발생했습니다.');
        }
    };

    const handleEdit = (menu) => {
        setEditingMenu(menu);
        setFormData(menu);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('메뉴를 삭제하시겠습니까?')) return;
        try {
            await deleteMenu(id);
            fetchInitialData();
        } catch (e) { alert('삭제 실패'); }
    };

    return (
        <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                    <h1 style={{ fontSize: 32, fontWeight: 900 }}>🍔 {currentStore ? `${currentStore.name} 메뉴 관리` : '메뉴 통합 관리'}</h1>
                    <p style={{ color: '#4e5968' }}>식당의 메뉴 구성, 가격, 이미지를 별도로 관리합니다.</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={() => navigate('/restaurants')} style={{ padding: '12px 20px', borderRadius: 14, background: '#f2f4f6', border: 'none', fontWeight: 700, cursor: 'pointer' }}>목록으로</button>
                    {restaurantId && (
                        <button 
                            className="btn-primary" 
                            onClick={() => { 
                                setEditingMenu(null); 
                                setFormData({ name: '', description: '', price: 0, imageUrl: '', category: '메인 메뉴', isAvailable: true, recommend: false, spicyLevel: 0, restaurantId }); 
                                setIsModalOpen(true); 
                            }}
                            style={{ padding: '12px 24px', borderRadius: 14, background: '#3182f6', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                        >
                            + 신규 메뉴 추가
                        </button>
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
                {menus.map(menu => (
                    <div key={menu._id} style={{ background: '#fff', borderRadius: 20, border: '1px solid #e5e8eb', overflow: 'hidden', position: 'relative' }}>
                        <div style={{ height: 180, background: '#f9fafb' }}>
                            {menu.imageUrl ? (
                                <img src={getFullImageUrl(menu.imageUrl)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={menu.name} />
                            ) : (
                                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>🍲</div>
                            )}
                            {menu.recommend && (
                                <div style={{ position: 'absolute', top: 12, left: 12, background: '#ffbb00', color: '#fff', padding: '4px 8px', borderRadius: 8, fontSize: 11, fontWeight: 900 }}>MD 추천</div>
                            )}
                        </div>
                        <div style={{ padding: 20 }}>
                            <div style={{ fontSize: 12, color: '#3182f6', fontWeight: 800, marginBottom: 4 }}>{menu.category}</div>
                            <h4 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 800 }}>{menu.name}</h4>
                            <p style={{ fontSize: 13, color: '#8b95a1', marginBottom: 16, height: 36, overflow: 'hidden' }}>{menu.description}</p>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontSize: 18, fontWeight: 900 }}>{menu.price.toLocaleString()}원</div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button onClick={() => handleEdit(menu)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>✏️</button>
                                    <button onClick={() => handleDelete(menu._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>🗑️</button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-card" onClick={e => e.stopPropagation()}>
                        <h2 style={{ marginBottom: 24 }}>{editingMenu ? '메뉴 수정' : '신규 메뉴 등록'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
                                <div style={{ width: 140, height: 140 }}>
                                    {formData.imageUrl ? (
                                        <div style={{ position: 'relative', height: '100%' }}>
                                            <img src={getFullImageUrl(formData.imageUrl)} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 16 }} />
                                            <button type="button" onClick={() => setFormData({ ...formData, imageUrl: '' })} style={{ position: 'absolute', top: -5, right: -5, background: '#f04452', color: '#fff', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer' }}>✕</button>
                                        </div>
                                    ) : (
                                        <ImageUploader token={token} onUpload={(url) => setFormData({ ...formData, imageUrl: url })} />
                                    )}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div className="form-group">
                                        <label>메뉴명</label>
                                        <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label>가격</label>
                                        <input type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} required />
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                                <div className="form-group">
                                    <label>카테고리</label>
                                    <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid #e5e8eb' }}>
                                        <option value="메인 메뉴">메인 메뉴</option>
                                        <option value="사이드 메뉴">사이드 메뉴</option>
                                        <option value="음료/주류">음료/주류</option>
                                        <option value="디저트">디저트</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>맵기 단계 (0~3)</label>
                                    <input type="number" min="0" max="3" value={formData.spicyLevel} onChange={e => setFormData({ ...formData, spicyLevel: Number(e.target.value) })} />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>설명</label>
                                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={2} style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid #e5e8eb' }} />
                            </div>

                            <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                    <input type="checkbox" checked={formData.recommend} onChange={e => setFormData({ ...formData, recommend: e.target.checked })} />
                                    추천 메뉴 설정
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                    <input type="checkbox" checked={formData.isAvailable} onChange={e => setFormData({ ...formData, isAvailable: e.target.checked })} />
                                    주문 가능 상태
                                </label>
                            </div>

                            <div style={{ display: 'flex', gap: 12 }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: 16, borderRadius: 16, border: 'none', background: '#f2f4f6' }}>취소</button>
                                <button type="submit" style={{ flex: 1, padding: 16, borderRadius: 16, border: 'none', background: '#3182f6', color: '#fff', fontWeight: 700 }}>저장하기</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
                .modal-card { background: #fff; padding: 32px; borderRadius: 24px; width: 550px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); }
                .form-group { margin-bottom: 16px; }
                .form-group label { display: block; margin-bottom: 6px; font-weight: 700; font-size: 13px; color: #4e5968; }
                .form-group input { width: 100%; padding: 12px; borderRadius: 12px; border: 1px solid #e5e8eb; }
            `}</style>
        </div>
    );
}
