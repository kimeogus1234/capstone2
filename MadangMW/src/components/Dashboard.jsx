import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats } from '../api';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend, Cell
} from 'recharts';

export default function Dashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getDashboardStats();
            setStats(data);
        } catch (e) {
            console.error('Failed to load dashboard stats', e);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !stats) {
        return <div className="loading-container">관제 데이터를 실시간으로 동기화 중입니다...</div>;
    }

    const { summary, salesTrend } = stats;

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div className="title-area">
                    <h1>MadangM Control Tower</h1>
                    <div className="live-indicator">
                        <span className="pulse"></span>
                        LIVE: 통합 시스템 관제 중
                    </div>
                </div>
                <p className="subtitle">초대형 쇼핑몰의 매출, 회원, 입점 매장 현황을 실시간으로 분석합니다.</p>
            </header>

            <div className="stats-grid">
                <div className="stat-card primary">
                    <div className="card-info">
                        <span className="label">누적 매출액</span>
                        <h2 className="value">{summary.totalSales.toLocaleString()}원</h2>
                        <span className="change positive">↑ 실시간 업데이트</span>
                    </div>
                    <div className="card-icon">💰</div>
                </div>
                <div className="stat-card">
                    <div className="card-info">
                        <span className="label">전체 주문수</span>
                        <h2 className="value">{summary.orderCount.toLocaleString()}건</h2>
                        <span className="sub-label">결제 완료 기준</span>
                    </div>
                    <div className="card-icon blue">📦</div>
                </div>
                <div className="stat-card highlight">
                    <div className="card-info">
                        <span className="label">처리 대기 중</span>
                        <h2 className="value">{summary.pendingOrders.toLocaleString()}건</h2>
                        <span className="sub-label urgent">🚨 즉시 확인 필요</span>
                    </div>
                    <div className="card-icon red">🚨</div>
                </div>
                <div className="stat-card">
                    <div className="card-info">
                        <span className="label">총 회원수</span>
                        <h2 className="value">{summary.userCount.toLocaleString()}명</h2>
                        <span className="sub-label">Starfield Members</span>
                    </div>
                    <div className="card-icon purple">👥</div>
                </div>
            </div>

            <div className="charts-section">
                <div className="chart-card main-chart">
                    <h3>📈 최근 7일 매출 추이</h3>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height={350}>
                            <AreaChart data={salesTrend}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3182f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3182f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f2f4f6" />
                                <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{ fill: '#8b95a1', fontSize: 12 }} dy={10} />
                                <YAxis hide />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
                                    formatter={(val) => [`${val.toLocaleString()}원`, '매출액']}
                                />
                                <Area type="monotone" dataKey="dailySales" stroke="#3182f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-card side-chart">
                    <h3>📊 요일별 주문량</h3>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={salesTrend}>
                                <XAxis dataKey="_id" hide />
                                <Tooltip
                                    cursor={{ fill: '#f9fafb' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
                                    formatter={(val) => [`${val}건`, '주문수']}
                                />
                                <Bar dataKey="dailyOrders" radius={[6, 6, 0, 0]}>
                                    {salesTrend.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === salesTrend.length - 1 ? '#3182f6' : '#e5e8eb'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="bottom-grid">
                <div className="info-box">
                    <h3>🏢 입점 및 상품 현황</h3>
                    <div className="info-items">
                        <div className="item">
                            <span className="label">입점 매장</span>
                            <span className="val">{summary.storeCount}개</span>
                        </div>
                        <div className="item">
                            <span className="label">등록 상품</span>
                            <span className="val">{summary.productCount.toLocaleString()}개</span>
                        </div>
                    </div>
                </div>
                <div className="quick-actions">
                    <h3>⚡ 빠른 메뉴</h3>
                    <div className="action-btns">
                        <button onClick={() => navigate('/orders')}>📦 배송 관리</button>
                        <button onClick={() => navigate('/promotions')}>🎁 쿠폰 발행</button>
                        <button onClick={() => navigate('/users')}>👥 회원 관리</button>
                    </div>
                </div>
            </div>

            <style>{`
                .dashboard-container { max-width: 1300px; margin: 0 auto; padding-bottom: 60px; }
                .dashboard-header { margin-bottom: 40px; }
                .title-area { display: flex; align-items: center; gap: 20px; }
                .title-area h1 { font-size: 34px; font-weight: 900; color: #1a1f27; letter-spacing: -1px; }
                .live-indicator { display: flex; align-items: center; gap: 8px; background: #e7f9f1; color: #00c471; padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 800; }
                .pulse { width: 8px; height: 8px; background: #00c471; border-radius: 50%; animation: pulse-anim 1.5s infinite; }
                @keyframes pulse-anim { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: 0.5; } 100% { transform: scale(1); opacity: 1; } }
                .subtitle { color: #8b95a1; margin-top: 10px; font-size: 16px; }

                .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; margin-bottom: 40px; }
                .stat-card { background: #fff; border-radius: 24px; padding: 30px; border: 1px solid #e5e8eb; display: flex; justify-content: space-between; align-items: center; transition: 0.3s; }
                .stat-card:hover { transform: translateY(-5px); box-shadow: 0 15px 30px rgba(0,0,0,0.05); }
                .stat-card.primary { border-color: #3182f6; border-width: 2px; }
                .stat-card.highlight { border-color: #f04452; border-width: 2px; }
                .stat-card .label { font-size: 14px; font-weight: 700; color: #8b95a1; }
                .stat-card .value { font-size: 28px; font-weight: 900; color: #1a1f27; margin: 8px 0; }
                .stat-card .change { font-size: 12px; font-weight: 800; color: #3182f6; }
                .stat-card .sub-label { font-size: 12px; color: #adb5bd; font-weight: 600; }
                .stat-card .sub-label.urgent { color: #f04452; }
                .card-icon { width: 56px; height: 56px; border-radius: 18px; background: #f9fafb; display: flex; align-items: center; justify-content: center; font-size: 24px; }
                .card-icon.blue { background: #e8f3ff; color: #3182f6; }
                .card-icon.red { background: #fff0f0; color: #f04452; }
                .card-icon.purple { background: #f3e8ff; color: #9333ea; }

                .charts-section { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; margin-bottom: 40px; }
                .chart-card { background: #fff; border-radius: 28px; padding: 30px; border: 1px solid #e5e8eb; }
                .chart-card h3 { font-size: 18px; font-weight: 800; margin-bottom: 30px; color: #1a1f27; }
                .chart-wrapper { width: 100%; }

                .bottom-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
                .info-box, .quick-actions { background: #fff; border-radius: 24px; padding: 30px; border: 1px solid #e5e8eb; }
                .info-box h3, .quick-actions h3 { font-size: 18px; font-weight: 800; margin-bottom: 24px; }
                .info-items { display: flex; gap: 40px; }
                .item { display: flex; flex-direction: column; gap: 6px; }
                .item .label { font-size: 13px; color: #8b95a1; font-weight: 600; }
                .item .val { font-size: 20px; font-weight: 900; color: #1a1f27; }

                .action-btns { display: flex; gap: 12px; }
                .action-btns button { flex: 1; padding: 14px; border-radius: 14px; border: 1px solid #e5e8eb; background: #fff; font-weight: 700; cursor: pointer; transition: 0.2s; }
                .action-btns button:hover { background: #f2f4f6; border-color: #3182f6; color: #3182f6; }

                .loading-container { display: flex; align-items: center; justify-content: center; height: 400px; font-weight: 800; color: #8b95a1; }

                @media (max-width: 1200px) {
                    .charts-section { grid-template-columns: 1fr; }
                    .bottom-grid { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    );
}
