import React, { useState, useEffect } from 'react';
import { getFullImageUrl, getMapsAndMarkers, getFloors } from '../api';

export default function LocationPickerModal({ initialFloor, onSelect, onClose }) {
    const [maps, setMaps] = useState([]);
    const [floors, setFloors] = useState([]);
    const [selectedFloor, setSelectedFloor] = useState(initialFloor || '1F');
    const [previewPoint, setPreviewPoint] = useState(null);
    const [selectedMarkerId, setSelectedMarkerId] = useState(null);

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            const [mapData, floorData] = await Promise.all([
                getMapsAndMarkers(),
                getFloors()
            ]);
            setMaps(mapData || []);
            setFloors(floorData || []);
            if (floorData?.length > 0 && !selectedFloor) {
                setSelectedFloor(floorData[0]);
            }
        } catch (e) { console.error(e); }
    };

    const handleMapClick = (e) => {
        const rect = e.target.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setPreviewPoint({ x, y });
        setSelectedMarkerId(null); // 새로운 지점을 클릭하면 기존 핀 선택 해제
    };

    const handleMarkerClick = (marker, e) => {
        e.stopPropagation();
        setPreviewPoint({ x: marker.x, y: marker.y });
        setSelectedMarkerId(marker._id);
    };

    const handleConfirm = () => {
        if (!previewPoint) return alert('위치를 클릭해 주세요.');
        onSelect({ 
            floor: selectedFloor, 
            x: previewPoint.x, 
            y: previewPoint.y,
            markerId: selectedMarkerId 
        });
    };

    const currentMap = maps.find(m => m.floor === selectedFloor);

    return (
        <div className="location-picker-overlay" onClick={onClose}>
            <div className="location-picker-card" onClick={e => e.stopPropagation()}>
                <div className="header">
                    <h3>📍 위치 지정 (지도 클릭 또는 핀 선택)</h3>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                <div className="floor-selector">
                    {floors.map(f => (
                        <button 
                            key={f} 
                            onClick={() => { setSelectedFloor(f); setPreviewPoint(null); setSelectedMarkerId(null); }}
                            className={selectedFloor === f ? 'active' : ''}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                <div className="map-container">
                    {currentMap?.imageUrl ? (
                        <div className="map-wrapper">
                            <img 
                                src={getFullImageUrl(currentMap.imageUrl)} 
                                onClick={handleMapClick}
                                alt={`Floor ${selectedFloor}`}
                            />
                            {/* 기존 등록된 마커(핀) 표시 */}
                            {currentMap.markers?.map(m => (
                                <div 
                                    key={m._id}
                                    className={`map-marker ${selectedMarkerId === m._id ? 'selected' : ''}`}
                                    style={{ left: `${m.x}%`, top: `${m.y}%` }}
                                    onClick={(e) => handleMarkerClick(m, e)}
                                    title={m.label}
                                />
                            ))}
                            {/* 새로 찍거나 선택한 미리보기 마커 */}
                            {previewPoint && !selectedMarkerId && (
                                <div 
                                    className="preview-marker"
                                    style={{ left: `${previewPoint.x}%`, top: `${previewPoint.y}%` }}
                                />
                            )}
                        </div>
                    ) : (
                        <div className="no-map">{selectedFloor}층의 지도가 등록되지 않았습니다.</div>
                    )}
                </div>

                <div className="footer">
                    <div>
                        <p>{selectedMarkerId ? `📌 선택된 핀: ${currentMap?.markers?.find(m => m._id === selectedMarkerId)?.label}` : (previewPoint ? '📍 새로운 위치 지정됨' : '지도를 클릭하여 위치를 지정하거나 기존 핀을 선택하세요.')}</p>
                    </div>
                    <div className="actions">
                        <button className="btn-secondary" onClick={onClose}>취소</button>
                        <button className="btn-primary" onClick={handleConfirm} disabled={!previewPoint}>선택 완료</button>
                    </div>
                </div>
            </div>

            <style>{`
                .location-picker-overlay {
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(0,0,0,0.7); display: flex; align-items: center;
                    justify-content: center; z-index: 2000;
                }
                .location-picker-card {
                    background: #fff; width: 900px; max-width: 95vw;
                    border-radius: 24px; padding: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                }
                .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                .close-btn { background: none; border: none; fontSize: 24px; cursor: pointer; color: #8b95a1; }
                
                .floor-selector { display: flex; gap: 8px; margin-bottom: 16px; flexWrap: wrap; }
                .floor-selector button {
                    padding: 8px 16px; border-radius: 10px; border: 1px solid #e5e8eb;
                    background: #fff; color: #4e5968; cursor: pointer; font-weight: 700;
                }
                .floor-selector button.active { background: #3182f6; color: #fff; border-color: #3182f6; }

                .map-container {
                    background: #f9fafb; border: 1px solid #e5e8eb; border-radius: 16px;
                    height: 500px; display: flex; align-items: center; justify-content: center;
                    overflow: hidden; position: relative;
                    padding: 16px;
                }
                .map-wrapper { 
                    position: relative; 
                    width: 375px; 
                    height: 500px; 
                    margin: 0 auto;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.06);
                    border-radius: 12px;
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
                
                .map-marker {
                    position: absolute; width: 16px; height: 16px;
                    background: #3182f6; border: 2px solid #fff; border-radius: 50%;
                    transform: translate(-50%, -50%); cursor: pointer; z-index: 10;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                }
                .map-marker.selected { background: #f04452; width: 20px; height: 20px; z-index: 11; transform: translate(-50%, -50%) scale(1.2); }
                
                .preview-marker {
                    position: absolute; width: 24px; height: 24px;
                    background: #ffbb00; border: 4px solid #fff; border-radius: 50%;
                    transform: translate(-50%, -50%); box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                    pointer-events: none; z-index: 12;
                }
                
                .no-map { color: #8b95a1; font-weight: 600; }
                .footer { margin-top: 20px; display: flex; justify-content: space-between; align-items: center; }
                .footer p { color: #4e5968; font-size: 14px; margin: 0; font-weight: 600; }
                .actions { display: flex; gap: 12px; }
                
                .btn-primary {
                    background: #3182f6; color: #fff; border: none; padding: 12px 24px;
                    border-radius: 12px; font-weight: 700; cursor: pointer;
                }
                .btn-primary:disabled { background: #e5e8eb; cursor: not-allowed; }
                .btn-secondary {
                    background: #f2f4f6; color: #4e5968; border: none; padding: 12px 24px;
                    border-radius: 12px; font-weight: 700; cursor: pointer;
                }
            `}</style>
        </div>
    );
}
