import React, { useState, useEffect } from 'react';
import { getStores, createStore, updateStore, deleteStore, getFullImageUrl, getFloors, getStoreDeletePreview } from '../api';
import { useNavigate } from 'react-router-dom';
import { ImageUploader } from './ContentBlockEditor';
import LocationPickerModal from './LocationPickerModal';

export default function StoreManager({ token, user }) {
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [floors, setFloors] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStore, setEditingStore] = useState(null);
    const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
    
    // Pagination & Filter State
    const [page, setPage] = useState(1);
    const [limit] = useState(15);
    const [search, setSearch] = useState('');
    const [floorFilter, setFloorFilter] = useState('ALL');
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const [formData, setFormData] = useState({
        name: '', categories: [], floor: '1F', locationCode: '', description: '', hours: '10:00 - 22:00', imageUrl: '', type: 'STORE'
    });

    const navigate = useNavigate();
    const isAdmin = user?.role === 'ADMIN';

    // Delete Confirmation Modal State
    const [deleteModalStore, setDeleteModalStore] = useState(null); // The store being deleted
    const [deletePreview, setDeletePreview] = useState(null); // Preview data: { storeName, products, staff }
    const [confirmStoreName, setConfirmStoreName] = useState(''); // User's typed input
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        fetchStores();
    }, [page, floorFilter]);

    const loadInitialData = async () => {
        try {
            const [floorData, treeData] = await Promise.all([
                getFloors(),
                import('../api').then(m => m.getCategoryTree())
            ]);
            setFloors(floorData || []);
            setCategories(treeData);
            if (floorData?.length > 0) setFormData(p => ({ ...p, floor: floorData[0] }));
        } catch (e) { console.error(e); }
    };

    const fetchStores = async (currentSearch = search) => {
        setLoading(true);
        try {
            const data = await getStores({
                page,
                limit,
                search: currentSearch,
                floor: floorFilter === 'ALL' ? undefined : floorFilter,
                type: 'STORE'
            });
            setStores(data.stores);
            setTotalCount(data.totalCount);
            setTotalPages(data.totalPages);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setPage(1);
        fetchStores(search);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.categories?.length) return alert('최소 하나 이상의 업종을 선택해야 합니다.');
        try {
            if (editingStore) await updateStore(editingStore._id, formData);
            else await createStore(formData);
            setIsModalOpen(false);
            setEditingStore(null);
            fetchStores();
        } catch (error) { 
            alert(error.response?.data?.message || error.message || '오류가 발생했습니다.'); 
        }
    };

    const handleEdit = (store) => {
        setEditingStore(store);
        const existingCats = store.categories?.map(c => typeof c === 'object' ? c._id : c) || [];
        setFormData({ ...store, categories: existingCats });
        setIsModalOpen(true);
    };

    const getAllIds = (cat) => {
        let ids = [cat._id];
        if (cat.children) cat.children.forEach(child => ids = [...ids, ...getAllIds(child)]);
        return ids;
    };

    const toggleCategory = (cat) => {
        const idsToToggle = getAllIds(cat);
        setFormData(prev => {
            const current = prev.categories || [];
            const isRemoving = current.includes(idsToToggle[0]);
            const newCategories = isRemoving 
                ? current.filter(id => !idsToToggle.includes(id))
                : Array.from(new Set([...current, ...idsToToggle]));
            return { ...prev, categories: newCategories };
        });
    };

    const handleDeleteClick = async (store) => {
        try {
            const previewData = await getStoreDeletePreview(store._id);
            setDeleteModalStore(store);
            setDeletePreview(previewData);
            setConfirmStoreName('');
        } catch (e) {
            alert('삭제 미리보기 데이터를 가져오는데 실패했습니다.');
        }
    };

    const handleConfirmDelete = async () => {
        if (!deleteModalStore || !deletePreview) return;
        if (confirmStoreName !== deletePreview.storeName) {
            return alert('매장 이름이 일치하지 않습니다.');
        }
        
        setIsDeleting(true);
        try {
            await deleteStore(deleteModalStore._id);
            setDeleteModalStore(null);
            setDeletePreview(null);
            setConfirmStoreName('');
            fetchStores();
        } catch (e) {
            alert('매장 삭제에 실패했습니다.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="store-manager-container">
            <header className="page-header">
                <div className="title-group">
                    <h1>🏢 매장 통합 관제</h1>
                    <p>스타필드 내 모든 매장의 위치, 업종, 상태를 실시간으로 관리합니다.</p>
                </div>
                {isAdmin && (
                    <button className="btn-add" onClick={() => { setEditingStore(null); setIsModalOpen(true); }}>
                        + 신규 매장 등록
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
                    <input placeholder="매장명, 위치코드 검색..." value={search} onChange={e => setSearch(e.target.value)} />
                    <button type="submit">🔍</button>
                </form>
            </div>

            <div className={`table-wrapper ${loading ? 'loading' : ''}`}>
                <table className="enterprise-table">
                    <thead>
                        <tr>
                            <th>매장 정보</th>
                            <th>위치 (층/코드)</th>
                            <th>지정 업종</th>
                            <th>지도 상태</th>
                            <th className="text-right">관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stores.map(store => (
                            <tr key={store._id}>
                                <td>
                                    <div className="store-info">
                                        {store.imageUrl ? (
                                            <img src={getFullImageUrl(store.imageUrl)} className="store-thumb" alt="" />
                                        ) : (
                                            <div className="store-thumb empty">🏙️</div>
                                        )}
                                        <div>
                                            <div className="store-name">{store.name}</div>
                                            <div className="store-hours">🕒 {store.hours}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span className="floor-badge">{store.floor}</span>
                                    <code className="loc-code">{store.locationCode}</code>
                                </td>
                                <td>
                                    <div className="cat-tags">
                                        {store.categories?.slice(0, 3).map(c => (
                                            <span key={typeof c === 'object' ? c._id : c} className="tag">
                                                {typeof c === 'object' ? c.name : '미지정'}
                                            </span>
                                        ))}
                                        {store.categories?.length > 3 && <span className="tag more">+{store.categories.length - 3}</span>}
                                    </div>
                                </td>
                                <td>
                                    {store.mapX ? (
                                        <span className="map-status active">📍 위치 지정됨</span>
                                    ) : (
                                        <span className="map-status">❌ 미지정</span>
                                    )}
                                </td>
                                <td className="text-right">
                                    <div className="action-btns">
                                        <button onClick={() => navigate(`/products?storeId=${store._id}`)} className="btn-icon blue">📦 상품</button>
                                        {isAdmin && <button onClick={() => handleEdit(store)} className="btn-icon gray">수정</button>}
                                        {isAdmin && <button onClick={() => handleDeleteClick(store)} className="btn-icon red">삭제</button>}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {stores.length === 0 && !loading && <div className="empty-state">조건에 맞는 매장이 없습니다.</div>}
            </div>

            <footer className="pagination-bar">
                <button disabled={page === 1} onClick={() => setPage(page - 1)}>이전</button>
                <div className="page-info"><span>{page}</span> / {totalPages || 1} (총 {totalCount}개)</div>
                <button disabled={page === totalPages || totalPages === 0} onClick={() => setPage(page + 1)}>다음</button>
            </footer>

            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-content large" onClick={e => e.stopPropagation()}>
                        <h2>{editingStore ? '매장 정보 수정' : '신규 매장 등록'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-grid">
                                <div className="side-panel">
                                    <label>매장 이미지</label>
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
                                    <div className="input-row">
                                        <div className="input-box">
                                            <label>매장명</label>
                                            <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                                        </div>
                                    </div>
                                    <div className="input-row split">
                                        <div className="input-box">
                                            <label>층수</label>
                                            <select value={formData.floor} onChange={e => setFormData({ ...formData, floor: e.target.value })}>
                                                {floors.map(f => <option key={f} value={f}>{f}</option>)}
                                            </select>
                                        </div>
                                        <div className="input-box">
                                            <label>위치 코드</label>
                                            <input value={formData.locationCode} onChange={e => setFormData({ ...formData, locationCode: e.target.value })} required />
                                        </div>
                                    </div>
                                    <div className="input-box">
                                        <label>영업 시간</label>
                                        <input value={formData.hours} onChange={e => setFormData({ ...formData, hours: e.target.value })} />
                                    </div>
                                    <div className="location-picker-box">
                                        <label>지도 상세 위치</label>
                                        <div className="loc-info">
                                            <span>{formData.mapX ? `📍 ${formData.floor} (X:${formData.mapX.toFixed(1)}%, Y:${formData.mapY.toFixed(1)}%)` : '지도상 위치 미지정'}</span>
                                            <button type="button" onClick={() => setIsLocationPickerOpen(true)}>위치 지정하기</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="category-section">
                                <label>📌 취급 업종 (중복 선택 가능)</label>
                                <div className="cat-tree-container">
                                    {categories.map(main => (
                                        <div key={main._id} className="cat-group">
                                            <div className="cat-main" onClick={() => toggleCategory(main)}>
                                                📁 {main.name} <span>(전체선택/해제)</span>
                                            </div>
                                            <div className="cat-subs">
                                                {main.children?.map(sub => (
                                                    <div 
                                                        key={sub._id} 
                                                        className={`cat-sub ${formData.categories?.includes(sub._id) ? 'selected' : ''}`}
                                                        onClick={() => toggleCategory(sub)}
                                                    >
                                                        {sub.name}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" onClick={() => setIsModalOpen(false)}>취소</button>
                                <button type="submit" className="primary">{editingStore ? '저장하기' : '등록하기'}</button>
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

            {deletePreview && (
                <div className="modal-overlay" onClick={() => { setDeleteModalStore(null); setDeletePreview(null); }}>
                    <div className="modal-content delete-modal" onClick={e => e.stopPropagation()}>
                        <div className="delete-header">
                            <span className="warning-icon">⚠️</span>
                            <h2>매장 영구 삭제 경고</h2>
                        </div>
                        
                        <div className="delete-body">
                            <p className="main-warning">
                                <strong>{deletePreview.storeName}</strong> 매장을 삭제하시겠습니까?<br />
                                이 작업은 되돌릴 수 없으며, 매장과 연결된 아래의 모든 데이터가 <strong>영구적으로 삭제</strong>됩니다.
                            </p>

                            <div className="preview-section">
                                <h3>📦 함께 삭제될 상품 목록 ({deletePreview.products.length}개)</h3>
                                <div className="preview-list">
                                    {deletePreview.products.length > 0 ? (
                                        deletePreview.products.map(p => (
                                            <div key={p._id} className="preview-item">
                                                <span>• {p.name}</span>
                                                <span className="price-tag">({p.base_price.toLocaleString()}원)</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="empty-preview">삭제될 상품이 없습니다.</div>
                                    )}
                                </div>
                            </div>

                            <div className="preview-section">
                                <h3>👥 함께 삭제될 직원 계정 목록 ({deletePreview.staff.length}개)</h3>
                                <div className="preview-list">
                                    {deletePreview.staff.length > 0 ? (
                                        deletePreview.staff.map(s => (
                                            <div key={s.id} className="preview-item">
                                                <span>• {s.name} ({s.username})</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="empty-preview">삭제될 직원 계정이 없습니다.</div>
                                    )}
                                </div>
                            </div>

                            <div className="confirm-input-box">
                                <label>
                                    안전을 위해 매장 이름 <strong>{deletePreview.storeName}</strong>을(를) 정확히 입력해 주세요.
                                </label>
                                <input 
                                    type="text" 
                                    placeholder="매장 이름 입력" 
                                    value={confirmStoreName} 
                                    onChange={e => setConfirmStoreName(e.target.value)}
                                    disabled={isDeleting}
                                />
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button 
                                type="button" 
                                onClick={() => { setDeleteModalStore(null); setDeletePreview(null); }}
                                disabled={isDeleting}
                            >
                                취소
                            </button>
                            <button 
                                type="button" 
                                className="primary red" 
                                onClick={handleConfirmDelete}
                                disabled={confirmStoreName !== deletePreview.storeName || isDeleting}
                            >
                                {isDeleting ? '삭제 중...' : '영구 삭제 진행'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .store-manager-container { max-width: 1200px; margin: 0 auto; padding: 20px; }
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

                .store-info { display: flex; align-items: center; gap: 12px; }
                .store-thumb { width: 48px; height: 48px; border-radius: 12px; object-fit: cover; }
                .store-thumb.empty { background: #f2f4f6; display: flex; align-items: center; justify-content: center; font-size: 20px; }
                .store-name { font-weight: 700; color: #1a1f27; }
                .store-hours { font-size: 12px; color: #8b95a1; margin-top: 2px; }

                .floor-badge { background: #1a1f27; color: #fff; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 800; margin-right: 8px; }
                .loc-code { color: #3182f6; font-family: monospace; font-weight: 700; }

                .cat-tags { display: flex; gap: 4px; flex-wrap: wrap; }
                .tag { background: #e8f3ff; color: #3182f6; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; }
                .map-status { font-size: 12px; font-weight: 700; color: #adb5bd; }
                .map-status.active { color: #3182f6; }

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
                
                .input-row.split { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                .input-box { margin-bottom: 20px; }
                .input-box label { display: block; font-size: 13px; font-weight: 700; color: #4e5968; margin-bottom: 8px; }
                .input-box input, .input-box select { width: 100%; padding: 12px; border-radius: 12px; border: 1px solid #e5e8eb; }

                .loc-info { display: flex; justify-content: space-between; align-items: center; background: #f9fafb; padding: 12px; border-radius: 12px; border: 1px solid #e5e8eb; }
                .loc-info button { background: #1a1f27; color: #fff; border: none; padding: 8px 16px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer; }

                .cat-tree-container { margin-top: 12px; border: 1px solid #e5e8eb; border-radius: 16px; padding: 20px; background: #f9fafb; }
                .cat-main { font-weight: 900; font-size: 14px; margin-bottom: 12px; cursor: pointer; }
                .cat-main span { font-size: 11px; color: #8b95a1; }
                .cat-subs { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; padding-left: 20px; }
                .cat-sub { padding: 6px 12px; background: #fff; border: 1px solid #e5e8eb; border-radius: 10px; font-size: 12px; font-weight: 600; cursor: pointer; }
                .cat-sub.selected { background: #3182f6; color: #fff; border-color: #3182f6; }

                .modal-footer { display: flex; gap: 12px; margin-top: 40px; }
                .modal-footer button { flex: 1; padding: 16px; border-radius: 14px; border: none; font-weight: 700; cursor: pointer; background: #f2f4f6; color: #4e5968; }
                .modal-footer button.primary { background: #3182f6; color: #fff; }

                /* ⚠️ Delete Modal Styles */
                .modal-content.delete-modal { background: #fff; width: 550px; max-height: 90vh; overflow-y: auto; padding: 35px; border-radius: 25px; box-shadow: 0 10px 40px rgba(0,0,0,0.15); }
                .delete-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; border-bottom: 2px solid #fff0f0; padding-bottom: 15px; }
                .delete-header h2 { font-size: 22px; font-weight: 900; color: #f04452; margin: 0; }
                .warning-icon { font-size: 28px; }
                .main-warning { font-size: 15px; line-height: 1.6; color: #4e5968; margin-bottom: 25px; }
                .main-warning strong { color: #f04452; font-weight: 800; }
                .preview-section { margin-bottom: 20px; }
                .preview-section h3 { font-size: 14px; font-weight: 700; color: #1a1f27; margin-bottom: 8px; }
                .preview-list { background: #fafafc; border: 1px solid #e5e8eb; border-radius: 12px; max-height: 120px; overflow-y: auto; padding: 12px; }
                .preview-item { display: flex; justify-content: space-between; font-size: 13px; color: #4e5968; padding: 4px 0; border-bottom: 1px dashed #f2f4f6; display: flex; }
                .preview-item:last-child { border-bottom: none; }
                .price-tag { color: #8b95a1; }
                .empty-preview { font-size: 12px; color: #b0b8c1; text-align: center; padding: 10px 0; }
                .confirm-input-box { margin-top: 25px; background: #fff0f0; padding: 18px; border-radius: 15px; border: 1px solid #ffe3e3; }
                .confirm-input-box label { display: block; font-size: 13px; font-weight: 600; color: #f04452; margin-bottom: 10px; }
                .confirm-input-box input { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #ffd2d2; font-size: 14px; outline: none; }
                .confirm-input-box input:focus { border-color: #f04452; box-shadow: 0 0 0 3px rgba(240, 68, 82, 0.15); }
                .modal-footer button.primary.red { background: #f04452; color: #fff; }
                .modal-footer button.primary.red:disabled { background: #ffd2d2; color: #fff; cursor: not-allowed; }
            `}</style>
        </div>
    );
}
