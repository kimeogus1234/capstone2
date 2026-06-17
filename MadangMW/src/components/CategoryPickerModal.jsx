import React, { useState, useEffect } from 'react';

export default function CategoryPickerModal({ isOpen, onClose, initialSelected, onSelect, categories = [], isLoading, isStaffMode }) {
    const [selected, setSelected] = useState(initialSelected || []);
    
    // Sync state when modal opens or initialSelected changes
    useEffect(() => {
        if (isOpen) {
            setSelected(initialSelected || []);
        }
    }, [isOpen, initialSelected]);

    // State for navigation/drilling down
    const [activeMain, setActiveMain] = useState(null);
    const [activeMid, setActiveMid] = useState(null);

    const toggleExact = (id) => {
        if (selected.includes(id)) {
            setSelected(selected.filter(p => p !== id));
        } else {
            setSelected([...selected, id]);
        }
    };

    const isSelected = (id) => selected.includes(id);

    // Helper to find category name by ID in the tree
    const findNameById = (tree, id) => {
        for (const item of tree) {
            if (item._id === id) return item.name;
            if (item.children) {
                const found = findNameById(item.children, id);
                if (found) return found;
            }
        }
        return null;
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                backgroundColor: 'white', borderRadius: 24, padding: 32,
                width: '90%', maxWidth: 850, maxHeight: '85vh', overflow: 'hidden',
                display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>관리 권한 카테고리 설정</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#8b95a1' }}>✕</button>
                </div>

                {isLoading ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
                        <div className="spinner" style={{ width: 40, height: 40, border: '4px solid #f2f4f6', borderTopColor: '#3182f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                        <p style={{ color: '#8b95a1', fontSize: 14 }}>매장 카테고리를 불러오는 중...</p>
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                ) : (
                    <div style={{ display: 'flex', gap: 16, flex: 1, overflow: 'hidden', border: '1px solid #f2f4f6', borderRadius: 16 }}>
                    {/* Level 1: Main Category */}
                    <div style={{ flex: 1, overflowY: 'auto', borderRight: '1px solid #f2f4f6', padding: 12 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#8b95a1', marginBottom: 12, padding: '0 8px' }}>대분류</div>
                        {categories.map(cat => (
                            <div 
                                key={cat._id} 
                                onClick={() => { setActiveMain(cat); setActiveMid(null); }}
                                style={{ 
                                    padding: '10px 14px', borderRadius: 10, cursor: 'pointer', marginBottom: 4,
                                    background: activeMain?._id === cat._id ? '#e8f3ff' : 'transparent',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <span style={{ fontSize: 14, fontWeight: activeMain?._id === cat._id ? 700 : 500, color: activeMain?._id === cat._id ? '#3182f6' : '#4e5968' }}>{cat.name}</span>
                                <input 
                                    type="checkbox" 
                                    checked={isSelected(cat._id)} 
                                    onChange={(e) => { e.stopPropagation(); toggleExact(cat._id); }}
                                    disabled={isStaffMode && cat.children?.length > 0}
                                    title={isStaffMode && cat.children?.length > 0 ? "직원 권한은 소분류별로 상세히 설정해야 합니다." : ""}
                                    style={{ width: 18, height: 18, cursor: (isStaffMode && cat.children?.length > 0) ? 'not-allowed' : 'pointer' }}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Level 2: Mid Category */}
                    <div style={{ flex: 1, overflowY: 'auto', borderRight: '1px solid #f2f4f6', padding: 12 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#8b95a1', marginBottom: 12, padding: '0 8px' }}>중분류</div>
                        {activeMain?.children ? (
                            activeMain.children.map(cat => (
                                <div 
                                    key={cat._id} 
                                    onClick={() => { setActiveMid(cat); }}
                                    style={{ 
                                        padding: '10px 14px', borderRadius: 10, cursor: 'pointer', marginBottom: 4,
                                        background: activeMid?._id === cat._id ? '#e8f3ff' : 'transparent',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <span style={{ fontSize: 14, fontWeight: activeMid?._id === cat._id ? 700 : 500, color: activeMid?._id === cat._id ? '#3182f6' : '#4e5968' }}>{cat.name}</span>
                                    <input 
                                        type="checkbox" 
                                        checked={isSelected(cat._id)} 
                                        onChange={(e) => { e.stopPropagation(); toggleExact(cat._id); }}
                                        style={{ width: 18, height: 18, cursor: 'pointer' }}
                                    />
                                </div>
                            ))
                        ) : (
                            <div style={{ color: '#8b95a1', padding: 20, textAlign: 'center', fontSize: 13 }}>{activeMain ? '중분류 항목이 없습니다' : '대분류를 먼저 선택하세요'}</div>
                        )}
                    </div>

                    {/* Level 3: Sub Category */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#8b95a1', marginBottom: 12, padding: '0 8px' }}>소분류</div>
                        {activeMid?.children ? (
                            activeMid.children.map(cat => (
                                <div 
                                    key={cat._id} 
                                    onClick={() => toggleExact(cat._id)}
                                    style={{ 
                                        padding: '10px 14px', borderRadius: 10, cursor: 'pointer', marginBottom: 4,
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        transition: 'all 0.2s', background: isSelected(cat._id) ? '#f2f4f6' : 'transparent'
                                    }}
                                >
                                    <span style={{ fontSize: 14, fontWeight: 500, color: '#4e5968' }}>{cat.name}</span>
                                    <input 
                                        type="checkbox" 
                                        checked={isSelected(cat._id)} 
                                        onChange={(e) => { e.stopPropagation(); toggleExact(cat._id); }}
                                        style={{ width: 18, height: 18, cursor: 'pointer' }}
                                    />
                                </div>
                            ))
                        ) : (
                            <div style={{ color: '#8b95a1', padding: 20, textAlign: 'center', fontSize: 13 }}>{activeMid ? '소분류 항목이 없습니다' : '중분류를 먼저 선택하세요'}</div>
                        )}
                    </div>
                </div>
            )}

                <div style={{ marginTop: 24, padding: '16px 20px', background: '#f9fafb', borderRadius: 16, fontSize: 13 }}>
                    <div style={{ color: '#8b95a1', marginBottom: 10, fontWeight: 600 }}>선택된 항목: {selected.length}개</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', maxHeight: 100, overflowY: 'auto' }}>
                        {selected.map(id => (
                            <div key={id} style={{ background: '#3182f6', color: 'white', padding: '6px 12px', borderRadius: 20, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                                {findNameById(categories, id) || '알수없음'} 
                                <span onClick={(e) => { e.stopPropagation(); toggleExact(id); }} style={{ cursor: 'pointer', opacity: 0.8, fontSize: 14 }}>×</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ marginTop: 32, display: 'flex', gap: 12 }}>
                    <button 
                        onClick={onClose} 
                        style={{ flex: 1, height: 56, borderRadius: 16, border: '1px solid #e5e8eb', background: '#fff', fontWeight: 600, cursor: 'pointer', color: '#4e5968' }}
                    >
                        취소
                    </button>
                    <button 
                        onClick={() => { onSelect(selected); onClose(); }} 
                        style={{ flex: 2, height: 56, borderRadius: 16, border: 'none', background: '#3182f6', color: 'white', fontWeight: 700, cursor: 'pointer' }}
                    >
                        설정 완료
                    </button>
                </div>
            </div>
        </div>
    );
}

