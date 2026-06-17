import React, { useState, useEffect } from 'react';
import * as api from '../api';
import { ImageUploader } from './ContentBlockEditor';

export default function EventManager({ token }) {
    const [events, setEvents] = useState([]);
    const [stores, setStores] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        storeId: '',
        type: 'Promotion',
        bannerUrl: ''
    });
    const [editingEventId, setEditingEventId] = useState(null);

    useEffect(() => {
        fetchEvents();
        fetchStores();
    }, []);

    const fetchEvents = async () => {
        try {
            const data = await api.getEvents();
            setEvents(data.events || data || []);
        } catch (e) { console.error(e); }
    };

    const fetchStores = async () => {
        try {
            const data = await api.getStores();
            setStores(data.stores || data || []);
        } catch (e) { console.error(e); }
    };

    const handleDragStart = (e, index) => {
        e.dataTransfer.setData('text/plain', index.toString());
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = async (e, targetIndex) => {
        e.preventDefault();
        const sourceIndexStr = e.dataTransfer.getData('text/plain');
        if (sourceIndexStr === '') return;
        const sourceIndex = parseInt(sourceIndexStr, 10);
        if (sourceIndex === targetIndex) return;

        const updated = [...events];
        const [movedItem] = updated.splice(sourceIndex, 1);
        updated.splice(targetIndex, 0, movedItem);
        
        setEvents(updated);

        try {
            const eventIds = updated.map(item => item._id);
            await api.reorderEvents(eventIds);
        } catch (error) {
            console.error('Failed to save events order:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const submitData = {
                ...formData,
                storeId: formData.storeId || null
            };
            if (editingEventId) {
                await api.updateEvent(editingEventId, submitData);
                alert('이벤트가 수정되었습니다.');
            } else {
                await api.createEvent(submitData);
                alert('이벤트가 등록되었습니다.');
            }
            setIsModalOpen(false);
            setEditingEventId(null);
            setFormData({ title: '', description: '', startDate: '', endDate: '', storeId: '', type: 'Promotion', bannerUrl: '' });
            fetchEvents();
        } catch (error) {
            console.error(error);
            alert('작업 실패');
        }
    };

    const handleEdit = (event) => {
        setFormData({
            title: event.title,
            description: event.description,
            startDate: new Date(event.startDate).toISOString().split('T')[0],
            endDate: new Date(event.endDate).toISOString().split('T')[0],
            storeId: event.storeId?._id || '',
            type: event.type || 'Promotion',
            bannerUrl: event.bannerUrl || ''
        });
        setEditingEventId(event._id);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('이 이벤트를 삭제하시겠습니까?')) return;
        try {
            await api.deleteEvent(id);
            fetchEvents();
        } catch (error) {
            alert('삭제 실패');
        }
    };

    return (
        <div className="manager-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                    <h1>🎉 이벤트/공지 관리</h1>
                    <p style={{ color: 'var(--text-sub)' }}>쇼핑몰 이벤트 및 매장 소식을 발행합니다.</p>
                </div>
                <button className="btn-primary" onClick={() => setIsModalOpen(true)}>+ 이벤트 등록</button>
            </div>

            <div className="product-list">
                {events.map((event, index) => (
                    <div 
                        key={event._id} 
                        className="card"
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e)}
                        onDrop={(e) => handleDrop(e, index)}
                        style={{ cursor: 'grab', position: 'relative' }}
                    >
                        <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 10, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 10, padding: '3px 8px', borderRadius: 6, fontWeight: 'bold' }}>
                            ☰ 드래그 정렬 ({index + 1})
                        </div>
                        <div style={{ height: 160, background: '#f2f4f6', borderRadius: 12, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                            {event.bannerUrl ? (
                                <img src={api.getFullImageUrl(event.bannerUrl)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                            ) : (
                                <span style={{ fontSize: 40 }}>🎁</span>
                            )}
                        </div>
                        <div className="badge badge-blue" style={{ marginBottom: 8 }}>{event.type}</div>
                        <h3 style={{ marginBottom: 8 }}>{event.title}</h3>
                        <p style={{ fontSize: 13, color: 'var(--text-sub)', marginBottom: 12 }}>{event.description}</p>
                        <div style={{ fontSize: 12, color: 'var(--text-caption)' }}>
                            📅 {new Date(event.startDate).toLocaleDateString()} ~ {new Date(event.endDate).toLocaleDateString()}
                        </div>
                        {event.storeId && (
                            <div style={{ marginTop: 12, fontSize: 13, fontWeight: 600, color: 'var(--primary-color)' }}>
                                🏢 대상: {event.storeId.name}
                            </div>
                        )}
                        <div style={{ marginTop: 16, display: 'flex', gap: 8, borderTop: '1px solid #f2f4f6', paddingTop: 12 }}>
                            <button onClick={() => handleEdit(event)} className="btn-edit-link" style={{ fontSize: 12, fontWeight: 800, color: '#3182f6', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>수정</button>
                            <button onClick={() => handleDelete(event._id)} className="btn-edit-link" style={{ fontSize: 12, fontWeight: 800, color: '#f04452', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>삭제</button>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="sidebar-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, background: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }} onClick={() => { setIsModalOpen(false); setEditingEventId(null); setFormData({ title: '', description: '', startDate: '', endDate: '', storeId: '', type: 'Promotion', bannerUrl: '' }); }}>
                    <div className="card event-modal-card" style={{ width: 920, maxWidth: '95%', padding: '32px', background: '#fff', borderRadius: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.15)', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32 }} onClick={e => e.stopPropagation()}>
                        <div>
                            <h2 style={{ marginBottom: 20 }}>{editingEventId ? '🎉 이벤트 수정' : '🎉 신규 이벤트 소식'}</h2>
                            <form onSubmit={handleSubmit}>
                                <div className="form-group" style={{ marginBottom: 16 }}>
                                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 700, fontSize: 13, color: '#4e5968' }}>제목</label>
                                    <input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} style={{ width: '100%', height: 46, padding: '0 16px', borderRadius: 12, border: '1px solid #e5e8eb' }} required />
                                </div>
                                <div className="form-group" style={{ marginBottom: 16 }}>
                                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 700, fontSize: 13, color: '#4e5968' }}>설명</label>
                                    <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ width: '100%', height: 72, padding: '12px 16px', borderRadius: 12, border: '1px solid #e5e8eb', resize: 'none' }} required />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                                    <div className="form-group">
                                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 700, fontSize: 13, color: '#4e5968' }}>시작일</label>
                                        <input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} style={{ width: '100%', height: 46, padding: '0 16px', borderRadius: 12, border: '1px solid #e5e8eb' }} required />
                                    </div>
                                    <div className="form-group">
                                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 700, fontSize: 13, color: '#4e5968' }}>종료일</label>
                                        <input type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} style={{ width: '100%', height: 46, padding: '0 16px', borderRadius: 12, border: '1px solid #e5e8eb' }} required />
                                    </div>
                                </div>
                                <div className="form-group" style={{ marginBottom: 16 }}>
                                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 700, fontSize: 13, color: '#4e5968' }}>이벤트 배너 이미지</label>
                                    <div style={{ height: 120 }}>
                                        {formData.bannerUrl ? (
                                            <div style={{ position: 'relative', height: '100%' }}>
                                                <img src={api.getFullImageUrl(formData.bannerUrl)} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} />
                                                <button type="button" onClick={() => setFormData({...formData, bannerUrl: ''})} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer' }}>✕</button>
                                            </div>
                                        ) : (
                                            <ImageUploader token={token} onUpload={(url) => setFormData({...formData, bannerUrl: url})} />
                                        )}
                                    </div>
                                </div>
                                <div className="form-group" style={{ marginBottom: 24 }}>
                                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 700, fontSize: 13, color: '#4e5968' }}>대상 매장 (선택)</label>
                                    <select value={formData.storeId} onChange={e => setFormData({...formData, storeId: e.target.value})} style={{ width: '100%', height: 46, padding: '0 16px', borderRadius: 12, border: '1px solid #e5e8eb', background: '#fff' }}>
                                        <option value="">전체 쇼핑몰 이벤트</option>
                                        {stores.map(s => <option key={s._id} value={s._id}>{s.name} ({s.floor})</option>)}
                                    </select>
                                </div>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <button type="button" className="btn-secondary" style={{ flex: 1, height: 48, borderRadius: 12 }} onClick={() => { setIsModalOpen(false); setEditingEventId(null); setFormData({ title: '', description: '', startDate: '', endDate: '', storeId: '', type: 'Promotion', bannerUrl: '' }); }}>취소</button>
                                    <button type="submit" className="btn-primary" style={{ flex: 1, height: 48, borderRadius: 12 }}>{editingEventId ? '수정완료' : '발행하기'}</button>
                                </div>
                            </form>
                        </div>

                        {/* 📱 Real-Time simulated iPhone Promo Preview */}
                        <div className="phone-preview-column" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa', padding: 24, borderRadius: 20, border: '1px solid #e5e8eb' }}>
                            <div style={{ marginBottom: 12, fontSize: 13, fontWeight: 800, color: '#4e5968' }}>📱 스마트폰 앱 실시간 화면 미리보기</div>
                            <div className="phone-frame">
                                <div className="phone-screen">
                                    {/* Simulated Status Bar */}
                                    <div className="phone-status-bar">
                                        <span>23:47</span>
                                        <div className="phone-status-icons">📶 🔋</div>
                                    </div>
                                    
                                    {/* Simulated App Bar */}
                                    <div className="simulated-app-header">
                                        <span className="app-logo">마당M</span>
                                        <div style={{ display: 'flex', gap: 10, fontSize: 12 }}>
                                            <span>🔍</span>
                                            <span>🔔</span>
                                        </div>
                                    </div>

                                    {/* Simulated Scroll Container */}
                                    <div className="simulated-home-content">
                                        {/* Banner Aspect Ratio 1 : 0.7 matching mobile app */}
                                        <div className="simulated-banner">
                                            {formData.bannerUrl ? (
                                                <img src={api.getFullImageUrl(formData.bannerUrl)} className="simulated-banner-img" alt="배너" />
                                            ) : (
                                                <div className="simulated-banner-placeholder">
                                                    <span>등록된 배너 이미지 없음</span>
                                                </div>
                                            )}
                                            <div className="simulated-banner-overlay">
                                                <h4 className="simulated-banner-title">{formData.title || '배너 제목이 여기에 표시됩니다'}</h4>
                                                <p className="simulated-banner-desc">{formData.description || '배너 상세 내용 문구가 하단에 정렬되어 표시됩니다.'}</p>
                                            </div>
                                        </div>
                                        
                                        {/* Context filler mocks */}
                                        <div className="mock-recommendations">
                                            <div className="mock-title">🔥 실시간 인기 매장 추천</div>
                                            <div className="mock-grid">
                                                <div className="mock-item" style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                    <div style={{ width: '100%', height: 50, background: '#f2f4f6', borderRadius: 8 }}></div>
                                                    <div style={{ width: '60%', height: 8, background: '#e5e8eb', borderRadius: 4 }}></div>
                                                </div>
                                                <div className="mock-item" style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                    <div style={{ width: '100%', height: 50, background: '#f2f4f6', borderRadius: 8 }}></div>
                                                    <div style={{ width: '40%', height: 8, background: '#e5e8eb', borderRadius: 4 }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* iPhone Home Indicator */}
                                    <div className="home-indicator"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .phone-frame {
                    width: 290px;
                    height: 520px;
                    background: #0d0d0d;
                    border-radius: 36px;
                    padding: 10px;
                    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.15);
                    border: 3px solid #262626;
                    position: relative;
                }
                .phone-screen {
                    width: 100%;
                    height: 100%;
                    background: #ffffff;
                    border-radius: 28px;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    position: relative;
                }
                .phone-status-bar {
                    height: 28px;
                    padding: 0 16px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 10px;
                    font-weight: 700;
                    color: #000;
                    background: #fff;
                }
                .simulated-app-header {
                    height: 40px;
                    padding: 0 16px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid #f2f4f6;
                    background: #fff;
                }
                .simulated-app-header .app-logo {
                    font-size: 14px;
                    font-weight: 900;
                    color: #3182f6;
                }
                .simulated-home-content {
                    flex: 1;
                    overflow-y: auto;
                    background: #f9fafb;
                    text-align: left;
                }
                .simulated-banner {
                    position: relative;
                    width: 100%;
                    height: 182px; /* width 260px * 0.7 = 182px (Exact 1 : 0.7 phone ratio!) */
                    overflow: hidden;
                    background: #e5e8eb;
                }
                .simulated-banner-img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .simulated-banner-placeholder {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #e5e8eb;
                    color: #8b95a1;
                    font-size: 11px;
                }
                .simulated-banner-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.35); /* Same darkening mask as app */
                    padding: 14px;
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-end;
                }
                .simulated-banner-title {
                    color: #fff;
                    font-size: 15px;
                    font-weight: 900;
                    margin: 0 0 4px 0;
                    line-height: 1.25;
                    word-break: break-all;
                }
                .simulated-banner-desc {
                    color: rgba(255, 255, 255, 0.85);
                    font-size: 10px;
                    font-weight: 600;
                    margin: 0;
                    line-height: 1.3;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .mock-recommendations {
                    padding: 12px;
                }
                .mock-title {
                    font-size: 11px;
                    font-weight: 800;
                    color: #333;
                    margin-bottom: 8px;
                }
                .mock-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 8px;
                }
                .mock-item {
                    height: 80px;
                    background: #fff;
                    border-radius: 10px;
                    border: 1px solid #f2f4f6;
                }
                .home-indicator {
                    position: absolute;
                    bottom: 4px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 90px;
                    height: 3px;
                    background: #000;
                    border-radius: 1.5px;
                }
            `}</style>
        </div>
    );
}
