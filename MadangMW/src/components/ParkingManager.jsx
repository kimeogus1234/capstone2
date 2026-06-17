import React, { useState, useEffect } from 'react';
import { getParkingStatus, simulateParking } from '../api';

export default function ParkingManager({ token }) {
    const [status, setStatus] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            const data = await getParkingStatus();
            setStatus(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSimulate = async (zone, floor, currentOccupancy) => {
        setLoading(true);
        try {
            await simulateParking({ zone, floor, currentOccupancy }, token);
            fetchStatus();
        } catch (error) {
            alert('시뮬레이션 실패');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="manager-container">
            <div style={{ marginBottom: 32 }}>
                <h1>🅿️ 주차 시스템 상세 관리</h1>
                <p style={{ color: 'var(--text-sub)' }}>실시간 주차 구역 점유 현황 및 시뮬레이션을 수행합니다.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
                {status.map(p => (
                    <div key={`${p.floor}-${p.zone}`} className="card" style={{ borderLeft: `8px solid ${p.currentOccupancy / p.totalSpaces > 0.9 ? 'var(--error-color)' : 'var(--success-color)'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h3 style={{ margin: 0 }}>{p.floor} - {p.zone}구역</h3>
                            <span style={{ fontWeight: 800 }}>{Math.round((p.currentOccupancy / p.totalSpaces) * 100)}%</span>
                        </div>
                        
                        <div style={{ background: '#f2f4f6', height: 8, borderRadius: 4, marginBottom: 16, overflow: 'hidden' }}>
                            <div style={{ 
                                width: `${(p.currentOccupancy / p.totalSpaces) * 100}%`, 
                                height: '100%', 
                                background: p.currentOccupancy / p.totalSpaces > 0.9 ? 'var(--error-color)' : 'var(--primary-color)',
                                transition: 'width 0.5s ease'
                            }}></div>
                        </div>

                        <div style={{ fontSize: 14, color: 'var(--text-sub)', marginBottom: 20 }}>
                            🚗 {p.currentOccupancy} / {p.totalSpaces} 대 점유 중
                        </div>

                        <div style={{ borderTop: '1px solid #eee', paddingTop: 16 }}>
                            <label style={{ fontSize: 12 }}>점유율 시뮬레이션 (수동 조절)</label>
                            <input 
                                type="range" 
                                min="0" 
                                max={p.totalSpaces} 
                                value={p.currentOccupancy}
                                onChange={(e) => handleSimulate(p.zone, p.floor, parseInt(e.target.value))}
                                disabled={loading}
                                style={{ marginTop: 8 }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {status.length === 0 && (
                <div className="card" style={{ textAlign: 'center', padding: 48 }}>
                    <p style={{ color: 'var(--text-caption)' }}>등록된 주차 구역이 없습니다. (DB 초기화가 필요합니다)</p>
                    <button className="btn-primary" onClick={() => handleSimulate('A', 'B1', 20)}>+ 기본 구역(A-B1) 생성</button>
                    <button className="btn-primary" onClick={() => handleSimulate('B', 'B1', 45)} style={{ marginLeft: 8 }}>+ 기본 구역(B-B1) 생성</button>
                </div>
            )}
        </div>
    );
}
