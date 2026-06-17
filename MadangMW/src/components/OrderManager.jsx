import React, { useState, useEffect } from 'react';
import * as api from '../api';

export default function OrderManager({ token }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    
    // Pagination & Filter State
    const [page, setPage] = useState(1);
    const [limit] = useState(15);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    useEffect(() => {
        loadOrders();
    }, [page, statusFilter]);

    const loadOrders = async (currentSearch = search) => {
        setLoading(true);
        try {
            const data = await api.getAllOrders({
                page,
                limit,
                search: currentSearch,
                status: statusFilter === 'ALL' ? undefined : statusFilter
            });
            setOrders(data.orders || []);
            setTotalCount(data.totalCount || 0);
            setTotalPages(data.totalPages || 0);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setPage(1);
        loadOrders(search);
    };

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            await api.updateOrderStatus(orderId, newStatus);
            loadOrders();
        } catch (e) { alert('상태 변경 실패'); }
    };

    const getStatusInfo = (status) => {
        const map = {
            'PAID': { label: '결제완료', color: '#3182f6', bg: '#e8f3ff' },
            'PREPARING': { label: '상품준비', color: '#9c27b0', bg: '#f3e5f5' },
            'SHIPPING': { label: '배송중', color: '#007aff', bg: '#e8f3ff' },
            'DELIVERING': { label: '배달중', color: '#00c471', bg: '#e7f9f1' },
            'COMPLETED': { label: '완료', color: '#00c471', bg: '#e7f9f1' },
            'CANCELLED': { label: '취소완료', color: '#f04452', bg: '#fff0f0' },
            'CANCEL_REQUESTED': { label: '취소요청', color: '#f04452', bg: '#fff0f0' },
            'RETURN_REQUESTED': { label: '반품요청', color: '#ff9800', bg: '#fff3e0' },
            'RETURNED': { label: '반품완료', color: '#ff9800', bg: '#fff3e0' },
            'EXCHANGE_REQUESTED': { label: '교환요청', color: '#9c27b0', bg: '#f3e5f5' },
            'EXCHANGED': { label: '교환완료', color: '#9c27b0', bg: '#f3e5f5' }
        };
        return map[status] || { label: status, color: '#8b95a1', bg: '#f2f4f6' };
    };

    const deliveryTypes = { 'PICKUP': '🛍️ 픽업', 'CAR': '🚗 주차장', 'HOME': '🏠 택배' };
    const statuses = ['ALL', 'PAID', 'PREPARING', 'SHIPPING', 'DELIVERING', 'COMPLETED', 'CANCEL_REQUESTED', 'CANCELLED', 'RETURN_REQUESTED', 'RETURNED', 'EXCHANGE_REQUESTED', 'EXCHANGED'];

    return (
        <div className="order-manager-container">
            <header className="page-header">
                <div className="title-group">
                    <h1>🚚 통합 주문/배송 관제</h1>
                    <p>스타필드 내 모든 주문과 물류 흐름을 실시간으로 모니터링합니다.</p>
                </div>
                <button onClick={() => loadOrders()} className="btn-refresh">🔄 새로고침</button>
            </header>

            <div className="control-bar">
                <div className="filter-group">
                    <div className="tabs">
                        {statuses.map(s => {
                            const info = getStatusInfo(s);
                            return (
                                <button key={s} className={statusFilter === s ? 'active' : ''} onClick={() => { setStatusFilter(s); setPage(1); }}>
                                    {s === 'ALL' ? '전체 주문' : info.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
                <form className="search-box" onSubmit={handleSearchSubmit}>
                    <input placeholder="주문번호, 고객명 검색..." value={search} onChange={e => setSearch(e.target.value)} />
                    <button type="submit">🔍</button>
                </form>
            </div>

            <div className={`table-wrapper ${loading ? 'loading' : ''}`}>
                <table className="enterprise-table">
                    <thead>
                        <tr>
                            <th>주문 ID / 일시</th>
                            <th>고객 / 배송지</th>
                            <th>주문 상품</th>
                            <th>금액</th>
                            <th>상태</th>
                            <th className="text-right">액션</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map(o => (
                            <tr key={o._id}>
                                <td>
                                    <div className="order-id-box">
                                        <div className="order-id">{o.orderId || 'N/A'}</div>
                                        <div className="order-time">{new Date(o.createdAt).toLocaleString()}</div>
                                    </div>
                                </td>
                                <td>
                                    <div className="customer-info">
                                        <div className="name">👤 {o.customerName || '알수없음'}</div>
                                        <div className="addr">{o.shippingAddress}</div>
                                    </div>
                                </td>
                                <td>
                                    <div className="product-summary">
                                        <span className="type-tag">{deliveryTypes[o.delivery_type] || '🚚 일반'}</span>
                                        <span className="text">
                                            {o.items?.[0]?.name} {o.items?.length > 1 ? `외 ${o.items.length - 1}건` : ''}
                                        </span>
                                    </div>
                                </td>
                                <td><div className="price">{Number(o.totalAmount || 0).toLocaleString()}원</div></td>
                                <td>
                                    <select 
                                        className="status-select" 
                                        value={o.status} 
                                        onChange={(e) => handleStatusChange(o._id, e.target.value)}
                                        style={{ color: getStatusInfo(o.status).color, background: getStatusInfo(o.status).bg }}
                                    >
                                        {statuses.filter(s => s !== 'ALL').map(s => {
                                            const info = getStatusInfo(s);
                                            return <option key={s} value={s}>{info.label}</option>;
                                        })}
                                    </select>
                                </td>
                                 <td className="text-right" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                    {o.status === 'CANCEL_REQUESTED' && (
                                        <>
                                            <button onClick={() => handleStatusChange(o._id, 'CANCELLED')} style={{ background: '#f04452', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>취소승인</button>
                                            <button onClick={() => handleStatusChange(o._id, 'PREPARING')} style={{ background: '#f2f4f6', color: '#4e5968', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>반려</button>
                                        </>
                                    )}
                                    {o.status === 'RETURN_REQUESTED' && (
                                        <>
                                            <button onClick={() => handleStatusChange(o._id, 'RETURNED')} style={{ background: '#ff9800', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>반품승인</button>
                                            <button onClick={() => handleStatusChange(o._id, 'COMPLETED')} style={{ background: '#f2f4f6', color: '#4e5968', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>반려</button>
                                        </>
                                    )}
                                    {o.status === 'EXCHANGE_REQUESTED' && (
                                        <>
                                            <button onClick={() => handleStatusChange(o._id, 'EXCHANGED')} style={{ background: '#9c27b0', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>교환승인</button>
                                            <button onClick={() => handleStatusChange(o._id, 'COMPLETED')} style={{ background: '#f2f4f6', color: '#4e5968', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>반려</button>
                                        </>
                                    )}
                                    <button className="btn-detail" onClick={() => setSelectedOrder(o)}>상세보기</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {orders.length === 0 && !loading && <div className="empty-state">해당하는 주문 데이터가 없습니다.</div>}
            </div>

            <footer className="pagination-bar">
                <button disabled={page === 1} onClick={() => setPage(page - 1)}>이전</button>
                <div className="page-info"><span>{page}</span> / {totalPages || 1} (총 {totalCount}건)</div>
                <button disabled={page === totalPages || totalPages === 0} onClick={() => setPage(page + 1)}>다음</button>
            </footer>

            {selectedOrder && (
                <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>📦 주문 상세 정보 ({selectedOrder.orderId})</h2>
                            <button onClick={() => setSelectedOrder(null)}>✕</button>
                        </div>
                        <div className="detail-body">
                            <div className="section">
                                <h3>📋 상품 내역</h3>
                                <div className="item-list">
                                    {selectedOrder.items?.map((item, idx) => (
                                        <div key={idx} className="item-row">
                                            <div className="name">{item.name}</div>
                                            <div className="info">{item.quantity}개 / {Number(item.price).toLocaleString()}원</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="section">
                                <h3>📍 배송 정보</h3>
                                <div className="info-grid">
                                    <div className="info-item"><strong>연락처:</strong> {selectedOrder.contact || '-'}</div>
                                    <div className="info-item"><strong>결제수단:</strong> {selectedOrder.paymentMethod || '-'}</div>
                                    <div className="info-item full"><strong>배송지:</strong> {selectedOrder.shippingAddress}</div>
                                    {selectedOrder.orderMemo && (
                                        <div className="info-item full memo"><strong>📝 메모:</strong> {selectedOrder.orderMemo}</div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="primary" onClick={() => setSelectedOrder(null)}>확인</button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .order-manager-container { max-width: 1200px; margin: 0 auto; padding: 20px; }
                .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
                .title-group h1 { font-size: 32px; font-weight: 900; color: #1a1f27; }
                .title-group p { color: #8b95a1; margin-top: 8px; }
                .btn-refresh { background: #f2f4f6; border: none; padding: 10px 20px; border-radius: 12px; font-weight: 700; color: #4e5968; cursor: pointer; }

                .control-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; gap: 20px; }
                .tabs { display: flex; background: #f2f4f6; padding: 4px; border-radius: 12px; }
                .tabs button { border: none; background: none; padding: 8px 16px; border-radius: 10px; font-size: 14px; font-weight: 600; color: #4e5968; cursor: pointer; }
                .tabs button.active { background: #fff; color: #3182f6; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }

                .search-box { display: flex; flex: 1; max-width: 400px; background: #fff; border: 1px solid #e5e8eb; border-radius: 12px; padding: 4px 12px; }
                .search-box input { flex: 1; border: none; padding: 8px; outline: none; }
                .search-box button { border: none; background: none; cursor: pointer; }

                .table-wrapper { background: #fff; border-radius: 20px; border: 1px solid #e5e8eb; overflow: hidden; }
                .table-wrapper.loading { opacity: 0.6; }
                .enterprise-table { width: 100%; border-collapse: collapse; }
                .enterprise-table th { background: #f9fafb; padding: 16px; text-align: left; font-size: 13px; color: #8b95a1; border-bottom: 1px solid #e5e8eb; }
                .enterprise-table td { padding: 16px; border-bottom: 1px solid #f2f4f6; font-size: 14px; }

                .order-id-box .order-id { font-weight: 800; color: #1a1f27; font-family: monospace; }
                .order-id-box .order-time { font-size: 12px; color: #8b95a1; margin-top: 2px; }

                .customer-info .name { font-weight: 700; color: #1a1f27; }
                .customer-info .addr { font-size: 12px; color: #8b95a1; margin-top: 2px; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

                .product-summary { display: flex; align-items: center; gap: 8px; }
                .type-tag { font-size: 11px; background: #f2f4f6; padding: 2px 6px; border-radius: 4px; font-weight: 700; }
                .product-summary .text { font-weight: 600; color: #4e5968; }

                .price { font-weight: 800; color: #f04452; }

                .status-select { padding: 6px 12px; border-radius: 8px; border: none; font-weight: 800; font-size: 12px; cursor: pointer; outline: none; }

                .btn-detail { background: #f2f4f6; border: none; padding: 8px 16px; border-radius: 8px; font-size: 12px; font-weight: 700; color: #4e5968; cursor: pointer; }

                .pagination-bar { display: flex; justify-content: center; align-items: center; gap: 30px; margin-top: 30px; padding-bottom: 40px; }
                .pagination-bar button { padding: 8px 20px; border-radius: 10px; border: 1px solid #e5e8eb; background: #fff; font-weight: 700; cursor: pointer; }
                .page-info { font-weight: 700; color: #4e5968; }
                .page-info span { color: #3182f6; }

                .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2000; }
                .modal-content { background: #fff; width: 500px; border-radius: 30px; padding: 40px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); max-height: 90vh; overflow-y: auto; }
                .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
                .modal-header h2 { font-size: 20px; font-weight: 900; }
                .modal-header button { background: none; border: none; font-size: 24px; cursor: pointer; color: #8b95a1; }

                .section { margin-bottom: 24px; }
                .section h3 { font-size: 15px; font-weight: 800; margin-bottom: 12px; color: #333d4b; }
                .item-list { background: #f9fafb; padding: 16px; border-radius: 12px; }
                .item-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; font-size: 14px; }
                .item-row:last-child { border-bottom: none; }
                .item-row .name { font-weight: 700; flex: 1; }

                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
                .info-item { font-size: 14px; color: #4e5968; }
                .info-item.full { grid-column: 1 / -1; }
                .info-item.memo { background: #fff9e6; padding: 12px; border-radius: 10px; color: #856404; }

                .modal-footer { margin-top: 30px; }
                .modal-footer button.primary { width: 100%; padding: 16px; border-radius: 14px; border: none; background: #3182f6; color: #fff; font-weight: 700; cursor: pointer; }
                
                .text-right { text-align: right; }
                .empty-state { padding: 60px; text-align: center; color: #8b95a1; font-weight: 600; }
            `}</style>
        </div>
    );
}
