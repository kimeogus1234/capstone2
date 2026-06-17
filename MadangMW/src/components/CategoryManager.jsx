import React, { useState, useEffect } from 'react';
import * as api from '../api';

export default function CategoryManager({ token }) {
    const [tree, setTree] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', parentId: null, level: 1, order: 0 });
    
    // 🔹 접힘/펼침 상태 관리 (ID를 담는 Set)
    const [expandedNodes, setExpandedNodes] = useState(new Set());

    useEffect(() => {
        loadTree();
    }, []);

    const loadTree = async () => {
        setLoading(true);
        try {
            const data = await api.getCategoryTree();
            setTree(data);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const toggleNode = (id) => {
        const newExpanded = new Set(expandedNodes);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedNodes(newExpanded);
    };

    const handleAdd = (parent = null) => {
        setFormData({
            name: '',
            parentId: parent ? parent._id : null,
            level: parent ? parent.level + 1 : 1,
            order: 0
        });
        setSelectedItem(null);
        setIsModalOpen(true);
    };

    const handleEdit = (item) => {
        setSelectedItem(item);
        setFormData({
            name: item.name,
            parentId: item.parentId,
            level: item.level,
            order: item.order || 0
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (selectedItem) {
                await api.updateCategory(selectedItem._id, formData);
            } else {
                await api.createCategory(formData);
            }
            setIsModalOpen(false);
            loadTree();
        } catch (e) { alert(e.response?.data?.message || '실패'); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('정말 삭제하시겠습니까? 하위 카테고리가 있으면 삭제되지 않습니다.')) return;
        try {
            await api.deleteCategory(id);
            loadTree();
        } catch (e) { alert(e.response?.data?.message || '삭제 실패'); }
    };

    const renderNode = (node) => {
        const isExpanded = expandedNodes.has(node._id);
        const hasChildren = node.children && node.children.length > 0;

        return (
            <div key={node._id} style={{ marginLeft: node.level > 1 ? 24 : 0, marginBottom: 4 }}>
                <div className={`cat-node level-${node.level}`} style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 16px', background: node.level === 1 ? '#f2f4f6' : '#fff',
                    borderRadius: 12, border: '1px solid #e5e8eb',
                    cursor: hasChildren ? 'pointer' : 'default'
                }} onClick={() => hasChildren && toggleNode(node._id)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {hasChildren && (
                            <span style={{ fontSize: 10, color: '#8b95a1', width: 14 }}>
                                {isExpanded ? '▼' : '▶'}
                            </span>
                        )}
                        {!hasChildren && <div style={{ width: 14 }} />}
                        <span style={{ fontSize: node.level === 1 ? 15 : 14, fontWeight: node.level === 1 ? 800 : 500 }}>
                            {node.level === 1 && '📁'} {node.level === 2 && '📂'} {node.level === 3 && '🏷️'} {node.name}
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                        {node.level < 3 && (
                            <button onClick={() => handleAdd(node)} className="btn-mini" style={{ color: '#3182f6' }}>+ 하위</button>
                        )}
                        <button onClick={() => handleEdit(node)} className="btn-mini">수정</button>
                        <button onClick={() => handleDelete(node._id)} className="btn-mini" style={{ color: '#f04452' }}>삭제</button>
                    </div>
                </div>
                {/* 🔹 펼쳐진 상태일 때만 자식 렌더링 */}
                {isExpanded && hasChildren && (
                    <div className="node-children" style={{ marginTop: 4 }}>
                        {node.children.map(child => renderNode(child))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
                <div>
                    <h1 style={{ fontSize: 32, fontWeight: 900 }}>🏷️ 카테고리 마스터</h1>
                    <p style={{ color: '#4e5968' }}>폴더를 열어 복합쇼핑몰의 계층 구조를 관리하세요.</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setExpandedNodes(new Set())} className="btn-secondary" style={{ padding: '0 16px' }}>전체 접기</button>
                    <button onClick={() => handleAdd()} className="btn-primary">+ 대분류 추가</button>
                </div>
            </div>

            <div className="tree-container" style={{ background: '#fff', padding: 24, borderRadius: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', minHeight: 400 }}>
                {loading ? <p>로딩 중...</p> : tree.map(main => renderNode(main))}
                {tree.length === 0 && !loading && <p style={{ textAlign: 'center', color: '#8b95a1', padding: 40 }}>등록된 카테고리가 없습니다.</p>}
            </div>

            {isModalOpen && (
                <div className="sidebar-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="card" style={{ width: 400, padding: 30 }} onClick={e => e.stopPropagation()}>
                        <h2>{selectedItem ? '카테고리 수정' : '새 카테고리 추가'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>카테고리명</label>
                                <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label>표시 순서</label>
                                <input type="number" value={formData.order} onChange={e => setFormData({...formData, order: Number(e.target.value)})} />
                            </div>
                            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, background: '#eee', border: 'none', borderRadius: 12 }}>취소</button>
                                <button type="submit" style={{ flex: 1, background: '#3182f6', color: '#fff', border: 'none', borderRadius: 12, height: 44 }}>저장</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .sidebar-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2000; }
                .card { background: #fff; border-radius: 24px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); }
                .btn-mini { background: none; border: none; font-size: 12px; font-weight: 700; cursor: pointer; padding: 4px 8px; border-radius: 6px; }
                .btn-mini:hover { background: #f2f4f6; }
                .form-group { margin-bottom: 15px; }
                .form-group label { display: block; font-size: 12px; font-weight: 700; color: #4e5968; margin-bottom: 5px; }
                .form-group input { width: 100%; height: 44px; border: 1px solid #e5e8eb; border-radius: 10px; padding: 0 12px; }
                .cat-node:hover { border-color: #3182f6 !important; }
            `}</style>
        </div>
    );
}
