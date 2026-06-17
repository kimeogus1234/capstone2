import React, { useState, useEffect } from 'react';
import { getFullImageUrl, uploadImage, getMapsAndMarkers, createMarker, deleteMarker, updateMarker, bulkDeleteMarkers, updateMap, getFloors, addFloor, deleteFloor } from '../api';

export default function MapManager({ token }) {
    const [maps, setMaps] = useState([]);
    const [floors, setFloors] = useState([]);
    const [selectedFloor, setSelectedFloor] = useState('');
    const [loading, setLoading] = useState(true);

    // Selection & UI State
    const [selectedMarkerIds, setSelectedMarkerIds] = useState([]);
    const [newMarker, setNewMarker] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [newFloorName, setNewFloorName] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [mapData, floorData] = await Promise.all([
                getMapsAndMarkers(),
                getFloors()
            ]);
            setMaps(mapData || []);
            setFloors(floorData || []);
            if (floorData?.length > 0 && !selectedFloor) setSelectedFloor(floorData[0]);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleAddFloor = async () => {
        const trimmed = newFloorName.trim();
        if (!trimmed) return;
        try {
            await addFloor(trimmed);
            setNewFloorName('');
            await loadData();
            setSelectedFloor(trimmed);
        } catch (e) { alert('층 추가 실패'); }
    };

    const handleDeleteFloor = async (f) => {
        if (!window.confirm(`'${f}'층과 모든 마커를 삭제하시겠습니까?`)) return;
        try {
            await deleteFloor(f);
            await loadData();
        } catch (e) { alert('삭제 실패'); }
    };

    const handleUpload = async (floor, e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsUploading(true);
        const formData = new FormData();
        formData.append('image', file);
        try {
            const result = await uploadImage(formData);
            await updateMap({ floor, imageUrl: result.url });
            await loadData();
        } catch (err) { alert('업로드 실패'); } finally { setIsUploading(false); }
    };

    const handleMapClick = (e) => {
        const rect = e.target.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setNewMarker({ x, y, label: '', tagId: '', type: 'STORE' });
    };

    const saveMarker = async () => {
        if (!newMarker.label) return alert('이름을 입력하세요');
        try {
            await createMarker({ ...newMarker, floor: selectedFloor });
            setNewMarker(null);
            await loadData();
        } catch (e) { alert('저장 실패'); }
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`${selectedMarkerIds.length}개의 마커를 삭제하시겠습니까?`)) return;
        try {
            await bulkDeleteMarkers(selectedMarkerIds);
            setSelectedMarkerIds([]);
            await loadData();
        } catch (e) { alert('일괄 삭제 실패'); }
    };

    const currentMap = maps.find(m => m.floor === selectedFloor);
    const filteredMarkers = currentMap?.markers?.filter(m =>
        m.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.tagId && m.tagId.toLowerCase().includes(searchQuery.toLowerCase()))
    ) || [];

    return (
        <div className="map-manager-container">
            <header className="page-header">
                <div className="title-group">
                    <h1>🗺️ 스마트 맵 관제 센터</h1>
                    <p>층별 지도를 관리하고 NFC/QR 태그의 위치를 정밀하게 제어합니다.</p>
                </div>
                <div className="floor-controls">
                    <div className="floor-tabs">
                        {floors.map(f => (
                            <button key={f} className={selectedFloor === f ? 'active' : ''} onClick={() => setSelectedFloor(f)}>
                                {f}
                            </button>
                        ))}
                    </div>
                    <div className="add-floor-box">
                        <input placeholder="층 추가 (ex: B1)" value={newFloorName} onChange={e => setNewFloorName(e.target.value.toUpperCase())} />
                        <button onClick={handleAddFloor}>+</button>
                    </div>
                </div>
            </header>

            <div className="main-layout">
                {/* Left: Map Viewer */}
                <div className="map-viewer-card">
                    <div className="card-header">
                        <h3>{selectedFloor ? `📍 ${selectedFloor} 평면도` : '📍 평면도'}</h3>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            {selectedFloor && currentMap?.imageUrl && (
                                <label className="btn-floor-change" style={{
                                    cursor: 'pointer',
                                    padding: '6px 12px',
                                    background: '#f2f4f6',
                                    borderRadius: 8,
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: '#4e5968',
                                    display: 'inline-block'
                                }}>
                                    {isUploading ? '변경 중...' : '📷 지도 변경'}
                                    <input type="file" hidden onChange={(e) => handleUpload(selectedFloor, e)} disabled={isUploading} />
                                </label>
                            )}
                            {selectedFloor && (
                                <button className="btn-floor-delete" onClick={() => handleDeleteFloor(selectedFloor)}>층 삭제</button>
                            )}
                        </div>
                    </div>
                    <div className="map-canvas-area">
                        {selectedFloor && currentMap?.imageUrl ? (
                            <div className="map-wrapper" key={selectedFloor}>
                                <img src={getFullImageUrl(currentMap.imageUrl)} onClick={handleMapClick} alt="floor plan" />
                                {currentMap.markers?.map(m => (
                                    <div 
                                        key={m._id} 
                                        className={`marker ${m.type} ${selectedMarkerIds.includes(m._id) ? 'selected' : ''}`}
                                        style={{ left: `${m.x}%`, top: `${m.y}%` }}
                                        title={`${m.label} (${m.type})`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedMarkerIds(prev => prev.includes(m._id) ? prev.filter(id => id !== m._id) : [...prev, m._id]);
                                        }}
                                    />
                                ))}
                                {newMarker && (
                                    <div className="marker new" style={{ left: `${newMarker.x}%`, top: `${newMarker.y}%` }} />
                                )}
                            </div>
                        ) : (
                            <div className="empty-map">
                                {selectedFloor ? (
                                    <>
                                        <p>📍 {selectedFloor}층에 등록된 지도가 없습니다.</p>
                                        <label className="btn-upload">
                                            {isUploading ? '업로드 중...' : '📷 이미지 업로드'}
                                            <input type="file" hidden onChange={(e) => handleUpload(selectedFloor, e)} disabled={isUploading} />
                                        </label>
                                    </>
                                ) : (
                                    <div style={{ padding: '40px', textAlign: 'center' }}>
                                        <p style={{ fontSize: 18, fontWeight: 700, color: '#8b95a1' }}>🏢 생성된 층이 없습니다.</p>
                                        <p style={{ fontSize: 14, color: '#b0b8c1', marginTop: 12 }}>우측 상단의 [층 추가] 칸에 '1F', 'B1' 등을 입력하고 [+] 버튼을 눌러 먼저 층을 만들어 주세요!</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Marker Inventory */}
                <div className="inventory-card">
                    <div className="card-header">
                        <h3>📋 마커 인벤토리 ({filteredMarkers.length})</h3>
                    </div>
                    <div className="inventory-controls">
                        <input placeholder="마커 이름, 태그 ID 검색..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    </div>
                    
                    {newMarker ? (
                        <div className="marker-editor">
                            <h4>✨ 새 마커 설정</h4>
                            <div className="type-selector">
                                {['STORE', 'NFC', 'QR'].map(t => (
                                    <button key={t} className={newMarker.type === t ? 'active' : ''} onClick={() => setNewMarker({...newMarker, type: t})}>{t}</button>
                                ))}
                            </div>
                            <input placeholder="위치 이름 (ex: A1 기둥)" value={newMarker.label} onChange={e => setNewMarker({...newMarker, label: e.target.value})} />
                            <input placeholder="태그 ID (선택)" value={newMarker.tagId} onChange={e => setNewMarker({...newMarker, tagId: e.target.value})} />
                            <div className="edit-actions">
                                <button className="btn-save" onClick={saveMarker}>등록하기</button>
                                <button className="btn-cancel" onClick={() => setNewMarker(null)}>취소</button>
                            </div>
                        </div>
                    ) : (
                        <div className="marker-list">
                            {filteredMarkers.map(m => (
                                <div key={m._id} className={`marker-item ${selectedMarkerIds.includes(m._id) ? 'selected' : ''}`}>
                                    <input type="checkbox" checked={selectedMarkerIds.includes(m._id)} onChange={() => {
                                        setSelectedMarkerIds(prev => prev.includes(m._id) ? prev.filter(id => id !== m._id) : [...prev, m._id]);
                                    }} />
                                    <div className="m-info" onClick={() => setSelectedMarkerIds([m._id])}>
                                        <div className="m-name">
                                            <span className={`type-badge ${m.type}`}>{m.type}</span>
                                            {m.label}
                                        </div>
                                        <div className="m-tag">{m.tagId || 'ID 미지정'}</div>
                                    </div>
                                </div>
                            ))}
                            {filteredMarkers.length === 0 && <div className="empty-list">마커가 없습니다.</div>}
                        </div>
                    )}

                    {selectedMarkerIds.length > 0 && (
                        <div className="inventory-footer">
                            <span>{selectedMarkerIds.length}개 선택됨</span>
                            <button className="btn-bulk-delete" onClick={handleBulkDelete}>일괄 삭제</button>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .map-manager-container { max-width: 1300px; margin: 0 auto; padding: 20px; }
                .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; }
                .title-group h1 { font-size: 32px; font-weight: 900; }
                .title-group p { color: #8b95a1; margin-top: 8px; }

                .floor-controls { display: flex; flex-direction: column; align-items: flex-end; gap: 12px; }
                .floor-tabs { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; max-width: 500px; }
                .floor-tabs button { padding: 8px 16px; border-radius: 10px; border: 1px solid #e5e8eb; background: #fff; font-weight: 700; cursor: pointer; color: #8b95a1; }
                .floor-tabs button.active { background: #1a1f27; color: #fff; border-color: #1a1f27; }
                
                .add-floor-box { display: flex; gap: 4px; }
                .add-floor-box input { width: 100px; padding: 8px; border-radius: 10px; border: 1px solid #e5e8eb; }
                .add-floor-box button { width: 34px; background: #3182f6; color: #fff; border: none; border-radius: 10px; font-weight: 900; cursor: pointer; }

                .main-layout { display: grid; grid-template-columns: 1fr 350px; gap: 24px; }
                
                .map-viewer-card, .inventory-card { background: #fff; border-radius: 24px; border: 1px solid #e5e8eb; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 8px 24px rgba(0,0,0,0.04); }
                .card-header { padding: 20px; border-bottom: 1px solid #f2f4f6; display: flex; justify-content: space-between; align-items: center; }
                .card-header h3 { font-size: 18px; font-weight: 800; }

                .map-canvas-area { 
                    flex: 1; 
                    min-height: 600px; 
                    background: #f9fafb; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    position: relative; 
                    padding: 24px;
                    border-radius: 0 0 24px 24px;
                    overflow: auto;
                }
                .map-wrapper { 
                    position: relative; 
                    width: 450px; 
                    height: 600px; 
                    margin: 0 auto;
                    box-shadow: 0 12px 32px rgba(0,0,0,0.08); 
                    border-radius: 16px; 
                    overflow: hidden; 
                    background: #fff;
                }
                .map-wrapper img { 
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%; 
                    height: 100%; 
                    object-fit: contain; 
                    cursor: crosshair; 
                }
                
                .marker { position: absolute; width: 16px; height: 16px; border-radius: 50%; border: 3px solid #fff; transform: translate(-50%, -50%); cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.2); transition: 0.2s; }
                .marker.STORE { background: #3182f6; }
                .marker.NFC { background: #00c471; }
                .marker.QR { background: #ffbb00; }
                .marker.new { background: #D4AF37; width: 24px; height: 24px; z-index: 10; animation: bounce 0.5s infinite alternate; }
                @keyframes bounce { from { transform: translate(-50%, -50%) scale(1); } to { transform: translate(-50%, -50%) scale(1.2); } }
                .marker.selected { border-color: #1a1f27; transform: translate(-50%, -50%) scale(1.5); z-index: 10; }

                .empty-map { text-align: center; color: #8b95a1; }
                .btn-upload { display: inline-block; margin-top: 16px; padding: 12px 24px; background: #3182f6; color: #fff; border-radius: 14px; cursor: pointer; font-weight: 700; }
                .btn-floor-delete { background: #fff0f0; color: #f04452; border: none; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer; }

                .inventory-controls { padding: 16px; border-bottom: 1px solid #f2f4f6; }
                .inventory-controls input { width: 100%; padding: 10px; border-radius: 10px; border: 1px solid #e5e8eb; font-size: 14px; }

                .marker-list { flex: 1; overflow-y: auto; max-height: 520px; padding: 16px; }
                .marker-item { 
                    display: flex; 
                    align-items: center; 
                    gap: 14px; 
                    padding: 14px; 
                    border-radius: 16px; 
                    border: 1px solid #f2f4f6;
                    background: #fff;
                    transition: all 0.2s ease; 
                    cursor: pointer; 
                    margin-bottom: 8px; 
                }
                .marker-item:hover { 
                    background: #f9fafb; 
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.04);
                    border-color: #e5e8eb;
                }
                .marker-item.selected { 
                    background: #e8f3ff; 
                    border-color: #3182f6;
                }
                
                /* 커스텀 체크박스 */
                .marker-item input[type="checkbox"] {
                    width: 18px;
                    height: 18px;
                    border-radius: 6px;
                    border: 2px solid #d1d6db;
                    appearance: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: 0.2s;
                    flex-shrink: 0;
                }
                .marker-item input[type="checkbox"]:checked {
                    background: #3182f6;
                    border-color: #3182f6;
                }
                .marker-item input[type="checkbox"]:checked::after {
                    content: "✓";
                    color: #fff;
                    font-size: 11px;
                    font-weight: 900;
                }

                .m-info { flex: 1; min-width: 0; }
                .m-name { 
                    font-size: 14px; 
                    font-weight: 700; 
                    color: #1a1f27;
                    display: flex; 
                    align-items: center; 
                    gap: 8px; 
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .type-badge { 
                    font-size: 10px; 
                    font-weight: 800; 
                    padding: 2px 6px; 
                    border-radius: 6px;
                    text-transform: uppercase;
                    flex-shrink: 0;
                }
                .type-badge.STORE { background: #e8f3ff; color: #3182f6; }
                .type-badge.NFC { background: #e6f9f0; color: #00c471; }
                .type-badge.QR { background: #fffcf0; color: #ffbb00; }
                .m-tag { 
                    font-size: 12px; 
                    color: #8b95a1; 
                    margin-top: 4px; 
                    font-family: monospace;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .marker-editor { padding: 20px; background: #f9fafb; border-radius: 16px; margin: 12px; }
                .marker-editor h4 { margin-bottom: 16px; font-size: 15px; }
                .type-selector { display: flex; gap: 6px; margin-bottom: 12px; }
                .type-selector button { flex: 1; padding: 8px; border-radius: 8px; border: 1px solid #e5e8eb; background: #fff; font-size: 12px; font-weight: 700; cursor: pointer; }
                .type-selector button.active { background: #1a1f27; color: #fff; border-color: #1a1f27; }
                .marker-editor input { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #e5e8eb; margin-bottom: 12px; }
                .edit-actions { display: flex; gap: 8px; }
                .edit-actions button { flex: 1; padding: 12px; border-radius: 12px; border: none; font-weight: 700; cursor: pointer; }
                .btn-save { background: #3182f6; color: #fff; }
                .btn-cancel { background: #e5e8eb; color: #4e5968; }

                .inventory-footer { padding: 20px; border-top: 1px solid #f2f4f6; display: flex; justify-content: space-between; align-items: center; background: #1a1f27; color: #fff; }
                .btn-bulk-delete { background: #f04452; color: #fff; border: none; padding: 8px 16px; border-radius: 10px; font-weight: 700; cursor: pointer; }

                .empty-list { padding: 40px; text-align: center; color: #8b95a1; font-weight: 600; }
            `}</style>
        </div>
    );
}
