import React, { useState, useEffect, useRef } from 'react';
import { getMarkers, createMarker, updateMarker, deleteMarker, updateFloorPlan, uploadFile } from '../api';
import MarkerModal from './MarkerModal';

export default function StoreMap({ token, userRole }) {
    const [markers, setMarkers] = useState([]);
    const [floorPlanUrl, setFloorPlanUrl] = useState('');
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
    const [selectedMarker, setSelectedMarker] = useState(null);
    const [isAddingMarker, setIsAddingMarker] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [hasMoved, setHasMoved] = useState(false);

    const containerRef = useRef(null);
    const isAdmin = userRole === 'ADMIN' || userRole === 'STAFF';

    useEffect(() => {
        loadData();

        const wheelHandler = (e) => {
            e.preventDefault();
            const zoomSpeed = 0.001;
            setZoom(prevZoom => Math.min(Math.max(prevZoom - e.deltaY * zoomSpeed, 0.5), 5));
        };

        const container = containerRef.current;
        if (container) {
            container.addEventListener('wheel', wheelHandler, { passive: false });
        }
        return () => {
            if (container) {
                container.removeEventListener('wheel', wheelHandler);
            }
        };
    }, []);

    const loadData = async () => {
        try {
            const data = await getMarkers(token);
            setMarkers(data.markers);
            setFloorPlanUrl(data.floorPlanUrl || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop');
        } catch (e) {
            console.error(e);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const res = await uploadFile(file, token);
            const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
            const imageUrl = `${base}${res.url}`;
            await updateFloorPlan(imageUrl, token);
            setFloorPlanUrl(imageUrl);
        } catch (e) {
            alert('이미지 업로드 중 오류가 발생했습니다.');
            console.error(e);
        }
    };

    const handlePointerDown = (e) => {
        setHasMoved(false);
        setIsDragging(true);
        setLastMousePos({ x: e.clientX, y: e.clientY });
        if (containerRef.current) containerRef.current.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e) => {
        if (!isDragging) return;
        const dx = e.clientX - lastMousePos.x;
        const dy = e.clientY - lastMousePos.y;

        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
            setHasMoved(true);
        }

        setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
        setLastMousePos({ x: e.clientX, y: e.clientY });
    };

    const handlePointerUp = (e) => {
        setIsDragging(false);
        if (containerRef.current) containerRef.current.releasePointerCapture(e.pointerId);
    };

    const handleMapClick = async (e) => {
        if (hasMoved) return; // Prevent action if map was panned
        if (!isAddingMarker) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left - offset.x) / (rect.width * zoom)) * 100;
        const y = ((e.clientY - rect.top - offset.y) / (rect.height * zoom)) * 100;

        try {
            const newMarker = await createMarker({
                label: `Point ${markers.length + 1}`,
                x: Math.min(Math.max(x, 0), 100),
                y: Math.min(Math.max(y, 0), 100)
            }, token);
            setMarkers([...markers, { ...newMarker, slots: [] }]);
            setIsAddingMarker(false);
        } catch (e) {
            console.error(e);
        }
    };

    // Consumer search logic
    const highlightedMarkers = searchQuery ? markers.filter(m =>
        m.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.slots?.some(s => s.product_id && searchQuery)
    ).map(m => m.id) : [];

    return (
        <div className="store-map-container" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
            <div className="map-header" style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div style={{ flex: '1 1 300px' }}>
                    <h2 style={{ fontSize: 'clamp(20px, 5vw, 24px)' }}>{isAdmin ? '매장 지도 관리' : '매장 상품 찾기'}</h2>
                    <p style={{ color: '#4e5968', fontSize: 13 }}>
                        {isAdmin ? '도면을 업로드하고 마커를 배치하세요.' : '찾으시는 상품명을 검색해 보세요.'}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', width: '100%', maxWidth: isAdmin ? 'none' : '400px' }}>
                    {!isAdmin && (
                        <div style={{ position: 'relative', flex: 1 }}>
                            <input
                                className="search-input"
                                placeholder="상품명 검색..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                style={{ width: '100%', padding: '10px 16px 10px 40px', borderRadius: 12 }}
                            />
                            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}>🔍</span>
                        </div>
                    )}
                    <div style={{ display: 'flex', gap: 8, width: isAdmin ? '100%' : 'auto', justifyContent: 'flex-end' }}>
                        {isAdmin && (
                            <>
                                <label className="btn-secondary" style={{ flex: 1, padding: '0 12px', height: 40, fontSize: 13 }}>
                                    🖼️ 업로드
                                    <input type="file" hidden accept="image/*" onChange={handleFileUpload} />
                                </label>
                                <button
                                    className={`btn-${isAddingMarker ? 'secondary' : 'primary'}`}
                                    onClick={() => setIsAddingMarker(!isAddingMarker)}
                                    style={{ flex: 1, padding: '0 12px', height: 40, fontSize: 13 }}
                                >
                                    {isAddingMarker ? '취소' : '📍 위치추가'}
                                </button>
                            </>
                        )}
                        <button className="btn-secondary" onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); setSearchQuery(''); }} style={{ padding: '0 12px', height: 40, fontSize: 13 }}>
                            초기화
                        </button>
                    </div>
                </div>
            </div>

            <div
                ref={containerRef}
                className="map-viewport"
                onPointerDown={(e) => handlePointerDown(e)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onClick={handleMapClick}
                style={{
                    flex: 1,
                    backgroundColor: '#f2f4f6',
                    borderRadius: 16,
                    overflow: 'hidden',
                    position: 'relative',
                    cursor: isAddingMarker ? 'crosshair' : (isDragging ? 'grabbing' : 'grab'),
                    border: '1px solid #e5e8eb',
                    touchAction: 'none',
                    minHeight: '300px'
                }}
            >
                <div style={{
                    position: 'absolute',
                    transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                    transformOrigin: '0 0',
                    width: '100%',
                    height: '100%'
                }}>
                    <img
                        src={floorPlanUrl}
                        alt="Floor Plan"
                        style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: 0.9, pointerEvents: 'none' }}
                    />

                    {markers.map(marker => {
                        const isHighlighted = highlightedMarkers.includes(marker.id);
                        return (
                            <div
                                key={marker.id}
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (!isAddingMarker) {
                                        setSelectedMarker(marker);
                                    }
                                }}
                                style={{
                                    position: 'absolute',
                                    left: `${marker.x}%`,
                                    top: `${marker.y}%`,
                                    transform: 'translate(-50%, -50%)',
                                    cursor: 'pointer',
                                    zIndex: isHighlighted ? 100 : 10,
                                    pointerEvents: 'auto'
                                }}
                            >
                                <div style={{
                                    width: isHighlighted ? '24px' : '16px',
                                    height: isHighlighted ? '24px' : '16px',
                                    borderRadius: '50%',
                                    backgroundColor: isHighlighted ? '#f04452' : '#3182f6',
                                    border: '3px solid white',
                                    boxShadow: isHighlighted
                                        ? '0 4px 12px rgba(240, 68, 82, 0.4), 0 0 0 4px rgba(240, 68, 82, 0.2)'
                                        : '0 2px 8px rgba(49, 130, 246, 0.3)',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    animation: 'markerPulse 2s ease-in-out infinite'
                                }} />
                            </div>
                        );
                    })}
                </div>
            </div>

            {selectedMarker && (
                <MarkerModal
                    marker={selectedMarker}
                    token={token}
                    isAdmin={isAdmin}
                    onClose={() => {
                        setSelectedMarker(null);
                        loadData();
                    }}
                    onDelete={async () => {
                        if (confirm('이 위치를 삭제하시겠습니까?')) {
                            await deleteMarker(selectedMarker.id, token);
                            setSelectedMarker(null);
                            loadData();
                        }
                    }}
                />
            )}
        </div>
    );
}
