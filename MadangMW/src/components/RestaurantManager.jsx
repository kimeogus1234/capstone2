import React, { useState, useEffect } from 'react';
import { getRestaurants, createRestaurant, updateRestaurant, deleteRestaurant, getFullImageUrl, getFloors } from '../api';
import { useNavigate } from 'react-router-dom';
import { ImageUploader } from './ContentBlockEditor';
import LocationPickerModal from './LocationPickerModal';

export default function RestaurantManager({ token, user }) {
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [floors, setFloors] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
    const [editingRestaurant, setEditingRestaurant] = useState(null);
    
    // Pagination & Filter State
    const [page, setPage] = useState(1);
    const [limit] = useState(15);
    const [search, setSearch] = useState('');
    const [floorFilter, setFloorFilter] = useState('ALL');
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const [formData, setFormData] = useState({
        name: '', floor: '1F', locationCode: '', description: '', hours: '11:00 - 21:00', imageUrl: '', mapX: null, mapY: null, cuisineType: '한식'
    });

    const navigate = useNavigate();
    const isAdmin = user?.role === 'ADMIN';

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        fetchRestaurants();
    }, [page, floorFilter]);

    const loadInitialData = async () => {
        try {
            const data = await getFloors();
            setFloors(data || []);
            if (data?.length > 0) setFormData(p => ({ ...p, floor: data[0] }));
        } catch (e) { console.error(e); }
    };

    const fetchRestaurants = async (currentSearch = search) => {
        setLoading(true);
        try {
            const data = await getRestaurants({
                page,
                limit,
                search: currentSearch,
                floor: floorFilter === 'ALL' ? undefined : floorFilter
            });
            setRestaurants(data.restaurants);
            setTotalCount(data.totalCount);
            setTotalPages(data.totalPages);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setPage(1);
        fetchRestaurants(search);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingRestaurant) await updateRestaurant(editingRestaurant._id, formData);
            else await createRestaurant(formData);
            setIsModalOpen(false);
            setEditingRestaurant(null);
            fetchRestaurants();
        } catch (error) { alert('저장 중 오류가 발생했습니다.'); }
    };

    const handleEdit = (restaurant) => {
        setEditingRestaurant(restaurant);
        setFormData({ ...restaurant });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('식당을 삭제하시겠습니까?')) return;
        try {
            await deleteRestaurant(id);
            fetchRestaurants();
        } catch (e) { alert('삭제 실패'); }
    };

    const cuisineTypes = ['한식', '중식', '일식', '양식', '카페/디저트', '패스트푸드', '기타'];

    return (
        <div className="restaurant-manager-container">
            <header className="page-header">
                <div className="title-group">
                    <h1>🍴 식당 및 메뉴 관제</h1>
                    <p>F&B 매장의 위치 지정, 메뉴 구성 및 실시간 운영 상태를 관리합니다.</p>
                </div>
                {isAdmin && (
                    <button className="btn-add" onClick={() => { setEditingRestaurant(null); setIsModalOpen(true); }}>
                        + 신규 식당 등록
                    </button>
                )}
            </header>

            <div className="control-bar">
                <div className="filter-group">
                    <div className="tabs">
                        {['ALL', ...floors].map(f => (
                            <button key={f} className={floorFilter === f ? 'active' : ''} onClick={() => { setFloorFilter(f); setPage(1); }}>
                                {f === 'ALL' ? '전체 층' : f}
                            </button>
                        ))}
                    </div>
                </div>
                <form className="search-box" onSubmit={handleSearchSubmit}>
                    <input placeholder="식당명 검색..." value={search} onChange={e => setSearch(e.target.value)} />
                    <button type="submit">🔍</button>
                </form>
            </div>

            <div className={`table-wrapper ${loading ? 'loading' : ''}`}>
                <table className="enterprise-table">
                    <thead>
                        <tr>
                            <th>식당 정보</th>
                            <th>분류</th>
                            <th>위치 (층/코드)</th>
                            <th>영업 시간</th>
                            <th className="text-right">관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        {restaurants.map(res => (
                            <tr key={res._id}>
                                <td>
                                    <div className="res-info">
                                        {res.imageUrl ? (
                                            <img src={getFullImageUrl(res.imageUrl)} className="res-thumb" alt="" />
                                        ) : (
                                            <div className="res-thumb empty">🥗</div>
                                        )}
                                        <div>
                                            <div className="res-name">{res.name}</div>
                                            <div className="res-desc">{res.description || '매장 설명 없음'}</div>
                                        </div>
                                    </div>
                                </td>
                                <td><span className="cuisine-badge">{res.cuisineType || '미지정'}</span></td>
                                <td>
                                    <span className="floor-badge">{res.floor}</span>
                                    <code className="loc-code">{res.locationCode}</code>
                                </td>
                                <td><span className="hours-text">🕒 {res.hours}</span></td>
                                <td className="text-right">
                                    <div className="action-btns">
                                        <button onClick={() => navigate(`/menus?restaurantId=${res._id}`)} className="btn-icon blue">📜 메뉴 관리</button>
                                        <button onClick={() => handleEdit(res)} className="btn-icon gray">수정</button>
                                        {isAdmin && <button onClick={() => handleDelete(res._id)} className="btn-icon red">삭제</button>}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {restaurants.length === 0 && !loading && <div className="empty-state">검색 결과가 없습니다.</div>}
            </div>

            <footer className="pagination-bar">
                <button disabled={page === 1} onClick={() => setPage(page - 1)}>이전</button>
                <div className="page-info"><span>{page}</span> / {totalPages || 1} (총 {totalCount}개)</div>
                <button disabled={page === totalPages || totalPages === 0} onClick={() => setPage(page + 1)}>다음</button>
            </footer>

            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-content large" onClick={e => e.stopPropagation()}>
                        <h2>{editingRestaurant ? '식당 정보 수정' : '신규 식당 등록'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-grid">
                                <div className="side-panel">
                                    <label>식당 이미지</label>
                                    <div className="image-preview-box">
                                        {formData.imageUrl ? (
                                            <div className="img-wrap">
                                                <img src={getFullImageUrl(formData.imageUrl)} alt="" />
                                                <button type="button" onClick={() => setFormData({ ...formData, imageUrl: '' })}>✕</button>
                                            </div>
                                        ) : (
                                            <ImageUploader token={token} onUpload={(url) => setFormData({ ...formData, imageUrl: url })} />
                                        )}
                                    </div>
                                </div>
                                <div className="main-panel">
                                    <div className="form-grid">
                                        <div className="input-box full">
                                            <label>식당명</label>
                                            <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                                        </div>
                                        <div className="input-box">
                                            <label>요리 종류</label>
                                            <select value={formData.cuisineType} onChange={e => setFormData({ ...formData, cuisineType: e.target.value })}>
                                                {cuisineTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                        <div className="input-box">
                                            <label>층수</label>
                                            <select value={formData.floor} onChange={e => setFormData({ ...formData, floor: e.target.value })}>
                                                {floors.map(f => <option key={f} value={f}>{f}</option>)}
                                            </select>
                                        </div>
                                        <div className="input-box">
                                            <label>영업 시간</label>
                                            <input value={formData.hours} onChange={e => setFormData({ ...formData, hours: e.target.value })} />
                                        </div>
                                        <div className="input-box">
                                            <label>위치 코드</label>
                                            <input value={formData.locationCode} onChange={e => setFormData({ ...formData, locationCode: e.target.value })} required />
                                        </div>
                                        <div className="input-box full">
                                            <label>상세 위치 지정</label>
                                            <div className="loc-picker-row">
                                                <div className="loc-display">
                                                    {formData.mapX ? `📍 (X:${formData.mapX.toFixed(1)}%, Y:${formData.mapY.toFixed(1)}%)` : '지도 위치 미지정'}
                                                </div>
                                                <button type="button" onClick={() => setIsLocationPickerOpen(true)}>지도에서 선택</button>
                                            </div>
                                        </div>
                                        <div className="input-box full">
                                            <label>설명</label>
                                            <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setIsModalOpen(false)}>취소</button>
                                <button type="submit" className="primary">저장하기</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isLocationPickerOpen && (
                <LocationPickerModal 
                    initialFloor={formData.floor}
                    onSelect={({ floor, x, y, markerId }) => {
                        setFormData({ ...formData, floor, mapX: x, mapY: y, markerId });
                        setIsLocationPickerOpen(false);
                    }}
                    onClose={() => setIsLocationPickerOpen(false)}
                />
            )}

            <style>{`
                .restaurant-manager-container { max-width: 1200px; margin: 0 auto; padding: 20px; }
                .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
                .title-group h1 { font-size: 32px; font-weight: 900; color: #1a1f27; }
                .title-group p { color: #8b95a1; margin-top: 8px; }
                .btn-add { background: #1a1f27; color: #fff; border: none; padding: 12px 24px; border-radius: 14px; font-weight: 700; cursor: pointer; transition: 0.2s; }

                .control-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; gap: 20px; }
                .tabs { display: flex; background: #f2f4f6; padding: 4px; border-radius: 12px; }
                .tabs button { border: none; background: none; padding: 8px 16px; border-radius: 10px; font-size: 14px; font-weight: 600; color: #4e5968; cursor: pointer; }
                .tabs button.active { background: #fff; color: #1a1f27; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }

                .search-box { display: flex; flex: 1; max-width: 400px; background: #fff; border: 1px solid #e5e8eb; border-radius: 12px; padding: 4px 12px; }
                .search-box input { flex: 1; border: none; padding: 8px; outline: none; }
                .search-box button { border: none; background: none; }

                .table-wrapper { background: #fff; border-radius: 20px; border: 1px solid #e5e8eb; overflow: hidden; }
                .enterprise-table { width: 100%; border-collapse: collapse; }
                .enterprise-table th { background: #f9fafb; padding: 16px; text-align: left; font-size: 13px; color: #8b95a1; border-bottom: 1px solid #e5e8eb; }
                .enterprise-table td { padding: 16px; border-bottom: 1px solid #f2f4f6; font-size: 14px; }

                .res-info { display: flex; align-items: center; gap: 12px; }
                .res-thumb { width: 48px; height: 48px; border-radius: 12px; object-fit: cover; }
                .res-thumb.empty { background: #f2f4f6; display: flex; align-items: center; justify-content: center; font-size: 20px; }
                .res-name { font-weight: 700; color: #1a1f27; }
                .res-desc { font-size: 12px; color: #8b95a1; margin-top: 2px; }

                .cuisine-badge { background: #f2f4f6; color: #4e5968; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; }
                .floor-badge { background: #1a1f27; color: #fff; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 800; margin-right: 8px; }
                .loc-code { color: #3182f6; font-family: monospace; font-weight: 700; }
                .hours-text { font-size: 12px; color: #8b95a1; font-weight: 600; }

                .action-btns { display: flex; gap: 6px; justify-content: flex-end; }
                .btn-icon { border: none; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer; }
                .btn-icon.blue { background: #e8f3ff; color: #3182f6; }
                .btn-icon.gray { background: #f2f4f6; color: #4e5968; }
                .btn-icon.red { background: #fff0f0; color: #f04452; }

                .pagination-bar { display: flex; justify-content: center; align-items: center; gap: 30px; margin-top: 30px; }
                .pagination-bar button { padding: 8px 20px; border-radius: 10px; border: 1px solid #e5e8eb; background: #fff; font-weight: 700; cursor: pointer; }
                .page-info { font-weight: 700; color: #4e5968; }
                .page-info span { color: #3182f6; }

                .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2000; }
                .modal-content.large { background: #fff; width: 800px; max-height: 90vh; overflow-y: auto; padding: 40px; border-radius: 30px; }
                .modal-grid { display: grid; grid-template-columns: 200px 1fr; gap: 40px; margin-bottom: 30px; }
                .image-preview-box { width: 200px; height: 200px; border-radius: 20px; overflow: hidden; background: #f9fafb; border: 1px dashed #d1d6db; }
                .img-wrap { position: relative; width: 100%; height: 100%; }
                .img-wrap img { width: 100%; height: 100%; object-fit: cover; }
                .img-wrap button { position: absolute; top: 8px; right: 8px; background: #f04452; color: #fff; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; }

                .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                .input-box.full { grid-column: 1 / -1; }
                .input-box label { display: block; font-size: 13px; font-weight: 700; color: #4e5968; margin-bottom: 8px; }
                .input-box input, .input-box select, .input-box textarea { width: 100%; padding: 12px; border-radius: 12px; border: 1px solid #e5e8eb; background: #f9fafb; font-family: inherit; }

                .loc-picker-row { display: flex; gap: 12px; align-items: center; }
                .loc-display { flex: 1; padding: 12px; background: #fff; border: 1px solid #e5e8eb; border-radius: 12px; font-size: 13px; color: #3182f6; font-weight: 600; }
                .loc-picker-row button { background: #1a1f27; color: #fff; border: none; padding: 12px 16px; border-radius: 12px; font-weight: 700; cursor: pointer; }

                .modal-footer { display: flex; gap: 12px; margin-top: 32px; }
                .modal-footer button { flex: 1; padding: 16px; border-radius: 14px; border: none; font-weight: 700; cursor: pointer; background: #f2f4f6; color: #4e5968; }
                .modal-footer button.primary { background: #3182f6; color: #fff; }
                
                .empty-state { padding: 60px; text-align: center; color: #8b95a1; font-weight: 600; }
            `}</style>
        </div>
    );
}
