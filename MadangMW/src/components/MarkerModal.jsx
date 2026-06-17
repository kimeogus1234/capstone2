import React, { useState, useEffect } from 'react';
import { getProducts, assignSlotToMarker, removeSlotFromMarker } from '../api';
import ContentBlockRenderer from './ContentBlockRenderer';

export default function MarkerModal({ marker, token, isAdmin, onClose, onDelete }) {
    const [slots, setSlots] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSlot, setActiveSlot] = useState(null);
    const [scrollState, setScrollState] = useState({ top: 0, bottom: 1 });
    const [previewProduct, setPreviewProduct] = useState(null);
    const scrollRef = React.useRef(null);

    useEffect(() => {
        loadData();
        // Use existing slots or start empty
        const initialSlots = marker.slots ? [...marker.slots].sort((a, b) => b.slot_number - a.slot_number) : [];
        setSlots(initialSlots);

        if (initialSlots.length === 0 && isAdmin) {
            // Optional: Auto-create first slot if empty? 
            // Better to let user add
        }
    }, [marker]);

    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        const topOpacity = Math.min(scrollTop / 40, 1);
        const bottomOpacity = Math.min((scrollHeight - scrollTop - clientHeight) / 40, 1);
        setScrollState({ top: topOpacity, bottom: bottomOpacity });
    };

    const loadData = async () => {
        try {
            const products = await getProducts();
            setAllProducts(products);
        } catch (e) {
            console.error(e);
        }
    };

    const handleAddSlot = () => {
        const nextSlotNum = slots.length > 0 ? Math.max(...slots.map(s => s.slot_number)) + 1 : 1;
        const newSlots = [...slots, { slot_number: nextSlotNum, product_id: null }].sort((a, b) => b.slot_number - a.slot_number);
        setSlots(newSlots);
        setActiveSlot(nextSlotNum);
    };

    const handleRemoveSlot = async () => {
        if (slots.length === 0) return;

        // Find the highest numbered slot
        const highestSlot = slots.reduce((max, slot) =>
            slot.slot_number > max.slot_number ? slot : max
        );

        const product = allProducts.find(p => p._id === highestSlot.product_id);
        const confirmMsg = product
            ? `${highestSlot.slot_number}번 칸에 "${product.name}" 상품이 등록되어 있습니다.\n정말 삭제하시겠습니까?`
            : `${highestSlot.slot_number}번 칸을 삭제하시겠습니까?`;

        if (!window.confirm(confirmMsg)) return;

        try {
            await removeSlotFromMarker(marker.id, highestSlot.slot_number, token);
            setSlots(slots.filter(s => s.slot_number !== highestSlot.slot_number));
            if (activeSlot === highestSlot.slot_number) setActiveSlot(null);
        } catch (e) {
            console.error(e);
            alert('칸 삭제 중 오류가 발생했습니다.');
        }
    };

    const handleClearProduct = async (slotNumber) => {
        if (!window.confirm(`${slotNumber}번 칸의 상품을 비우시겠습니까?`)) return;
        try {
            await assignSlotToMarker(marker.id, {
                slot_number: slotNumber,
                product_id: null
            }, token);

            setSlots(slots.map(s =>
                s.slot_number === slotNumber ? { ...s, product_id: null } : s
            ));
        } catch (e) {
            console.error(e);
            alert('상품 제거 중 오류가 발생했습니다.');
        }
    };

    const handleAssignProduct = async (slotNumber, productId) => {
        try {
            await assignSlotToMarker(marker.id, {
                slot_number: slotNumber,
                product_id: productId
            }, token);

            setSlots(slots.map(s =>
                s.slot_number === slotNumber ? { ...s, product_id: productId } : s
            ));
            setActiveSlot(null);
        } catch (e) {
            console.error(e);
        }
    };

    const filteredProducts = allProducts.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const scrollThumbHeight = scrollRef.current
        ? (scrollRef.current.clientHeight / scrollRef.current.scrollHeight) * 100
        : 0;
    const scrollThumbTop = scrollRef.current
        ? (scrollRef.current.scrollTop / scrollRef.current.scrollHeight) * 100
        : 0;

    return (
        <div className="modal-overlay" onClick={onClose} style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(8px)'
        }}>
            <div className="modal-content animate-popup side-by-side" onClick={e => e.stopPropagation()} style={{
                width: 900, // Widened for side-by-side
                maxHeight: '85vh',
                backgroundColor: 'white',
                borderRadius: 32,
                overflow: 'hidden',
                boxShadow: '0 30px 60px rgba(0,0,0,0.15)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Header Section */}
                <div style={{ padding: '32px 40px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f2f4f6' }}>
                    <div>
                        <h3 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.5px' }}>{isAdmin ? '매장 진열대 편집' : '진열 정보'}</h3>
                        <p style={{ color: '#8b95a1', fontSize: 14, marginTop: 4 }}>
                            {isAdmin ? '구역 내 진열 상품과 칸 수를 관리합니다.' : '이 구역에 진열된 상품들입니다.'}
                        </p>
                    </div>
                    <button onClick={onClose} className="close-btn-round">&times;</button>
                </div>

                {/* Main Content: Side by Side */}
                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                    {/* Left: Slots List */}
                    <div style={{ flex: '0 0 420px', borderRight: '1px solid #f2f4f6', backgroundColor: '#f9fafb', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#4e5968' }}>전체 {slots.length}개 칸</span>
                            {isAdmin && (
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {slots.length > 0 && (
                                        <button onClick={handleRemoveSlot} className="btn-remove-slot">
                                            ➖ 칸 줄이기
                                        </button>
                                    )}
                                    <button onClick={handleAddSlot} className="btn-add-slot">
                                        ➕ 칸 추가
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="scroll-mask-container" style={{ flex: 1, margin: 0, padding: 0, overflow: 'hidden', position: 'relative' }}>
                            <div className="scroll-mask-top" style={{ opacity: scrollState.top }}></div>
                            <div className="scroll-mask-bottom" style={{ opacity: scrollState.bottom }}></div>

                            <div ref={scrollRef} className="premium-scroll-container" onScroll={handleScroll} style={{ height: '100%', padding: '0 32px 40px' }}>
                                <div style={{ display: 'grid', gap: 12 }}>
                                    {slots.length > 0 ? slots.map(slot => {
                                        const product = allProducts.find(p => p._id === slot.product_id);
                                        return (
                                            <div key={slot.slot_number} className={`slot-card-premium ${activeSlot === slot.slot_number ? 'active' : ''}`} onClick={() => isAdmin && setActiveSlot(slot.slot_number)}>
                                                <div className="slot-badge">{slot.slot_number}</div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    {product ? (
                                                        <>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                                                <img src={product.image_url} alt="" className="slot-img" />
                                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                                    <div className="slot-pname">{product.name}</div>
                                                                    <div className="slot-pprice">{(product.price || 0).toLocaleString()}원</div>
                                                                </div>
                                                            </div>
                                                            <button
                                                                className="btn-detail-view"
                                                                onClick={(e) => { e.stopPropagation(); setPreviewProduct(product); }}
                                                                style={{ width: '100%', marginTop: 4 }}
                                                            >
                                                                상세보기
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <div className="slot-empty">비어있는 진열대</div>
                                                    )}
                                                </div>
                                                {isAdmin && product && (
                                                    <button className="slot-clear-btn" onClick={(e) => { e.stopPropagation(); handleClearProduct(slot.slot_number); }} title="상품 비우기">🗑️</button>
                                                )}
                                            </div>
                                        );
                                    }) : (
                                        <div style={{ textAlign: 'center', padding: '60px 0', color: '#adb5bd' }}>
                                            등록된 진열 칸이 없습니다.<br />새로운 칸을 추가해 보세요.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Search & Action Area */}
                    <div style={{ flex: 1, padding: 40, backgroundColor: 'white', display: 'flex', flexDirection: 'column' }}>
                        {!activeSlot ? (
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#8b95a1' }}>
                                <div style={{ fontSize: 40, marginBottom: 16 }}>📦</div>
                                <div style={{ fontSize: 16, fontWeight: 600 }}>진열할 칸을 먼저 선택해 주세요.</div>
                                <p style={{ fontSize: 14, marginTop: 8 }}>왼쪽 리스트에서 진열 위치를 클릭하면 상품을 검색할 수 있습니다.</p>
                            </div>
                        ) : (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                    <h4 style={{ fontSize: 18, fontWeight: 700 }}>
                                        <span style={{ color: '#3182f6' }}>{activeSlot}번 칸</span> 상품 등록
                                    </h4>
                                    <div style={{ fontSize: 13, color: '#8b95a1' }}>{filteredProducts.length}개 검색됨</div>
                                </div>

                                <div style={{ position: 'relative', marginBottom: 20 }}>
                                    <input
                                        className="search-input"
                                        placeholder="검색할 상품명을 입력하세요..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        style={{ width: '100%', padding: '16px 20px', paddingLeft: 44, borderRadius: 16, border: '1px solid #e5e8eb', fontSize: 16, backgroundColor: '#f9fafb' }}
                                    />
                                    <span style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', fontSize: 18 }}>🔍</span>
                                </div>

                                <div className="product-selection-grid" style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
                                    {filteredProducts.map(p => (
                                        <div key={p._id} className="product-search-item" onClick={() => handleAssignProduct(activeSlot, p._id)}>
                                            <img src={p.image_url} alt="" className="search-pimg" />
                                            <div style={{ flex: 1 }}>
                                                <div className="search-pname">{p.name}</div>
                                                <div className="search-pprice">{(p.price || 0).toLocaleString()}원</div>
                                            </div>
                                            <div className="search-pbtn">등록하기</div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div style={{ padding: '24px 40px', borderTop: '1px solid #f2f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {isAdmin ? (
                        <button onClick={onDelete} style={{ color: '#f04452', background: 'none', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                            🗑️ 이 구역 마커 삭제
                        </button>
                    ) : <div></div>}
                    <button className="btn-primary" onClick={onClose} style={{ padding: '14px 40px', borderRadius: 16, fontSize: 16, fontWeight: 700 }}>
                        {isAdmin ? '관리 완료' : '닫기'}
                    </button>
                </div>
            </div>

            {/* Mobile Preview Modal */}
            {previewProduct && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10000
                    }}
                    onClick={() => setPreviewProduct(null)}
                >
                    <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
                        <button
                            onClick={() => setPreviewProduct(null)}
                            style={{
                                position: 'absolute',
                                top: -40,
                                right: 0,
                                background: 'white',
                                border: 'none',
                                borderRadius: '50%',
                                width: 32,
                                height: 32,
                                fontSize: 20,
                                cursor: 'pointer'
                            }}
                        >
                            ×
                        </button>

                        <div className="mobile-preview-container">
                            <div className="mobile-header">Smart Store</div>
                            <div className="mobile-content">
                                <div style={{ padding: 4 }}>

                                    {/* 공통 영역 */}
                                    <h2 style={{ fontSize: 20, marginBottom: 8 }}>
                                        {previewProduct.name}
                                    </h2>

                                    {/* ===================== */}
                                    {/* A 타입 상세보기 */}
                                    {/* ===================== */}
                                    {previewProduct.display_template === 'A' && (
                                        <>
                                            <p style={{
                                                color: '#3182f6',
                                                fontSize: 22,
                                                fontWeight: 700,
                                                marginBottom: 20
                                            }}>
                                                {(previewProduct.price || 0).toLocaleString()}원
                                            </p>

                                            <button
                                                className="btn-primary"
                                                style={{ width: '100%', borderRadius: 12, marginBottom: 24 }}
                                            >
                                                장바구니 담기
                                            </button>

                                            <h4 style={{ marginBottom: 16 }}>상품 상세 정보</h4>

                                            {(previewProduct.media || []).map((block, i) => (
                                                <ContentBlockRenderer key={i} block={block} />
                                            ))}
                                        </>
                                    )}

                                    {/* ===================== */}
                                    {/* B 타입 상세보기 */}
                                    {/* ===================== */}
                                    {previewProduct.display_template === 'B' && (
                                        <>
                                            <p style={{
                                                color: '#8b95a1',
                                                fontSize: 13,
                                                marginBottom: 20
                                            }}>
                                                {previewProduct.description}
                                            </p>

                                            {/* 옵션 박스 */}
                                            <div style={{
                                                background: '#f9fafb',
                                                padding: 16,
                                                borderRadius: 12,
                                                border: '1px solid #e5e8eb',
                                                marginBottom: 24
                                            }}>
                                                <label style={{
                                                    fontSize: 12,
                                                    color: '#8b95a1',
                                                    fontWeight: 700
                                                }}>
                                                    옵션 선택
                                                </label>

                                                <div style={{
                                                    height: 44,
                                                    border: '1px solid #d1d6db',
                                                    background: 'white',
                                                    borderRadius: 12,
                                                    marginTop: 8,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    padding: '0 16px',
                                                    fontSize: 14
                                                }}>
                                                    상품 번호를 선택하세요 ▼
                                                </div>
                                            </div>

                                            <h4 style={{ marginBottom: 16 }}>상세 정보</h4>

                                            {(previewProduct.media || []).map((block, i) => (
                                                <ContentBlockRenderer key={i} block={block} />
                                            ))}
                                        </>
                                    )}

                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
