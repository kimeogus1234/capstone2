import React, { useState, useEffect } from 'react';

// 유틸리티: 이미지 URL 처리
export const getImageUrl = (url) => {
    if (!url) return 'https://placehold.co/600x800?text=No+Image';
    if (typeof url === 'string' && url.startsWith('http')) return url;
    const base = import.meta.env.VITE_UPLOADS_BASE_URL || 'http://localhost:3000/uploads';
    return url.startsWith('/') ? `${base}${url}` : `${base}/${url}`;
};

export default function MobilePreview({ product, onClose }) {
    const [selectedOptions, setSelectedOptions] = useState({});
    const [currentVariant, setCurrentVariant] = useState(null);
    const [isWished, setIsWished] = useState(false);

    if (!product) return null;

    // 초기 바리언트 설정 (정찰제의 경우)
    useEffect(() => {
        if (product.display_template === 'A' && product.variants?.[0]) {
            setCurrentVariant(product.variants[0]);
        }
    }, [product]);

    // 옵션 선택 시 바리언트 매칭 (변동제의 경우)
    useEffect(() => {
        if (!product || product.display_template !== 'B') return;
        const variant = product.variants?.find(v => 
            Object.entries(selectedOptions).every(([name, val]) => v.option_values[name] === val)
        );
        setCurrentVariant(variant);
    }, [selectedOptions, product]);

    return (
        <div className="preview-overlay" onClick={onClose}>
            <div className="iphone-frame" onClick={e => e.stopPropagation()}>
                <div className="mobile-inner">
                    {/* Header: ProductDetail.jsx 스타일 */}
                    <header className="mobile-header">
                        <button onClick={onClose} className="back-btn">←</button>
                        <h1 className="header-title">{product.brand}</h1>
                        <button className="cart-nav-btn">🛒</button>
                    </header>

                    <main className="mobile-content">
                        {/* Main Image */}
                        <div className="main-image-area">
                            <img src={getImageUrl(product.images?.main)} alt={product.name} />
                        </div>

                        {/* Info Section */}
                        <div className="info-section">
                            <p className="brand-name">{product.brand}</p>
                            <h2 className="product-name">{product.name}</h2>
                            <div className="price-area">
                                <span className="price">
                                    {(currentVariant?.sale_price || product.base_price || 0).toLocaleString()}
                                </span>
                                <span className="unit">원</span>
                            </div>
                        </div>

                        {/* Option Section (Type B) */}
                        {product.display_template === 'B' && product.options?.length > 0 && (
                            <div className="option-section">
                                {product.options.map(opt => (
                                    <div key={opt.name} className="opt-group">
                                        <label>{opt.name}</label>
                                        <div className="opt-chips">
                                            {opt.values.map(val => (
                                                <button 
                                                    key={val}
                                                    className={`chip ${selectedOptions[opt.name] === val ? 'active' : ''}`}
                                                    onClick={() => setSelectedOptions({...selectedOptions, [opt.name]: val})}
                                                >
                                                    {val}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Detail Section (Description Blocks) */}
                        <div className="detail-section">
                            <div className="tab-menu">
                                <button className="active">상품 상세정보</button>
                                <button>리뷰</button>
                                <button>문의/안내</button>
                            </div>
                            <div className="description-blocks">
                                {product.description_blocks?.map((block, i) => (
                                    <div key={i} className={`block ${block.type.toLowerCase()}`}>
                                        {block.type === 'TEXT' && <p>{block.content}</p>}
                                        {block.type === 'IMAGE' && <img src={getImageUrl(block.content)} alt="" />}
                                    </div>
                                ))}
                                {/* Media 필드 호환 (레거시/추가 데이터) */}
                                {(!product.description_blocks || product.description_blocks.length === 0) && product.media?.map((block, i) => (
                                    <div key={i} className={`block ${block.type.toLowerCase()}`}>
                                        {block.type === 'TEXT' && <p>{block.content}</p>}
                                        {block.type === 'IMAGE' && <img src={getImageUrl(block.content)} alt="" />}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recommendation Sim (Visual only) */}
                        <div className="recommendation-section">
                            <h3 className="section-title">스타필드 추천 아이템 ✨</h3>
                            <div className="recommendation-list">
                                <div className="rec-card placeholder"></div>
                                <div className="rec-card placeholder"></div>
                            </div>
                        </div>
                    </main>

                    {/* Bottom Purchase Bar */}
                    <footer className="purchase-bar">
                        <button className={`wish-btn ${isWished ? 'active' : ''}`} onClick={() => setIsWished(!isWished)}>
                            {isWished ? '❤️' : '♡'}
                        </button>
                        <button className="cart-btn">장바구니</button>
                        <button 
                            className="buy-btn" 
                            disabled={product.display_template === 'B' && !currentVariant}
                        >
                            {product.display_template === 'B' && !currentVariant ? '옵션을 선택하세요' : '바로 구매하기'}
                        </button>
                    </footer>
                </div>
            </div>

            <style>{`
                .preview-overlay {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.85);
                    display: flex; align-items: center; justify-content: center;
                    z-index: 2000; backdrop-filter: blur(10px);
                }
                .iphone-frame {
                    width: 375px; height: 812px;
                    background: #111; border-radius: 60px;
                    padding: 12px; box-shadow: 0 50px 100px rgba(0,0,0,0.5);
                    position: relative; border: 4px solid #333;
                }
                .mobile-inner {
                    width: 100%; height: 100%;
                    background: #fff; border-radius: 48px;
                    overflow: hidden; position: relative;
                    display: flex; flex-direction: column;
                }
                .mobile-header {
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 40px 20px 15px; border-bottom: 1px solid #f2f4f6;
                }
                .header-title { font-size: 15px; font-weight: 700; color: #111; }
                .back-btn, .cart-nav-btn { background: none; border: none; font-size: 18px; cursor: pointer; }

                .mobile-content { flex: 1; overflow-y: auto; scrollbar-width: none; }
                .mobile-content::-webkit-scrollbar { display: none; }

                .main-image-area img { width: 100%; height: auto; display: block; }
                
                .info-section { padding: 20px; text-align: left; }
                .brand-name { color: #8b95a1; font-size: 13px; margin-bottom: 4px; font-weight: 600; }
                .product-name { font-size: 19px; font-weight: 700; margin-bottom: 12px; color: #191f28; }
                .price { font-size: 24px; font-weight: 900; color: #111; }
                .unit { font-size: 16px; margin-left: 2px; font-weight: 700; }

                .option-section { padding: 0 20px 20px; text-align: left; }
                .opt-group label { display: block; font-size: 12px; font-weight: 800; color: #4e5968; margin-bottom: 10px; }
                .opt-chips { display: flex; gap: 8px; flex-wrap: wrap; }
                .chip { padding: 9px 15px; border: 1px solid #e5e8eb; border-radius: 10px; background: #fff; font-size: 13px; font-weight: 600; color: #4e5968; }
                .chip.active { border-color: #3182f6; color: #3182f6; background: #f2f8ff; font-weight: 800; }

                .tab-menu { display: flex; border-bottom: 1px solid #f2f4f6; margin-top: 20px; }
                .tab-menu button { flex: 1; padding: 15px; background: none; border: none; color: #8b95a1; font-size: 13px; font-weight: 600; }
                .tab-menu button.active { color: #111; font-weight: 800; border-bottom: 2px solid #111; }

                .description-blocks { padding: 20px 0; }
                .description-blocks p { padding: 0 20px; font-size: 15px; line-height: 1.8; color: #4e5968; white-space: pre-wrap; }
                .description-blocks img { width: 100%; margin: 10px 0; }

                .recommendation-section { padding: 20px; border-top: 8px solid #f2f4f6; text-align: left; }
                .section-title { font-size: 16px; font-weight: 800; margin-bottom: 15px; }
                .recommendation-list { display: flex; gap: 12px; }
                .rec-card.placeholder { width: 120px; height: 160px; background: #f2f4f6; border-radius: 12px; flex-shrink: 0; }

                .purchase-bar { 
                    height: 80px; background: #fff; display: flex; align-items: center;
                    padding: 0 20px; gap: 10px; border-top: 1px solid #f2f4f6;
                    padding-bottom: 15px;
                }
                .wish-btn { width: 50px; height: 50px; border-radius: 14px; border: 1px solid #e5e8eb; background: #fff; font-size: 20px; cursor: pointer; }
                .wish-btn.active { border-color: #f04452; }
                .cart-btn { flex: 1; height: 50px; border-radius: 14px; border: 1px solid #e5e8eb; background: #fff; font-weight: 800; color: #4e5968; font-size: 15px; cursor: pointer; }
                .buy-btn { flex: 2; height: 50px; border-radius: 14px; border: none; background: #3182f6; color: #fff; font-weight: 800; font-size: 15px; cursor: pointer; }
                .buy-btn:disabled { background: #e5e8eb; color: #8b95a1; cursor: not-allowed; }
            `}</style>
        </div>
    );
}
