import React, { useState, useEffect } from 'react';
import { getProducts, getStores, getCategoryTree, deleteProduct, getFullImageUrl, bulkDeleteProducts, bulkUpdateProductStatus } from '../api';
import { useLocation } from 'react-router-dom';
import RegisterProductA from './RegisterProductA';
import RegisterProductB from './RegisterProductB';
import MobilePreview from './MobilePreview';

export default function ProductManager({ token, user }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('LIST');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [previewProduct, setPreviewProduct] = useState(null);
    
    // Bulk Selection State
    const [selectedIds, setSelectedIds] = useState([]);
    
    // DB 카테고리 및 매장 데이터
    const [categoryTree, setCategoryTree] = useState([]);
    const [stores, setStores] = useState([]);
    
    // Pagination & Filter State
    const [page, setPage] = useState(1);
    const [limit] = useState(15);
    const [search, setSearch] = useState('');
    const [selectedStoreId, setSelectedStoreId] = useState('');
    const [selectedCatId, setSelectedCatId] = useState('');
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const location = useLocation();
    const isAdmin = user?.role === 'ADMIN';

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const storeIdFromUrl = params.get('storeId');
        if (storeIdFromUrl) setSelectedStoreId(storeIdFromUrl);
        loadInitialData();
    }, []);

    useEffect(() => {
        loadProducts();
        setSelectedIds([]); // 필터 변경 시 선택 초기화
    }, [page, selectedStoreId, selectedCatId]);

    const loadInitialData = async () => {
        try {
            const [storeRes, treeData] = await Promise.all([
                getStores(),
                getCategoryTree()
            ]);
            setStores(storeRes.stores || []);
            setCategoryTree(treeData || []);
        } catch (e) { console.error(e); }
    };

    const loadProducts = async (currentSearch = search) => {
        setLoading(true);
        try {
            const params = {
                page,
                limit,
                search: currentSearch,
                storeId: user?.role === 'STAFF' ? user.assignedStoreId : (selectedStoreId || undefined),
                category: selectedCatId || undefined
            };
            const data = await getProducts(params);
            setProducts(data.products);
            setTotalCount(data.totalCount);
            setTotalPages(data.totalPages);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setPage(1);
        loadProducts(search);
    };

    // Bulk Actions
    const toggleSelectAll = () => {
        if (selectedIds.length === products.length) setSelectedIds([]);
        else setSelectedIds(products.map(p => p._id));
    };

    const toggleSelect = (id) => {
        if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(i => i !== id));
        else setSelectedIds([...selectedIds, id]);
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`선택한 ${selectedIds.length}개의 상품을 정말 삭제하시겠습니까?`)) return;
        try {
            await bulkDeleteProducts(selectedIds);
            setSelectedIds([]);
            loadProducts();
        } catch (e) {
            alert(e.response?.data?.error || e.response?.data?.message || '일괄 삭제 실패');
        }
    };

    const handleBulkStatusUpdate = async (status) => {
        try {
            await bulkUpdateProductStatus(selectedIds, status);
            setSelectedIds([]);
            loadProducts();
        } catch (e) { alert('일괄 상태 변경 실패'); }
    };

    const handleEdit = (product) => {
        setSelectedProduct(product);
        setViewMode(product.display_template === 'B' ? 'B' : 'A');
    };

    const handleDelete = async (id) => {
        if (!window.confirm('상품을 삭제하시겠습니까?')) return;
        try {
            await deleteProduct(id);
            loadProducts();
        } catch (e) {
            alert(e.response?.data?.error || e.response?.data?.message || '삭제 실패');
        }
    };

    return (
        <div className="product-manager-container">
            {viewMode === 'LIST' ? (
                <>
                    <header className="page-header">
                        <div className="title-group">
                            <h1>📦 상품 통합 관제</h1>
                            <p>{isAdmin ? '스타필드 전체 입점 매장의 상품 현황을 통합 관리합니다.' : '나의 매장에 등록된 모든 상품을 관리합니다.'}</p>
                        </div>
                        {!isAdmin && (
                            <div className="action-btns">
                                <button onClick={() => { setSelectedProduct(null); setViewMode('A'); }} className="btn-add navy">+ 정찰제 상품</button>
                                <button onClick={() => { setSelectedProduct(null); setViewMode('B'); }} className="btn-add blue">+ 옵션형 상품</button>
                            </div>
                        )}
                    </header>

                    <div className="control-bar">
                        <div className="filter-group">
                            {isAdmin && (
                                <select value={selectedStoreId} onChange={(e) => { setSelectedStoreId(e.target.value); setPage(1); }}>
                                    <option value="">🏢 모든 매장 보기</option>
                                    {stores.map(s => <option key={s._id} value={s._id}>{s.name} ({s.floor})</option>)}
                                </select>
                            )}
                            <select value={selectedCatId} onChange={(e) => { setSelectedCatId(e.target.value); setPage(1); }}>
                                <option value="">🏷️ 전체 카테고리</option>
                                {categoryTree.map(main => (
                                    <React.Fragment key={main._id}>
                                        <option value={main._id}>[{main.name}]</option>
                                        {main.children?.map(sub => <option key={sub._id} value={sub._id}>&nbsp;&nbsp;ㄴ {sub.name}</option>)}
                                    </React.Fragment>
                                ))}
                            </select>
                        </div>
                        <form className="search-box" onSubmit={handleSearchSubmit}>
                            <input placeholder="상품명, 브랜드 검색..." value={search} onChange={e => setSearch(e.target.value)} />
                            <button type="submit">🔍</button>
                        </form>
                    </div>

                    <div className={`table-wrapper ${loading ? 'loading' : ''}`}>
                        <table className="enterprise-table">
                            <thead>
                                <tr>
                                    <th style={{ width: 40 }}><input type="checkbox" checked={selectedIds.length > 0 && selectedIds.length === products.length} onChange={toggleSelectAll} /></th>
                                    <th>상품 정보</th>
                                    <th>카테고리 / 브랜드</th>
                                    <th>매장</th>
                                    <th>가격 / 재고</th>
                                    <th>판매 지표</th>
                                    <th className="text-right">관리</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map(p => {
                                    const mainImg = p.images?.main || (p.product_images?.[0]);
                                    const totalStock = p.variants?.reduce((acc, v) => acc + (v.stock_quantity || 0), 0) || 0;
                                    const isSoldOut = totalStock <= 0;

                                    return (
                                        <tr key={p._id} className={selectedIds.includes(p._id) ? 'selected' : ''}>
                                            <td><input type="checkbox" checked={selectedIds.includes(p._id)} onChange={() => toggleSelect(p._id)} /></td>
                                            <td>
                                                <div className="prod-info">
                                                    {mainImg ? (
                                                        <img src={getFullImageUrl(mainImg)} className="prod-thumb" alt="" />
                                                    ) : (
                                                        <div className="prod-thumb empty">🎁</div>
                                                    )}
                                                    <div>
                                                        <div className="prod-name">{p.name}</div>
                                                        <div className="prod-type">{p.display_template === 'B' ? '옵션형' : '정찰제'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="prod-cat">{p.category?.name || '미분류'}</div>
                                                <div className="prod-brand">{p.brand || '-'}</div>
                                            </td>
                                            <td><span className="store-badge">{p.storeId?.name || '정보없음'}</span></td>
                                            <td>
                                                <div className="price">{Number(p.base_price || 0).toLocaleString()}원</div>
                                                <div className={`stock ${isSoldOut ? 'soldout' : ''}`}>
                                                    {isSoldOut ? '품절' : `재고 ${totalStock}개`}
                                                </div>
                                            </td>
                                            <td>
                                                {p.sales_stats?.sold_count > 0 ? (
                                                    <span className="sales-badge">🔥 {p.sales_stats.sold_count}개 판매됨</span>
                                                ) : (
                                                    <span className="sales-badge none">판매 기록 없음</span>
                                                )}
                                            </td>
                                            <td className="text-right">
                                                <div className="action-btns">
                                                    <button onClick={() => handleEdit(p)} className="btn-icon gray">수정</button>
                                                    <button onClick={() => setPreviewProduct(p)} className="btn-icon blue">미리보기</button>
                                                    <button onClick={() => handleDelete(p._id)} className="btn-icon red">삭제</button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {products.length === 0 && !loading && <div className="empty-state">조건에 맞는 상품이 없습니다.</div>}
                    </div>

                    {selectedIds.length > 0 && (
                        <div className="bulk-action-bar">
                            <div className="selection-info"><span>{selectedIds.length}</span>개의 상품 선택됨</div>
                            <div className="bulk-btns">
                                <button onClick={() => handleBulkStatusUpdate('ON_SALE')} className="bulk-btn">✅ 일괄 판매</button>
                                <button onClick={() => handleBulkStatusUpdate('HIDDEN')} className="bulk-btn gray">🚫 일괄 숨김</button>
                                <button onClick={handleBulkDelete} className="bulk-btn red">🗑️ 일괄 삭제</button>
                            </div>
                        </div>
                    )}

                    <footer className="pagination-bar">
                        <button disabled={page === 1} onClick={() => setPage(page - 1)}>이전</button>
                        <div className="page-info"><span>{page}</span> / {totalPages || 1} (총 {totalCount}개)</div>
                        <button disabled={page === totalPages || totalPages === 0} onClick={() => setPage(page + 1)}>다음</button>
                    </footer>
                </>
            ) : (
                <div className="editor-container">
                    <header className="editor-header">
                        <button onClick={() => setViewMode('LIST')} className="btn-back">← 리스트로 돌아가기</button>
                        <h2>{selectedProduct ? '상품 정보 수정' : '신규 상품 등록'}</h2>
                    </header>
                    {viewMode === 'A' && <RegisterProductA token={token} user={user} onSuccess={() => { setViewMode('LIST'); loadProducts(); }} initialData={selectedProduct} />}
                    {viewMode === 'B' && <RegisterProductB token={token} user={user} onSuccess={() => { setViewMode('LIST'); loadProducts(); }} initialData={selectedProduct} />}
                </div>
            )}

            {previewProduct && (
                <MobilePreview 
                    product={previewProduct} 
                    onClose={() => setPreviewProduct(null)} 
                />
            )}

            <style>{`
                .product-manager-container { max-width: 1200px; margin: 0 auto; padding: 20px; position: relative; }
                .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
                .title-group h1 { font-size: 32px; font-weight: 900; color: #1a1f27; }
                .title-group p { color: #8b95a1; margin-top: 8px; }
                .btn-add { border: none; padding: 12px 24px; border-radius: 14px; font-weight: 700; cursor: pointer; color: #fff; }
                .btn-add.navy { background: #1a1f27; }
                .btn-add.blue { background: #3182f6; }

                .control-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; gap: 20px; }
                .filter-group { display: flex; gap: 12px; flex: 1; }
                .filter-group select { padding: 12px; border-radius: 12px; border: 1px solid #e5e8eb; background: #fff; font-weight: 700; min-width: 180px; }

                .search-box { display: flex; flex: 1; max-width: 350px; background: #fff; border: 1px solid #e5e8eb; border-radius: 12px; padding: 4px 12px; }
                .search-box input { flex: 1; border: none; padding: 8px; outline: none; }
                .search-box button { border: none; background: none; }

                .table-wrapper { background: #fff; border-radius: 20px; border: 1px solid #e5e8eb; overflow: hidden; margin-bottom: 20px; }
                .enterprise-table { width: 100%; border-collapse: collapse; }
                .enterprise-table th { background: #f9fafb; padding: 16px; text-align: left; font-size: 13px; color: #8b95a1; border-bottom: 1px solid #e5e8eb; }
                .enterprise-table td { padding: 16px; border-bottom: 1px solid #f2f4f6; font-size: 14px; }
                .enterprise-table tr.selected { background: #f0f7ff; }

                .prod-info { display: flex; align-items: center; gap: 12px; }
                .prod-thumb { width: 48px; height: 48px; border-radius: 12px; object-fit: cover; background: #f9fafb; }
                .prod-name { font-weight: 800; color: #1a1f27; }
                .prod-type { font-size: 11px; color: #3182f6; font-weight: 700; background: #e8f3ff; padding: 2px 6px; border-radius: 4px; display: inline-block; margin-top: 4px; }

                .store-badge { background: #f2f4f6; color: #4e5968; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 700; }
                .price { font-weight: 900; color: #1a1f27; font-size: 16px; }
                .stock { font-size: 12px; font-weight: 700; color: #00c471; margin-top: 4px; }
                .stock.soldout { color: #f04452; }
                .sales-badge { font-size: 12px; font-weight: 800; color: #f04452; background: #fff0f0; padding: 4px 8px; border-radius: 6px; }

                .action-btns { display: flex; gap: 6px; justify-content: flex-end; }
                .btn-icon { border: none; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer; }
                .btn-icon.gray { background: #f2f4f6; color: #4e5968; }
                .btn-icon.blue { background: #e8f3ff; color: #3182f6; }
                .btn-icon.red { background: #fff0f0; color: #f04452; }

                .bulk-action-bar { position: fixed; bottom: 40px; left: 50%; transform: translateX(-50%); background: #1a1f27; color: #fff; padding: 16px 32px; border-radius: 20px; display: flex; align-items: center; gap: 40px; box-shadow: 0 20px 40px rgba(0,0,0,0.3); z-index: 1000; animation: slideUp 0.3s ease; }
                @keyframes slideUp { from { bottom: -100px; } to { bottom: 40px; } }
                .selection-info span { color: #3182f6; font-weight: 900; margin-right: 4px; }
                .bulk-btns { display: flex; gap: 12px; }
                .bulk-btn { border: none; padding: 10px 20px; border-radius: 12px; font-weight: 700; cursor: pointer; background: #3182f6; color: #fff; }
                .bulk-btn.gray { background: #4e5968; }
                .bulk-btn.red { background: #f04452; }

                .pagination-bar { display: flex; justify-content: center; align-items: center; gap: 30px; margin-top: 30px; }
                .pagination-bar button { padding: 8px 20px; border-radius: 10px; border: 1px solid #e5e8eb; background: #fff; font-weight: 700; cursor: pointer; }
                .page-info { font-weight: 700; color: #4e5968; }

                .empty-state { padding: 60px; text-align: center; color: #8b95a1; font-weight: 600; }
                .text-right { text-align: right; }
            `}</style>
        </div>
    );
}
