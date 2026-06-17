import React from 'react';

export default function ProductLabelPrinter({ products, onBack }) {
    const handlePrint = () => {
        window.print();
    };

    return (
        <div style={{ padding: '20px' }}>
            <div className="no-print" style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: 24, fontWeight: 800 }}>상품 가격표 출력 미리보기</h2>
                    <p style={{ color: '#8b95a1' }}>프린터 설정에서 '배경 그래픽'을 켜주세요. {products.length}개의 상품이 선택되었습니다.</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={onBack} className="btn-secondary">목록으로 돌아가기</button>
                    <button onClick={handlePrint} className="btn-primary" style={{ padding: '12px 24px' }}>🖨️ 가격표 인쇄하기</button>
                </div>
            </div>

            <div className="print-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
                gap: '24px',
                padding: '20px',
                background: 'white'
            }}>
                {products.map(p => (
                    <div key={p._id || p.id} className="label-item" style={{
                        width: '290px',
                        minHeight: '190px',
                        border: '2px solid #000',
                        padding: '16px',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        backgroundColor: '#fff',
                        margin: '0 auto',
                        boxSizing: 'border-box'
                    }}>
                        {/* Header */}
                        <div style={{ fontSize: '11px', fontWeight: 800, borderBottom: '2px solid #000', paddingBottom: '6px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', color: '#000' }}>
                            <span>STORE PRODUCT TAG</span>
                            <span style={{ color: '#3182f6' }}>{p.category ? (Array.isArray(p.category) ? p.category[0] : p.category) : 'General'}</span>
                        </div>

                        {/* Body */}
                        <div style={{ flex: 1, marginBottom: '12px' }}>
                            <div style={{ fontSize: '19px', fontWeight: 900, marginBottom: '8px', lineHeight: '1.25', wordBreak: 'break-all', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {p.name}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                <span style={{ fontSize: '28px', fontWeight: 900 }}>{Number(p.price || 0).toLocaleString()}</span>
                                <span style={{ fontSize: '15px', fontWeight: 700 }}>원</span>
                            </div>
                        </div>

                        {/* Footer */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #ddd', paddingTop: '10px' }}>
                            <div style={{ flex: 1 }}>
                                <img 
                                    src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${p._id || p.id}&scale=1&height=10&includetext=false`} 
                                    alt="Barcode" 
                                    style={{ width: '100%', height: '32px', display: 'block' }}
                                />
                                <div style={{ fontSize: '9px', textAlign: 'center', marginTop: '4px', fontFamily: 'monospace', fontWeight: 700 }}>
                                    {p._id ? p._id.substring(p._id.length - 8).toUpperCase() : '00000000'}
                                </div>
                            </div>
                            <div style={{ marginLeft: '16px' }}>
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=consumerapp://product/${p._id}`}
                                    alt="QR"
                                    style={{ width: '54px', height: '54px', border: '1px solid #eee', padding: '2px', display: 'block' }}
                                />
                            </div>
                        </div>

                        {/* Badge */}
                        <div style={{ position: 'absolute', top: '24px', right: '16px', background: '#000', color: '#fff', fontSize: '9px', padding: '2px 8px', fontWeight: 800, borderRadius: '4px' }}>
                            BEST
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; padding: 0 !important; margin: 0 !important; width: 210mm; }
                    .print-grid { 
                        display: block !important; 
                        padding: 10mm !important; 
                        margin: 0 !important;
                    }
                    .label-item { 
                        page-break-inside: avoid; 
                        margin-bottom: 20px !important;
                        float: left;
                        margin-right: 20px !important;
                    }
                    header, footer, nav { display: none !important; }
                }
            `}</style>
        </div>
    );
}
