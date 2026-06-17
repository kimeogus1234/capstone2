import React, { useState, useEffect } from 'react';
import * as api from '../api';
import ContentBlockEditor, { ImageUploader } from './ContentBlockEditor';
import { getCategoryConfig } from '../utils/categoryConfig';

const normalizeFormStatus = (status) => {
    const s = String(status || 'ON_SALE').toUpperCase().replace(/-/g, '_');
    const allowed = ['ON_SALE', 'OUT_OF_STOCK', 'HIDDEN', 'STOPPED'];
    return allowed.includes(s) ? s : 'ON_SALE';
};

export default function RegisterProductB({ token, onSuccess, initialData, user }) {
    const [loading, setLoading] = useState(false);
    const [stores, setStores] = useState([]);
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        brand: '',
        storeId: user?.role === 'STAFF' ? user.assignedStoreId : '',
        category: '',
        base_price: 0,
        description: '',
        status: 'on_sale'
    });

    const [descriptionBlocks, setDescriptionBlocks] = useState([
        { type: 'TEXT', content: '' }
    ]);
    const [optionTypes, setOptionTypes] = useState([
        { name: '사이즈/색상', values: [] }
    ]);
    const [variants, setVariants] = useState([]);
    const [notices, setNotices] = useState([]);
    const [productImages, setProductImages] = useState([]);

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        if (formData.storeId) {
            loadCategoriesByStore(formData.storeId);
        } else {
            setCategories([]);
        }
    }, [formData.storeId]);

    const loadInitialData = async () => {
        try {
            const storeRes = await api.getStores();
            setStores(storeRes.stores || []);
            if (initialData) {
                const normalizedData = {
                    ...initialData,
                    storeId: typeof initialData.storeId === 'object' ? initialData.storeId?._id : initialData.storeId,
                    category: typeof initialData.category === 'object' ? initialData.category?._id : initialData.category
                };
                setFormData({
                    ...normalizedData,
                    status: normalizeFormStatus(initialData.status),
                });

                if (initialData.description_blocks && initialData.description_blocks.length > 0) {
                    setDescriptionBlocks(initialData.description_blocks);
                } else if (initialData.description) {
                    try { setDescriptionBlocks(JSON.parse(initialData.description)); } catch (e) { }
                }
                // 상세 고시 정보: DB 필드명 product_notices 사용
                if (initialData.product_notices && Array.isArray(initialData.product_notices)) {
                    setNotices(initialData.product_notices);
                }
                if (initialData.images) {
                    const list = [];
                    if (initialData.images.main) list.push(initialData.images.main);
                    if (Array.isArray(initialData.images.gallery)) {
                        initialData.images.gallery.forEach(img => {
                            if (img && !list.includes(img)) list.push(img);
                        });
                    }
                    setProductImages(list);
                }
                if (initialData.variants && initialData.variants.length > 0) {
                    setVariants(initialData.variants);
                    const values = initialData.variants.map(v => v.option_values ? Object.values(v.option_values)[0] : '').filter(Boolean);
                    setOptionTypes([{ name: '사이즈/색상', values }]);
                }
                if (normalizedData.storeId) {
                    await loadCategoriesByStore(normalizedData.storeId);
                }
            }
        } catch (e) { console.error(e); }
    };

    const loadCategoriesByStore = async (storeId) => {
        try {
            const data = await api.getCategoryTree(storeId);
            setCategories(data);
        } catch (e) { console.error(e); }
    };

    const handleCategoryChange = (catId) => {
        setFormData({ ...formData, category: catId });
        let rootName = '';
        const findRootName = (list, parentName = '') => {
            for (let c of list) {
                if (c._id === catId) { 
                    rootName = parentName || c.name; 
                    return true; 
                }
                if (c.children && findRootName(c.children, parentName || c.name)) return true;
            }
            return false;
        };
        findRootName(categories);
        const config = getCategoryConfig(rootName);
        setNotices(config.notices);
    };

    const handleNoticeChange = (index, value) => {
        const newNotices = [...notices];
        newNotices[index].value = value;
        setNotices(newNotices);
    };

    const handleAddOptionValue = (val) => {
        if (!val) return;
        const newValues = [...optionTypes[0].values, val];
        setOptionTypes([{ ...optionTypes[0], values: newValues }]);
        setVariants([...variants, {
            option_values: { [optionTypes[0].name]: val },
            sale_price: formData.base_price,
            stock_quantity: 100,
            sku: val
        }]);
    };

    const handleRemoveOptionValue = (val) => {
        const newValues = optionTypes[0].values.filter(v => v !== val);
        setOptionTypes([{ ...optionTypes[0], values: newValues }]);
        setVariants(variants.filter(v => Object.values(v.option_values)[0] !== val));
    };

    const handleUpdateVariantName = (idx, newName) => {
        const newVariants = [...variants];
        const oldName = Object.values(newVariants[idx].option_values)[0];
        newVariants[idx].option_values = { [optionTypes[0].name]: newName };
        newVariants[idx].sku = newName; // SKU도 함께 업데이트
        setVariants(newVariants);

        // 상단 칩 목록도 동기화
        const newValues = optionTypes[0].values.map(v => v === oldName ? newName : v);
        setOptionTypes([{ ...optionTypes[0], values: newValues }]);
    };

    const handleDragStart = (e, index) => {
        e.dataTransfer.setData('text/plain', index.toString());
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e, targetIndex) => {
        e.preventDefault();
        const sourceIndexStr = e.dataTransfer.getData('text/plain');
        if (sourceIndexStr === '') return;
        const sourceIndex = parseInt(sourceIndexStr, 10);
        if (sourceIndex === targetIndex) return;

        const updated = [...productImages];
        const [movedItem] = updated.splice(sourceIndex, 1);
        updated.splice(targetIndex, 0, movedItem);
        setProductImages(updated);
    };

    const handleDeleteImage = (index) => {
        setProductImages(productImages.filter((_, idx) => idx !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (variants.length === 0) {
            alert('옵션을 1개 이상 추가해주세요.');
            return;
        }
        setLoading(true);
        try {
            const normalizedVariants = variants.map((v, idx) => ({
                sku: v.sku || Object.values(v.option_values || {})[0] || `opt-${idx}`,
                option_values: v.option_values || {},
                sale_price: v.sale_price === '' ? 0 : Number(v.sale_price ?? formData.base_price ?? 0),
                stock_quantity: v.stock_quantity === '' ? 0 : Number(v.stock_quantity ?? 0),
                discount_rate: Number(v.discount_rate || 0),
                is_main_variant: idx === 0,
            }));

            const payload = {
                ...formData,
                display_template: 'B',
                status: normalizeFormStatus(formData.status),
                options: optionTypes,
                description: JSON.stringify(descriptionBlocks),
                description_blocks: descriptionBlocks,
                product_notices: notices,
                variants: normalizedVariants,
                base_price: normalizedVariants[0]?.sale_price ?? Number(formData.base_price) ?? 0,
                images: {
                    main: productImages[0] || '',
                    gallery: productImages.slice(1),
                    description_detail: initialData?.images?.description_detail || ''
                }
            };
            if (initialData) {
                await api.updateProduct(initialData._id, payload);
            } else {
                await api.createProduct(payload);
            }
            alert('기획 상품이 저장되었습니다.');
            onSuccess();
        } catch (error) {
            alert(error.response?.data?.message || '실패');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="pro-editor">
            <form onSubmit={handleSubmit}>
                <section className="section">
                    <h3 className="section-title">1. 매장 및 카테고리</h3>
                    <div className="form-row">
                        <div className="input-group">
                            <label>매장 선택</label>
                            <select 
                                value={formData.storeId} 
                                onChange={e => setFormData({...formData, storeId: e.target.value})} 
                                disabled={user?.role === 'STAFF'}
                                required
                            >
                                <option value="">매장 선택</option>
                                {stores.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div className="input-group">
                            <label>카테고리</label>
                            <select value={formData.category} onChange={e => handleCategoryChange(e.target.value)} required>
                                <option value="">카테고리 선택</option>
                                {categories.map(main => (
                                    <optgroup key={main._id} label={main.name}>
                                        {main.children?.map(sub => (
                                            <React.Fragment key={sub._id}>
                                                <option value={sub._id}>-- {sub.name} --</option>
                                                {sub.children?.map(item => (
                                                    <option key={item._id} value={item._id}>&nbsp;&nbsp;&nbsp;{item.name}</option>
                                                ))}
                                            </React.Fragment>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                        </div>
                    </div>
                </section>

                <section className="section">
                    <h3 className="section-title">2. 상품명 및 옵션</h3>
                    <div className="form-row">
                        <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="상품명" required />
                        <input value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} placeholder="브랜드" required />
                    </div>
                    <div style={{marginTop: 20}}>
                        <label style={{fontSize: 12, fontWeight: 700, color: '#4e5968'}}>옵션값 추가 (엔터)</label>
                        <input 
                            placeholder="예: 블랙, XL 등" 
                            style={{marginTop: 8}}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddOptionValue(e.target.value); e.target.value = ''; } }}
                        />
                        <div style={{display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap'}}>
                            {optionTypes[0].values.map(v => (
                                <span key={v} style={{background: '#3182f6', color: '#fff', padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6}}>
                                    {v}
                                    <button type="button" onClick={() => handleRemoveOptionValue(v)} style={{background: 'none', border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer', padding: 0}}>×</button>
                                </span>
                            ))}
                        </div>
                    </div>

                    <div style={{marginTop: 30}}>
                        <h4 style={{fontSize: 14, fontWeight: 800, marginBottom: 15}}>📦 옵션별 상세 설정 (이름/가격/재고)</h4>
                        <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
                            {variants.map((v, idx) => (
                                <div key={idx} style={{display: 'flex', alignItems: 'center', gap: 10, background: '#f9fafb', padding: '12px 15px', borderRadius: 12, border: '1px solid #eee'}}>
                                    <div style={{flex: 1.5}}>
                                        <input 
                                            value={Object.values(v.option_values)[0]} 
                                            onChange={e => handleUpdateVariantName(idx, e.target.value)}
                                            style={{height: 36, fontSize: 14, fontWeight: 700}}
                                            placeholder="옵션명"
                                        />
                                    </div>
                                    <div style={{display: 'flex', alignItems: 'center', gap: 5}}>
                                        <label style={{fontSize: 11, color: '#8b95a1'}}>가격</label>
                                        <input 
                                            type="number" 
                                            value={v.sale_price} 
                                            onChange={e => {
                                                const val = e.target.value;
                                                const newVariants = [...variants];
                                                newVariants[idx].sale_price = val === '' ? '' : Number(val);
                                                setVariants(newVariants);
                                            }}
                                            style={{width: 90, height: 36, fontSize: 13}}
                                        />
                                    </div>
                                    <div style={{display: 'flex', alignItems: 'center', gap: 5}}>
                                        <label style={{fontSize: 11, color: '#8b95a1'}}>재고</label>
                                        <input 
                                            type="number" 
                                            value={v.stock_quantity} 
                                            onChange={e => {
                                                const val = e.target.value;
                                                const newVariants = [...variants];
                                                newVariants[idx].stock_quantity = val === '' ? '' : Number(val);
                                                setVariants(newVariants);
                                            }}
                                            style={{width: 70, height: 36, fontSize: 13}}
                                        />
                                    </div>
                                    <button type="button" onClick={() => {
                                        const val = Object.values(v.option_values)[0];
                                        handleRemoveOptionValue(val);
                                    }} style={{color: '#ff4d4d', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18}}>×</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="section image-upload-section">
                    <h3 className="section-title">🖼️ 대표 상품 이미지 (다중 등록 및 순서 변경 가능)</h3>
                    <p style={{ fontSize: 12, color: '#8b95a1', marginBottom: 15 }}>
                        * 여러 장의 이미지를 등록할 수 있습니다. 마우스로 드래그하여 순서를 바꿀 수 있으며, 가장 앞(1번)의 이미지가 대표 이미지로 지정됩니다.
                    </p>
                    <div className="product-images-grid">
                        {productImages.map((imgUrl, index) => (
                            <div 
                                key={index} 
                                className="draggable-image-card"
                                draggable
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragOver={(e) => handleDragOver(e)}
                                onDrop={(e) => handleDrop(e, index)}
                            >
                                <img src={api.getFullImageUrl(imgUrl)} alt={`Product ${index}`} />
                                {index === 0 && <span className="main-badge">대표</span>}
                                <span className="order-number">{index + 1}</span>
                                <button 
                                    type="button" 
                                    className="btn-delete-img" 
                                    onClick={() => handleDeleteImage(index)}
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                        
                        <div className="image-uploader-card-mini">
                            <ImageUploader token={token} onUpload={(url) => setProductImages([...productImages, url])} />
                        </div>
                    </div>
                </section>

                {notices.length > 0 && (
                    <section className="section notice-section">
                        <h3 className="section-title">카테고리별 상세 고시 정보</h3>
                        <div className="notice-grid">
                            {notices.map((n, idx) => (
                                <div key={n.label} className="notice-item">
                                    <label>{n.label}</label>
                                    <input value={n.value} onChange={e => handleNoticeChange(idx, e.target.value)} placeholder={`${n.label} 입력`} required />
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <section className="section">
                    <h3 className="section-title">상세 상품 설명</h3>
                    <ContentBlockEditor blocks={descriptionBlocks} onChange={setDescriptionBlocks} token={token} />
                </section>

                <button type="submit" className="btn-finish" disabled={loading}>
                    {initialData ? '기획 상품 수정 완료' : '기획 상품 등록 완료'}
                </button>
            </form>

            <style>{`
                .pro-editor { max-width: 900px; margin: 0 auto; background: #fff; padding: 40px; border-radius: 24px; }
                .section { margin-bottom: 40px; }
                .section-title { font-size: 20px; font-weight: 800; margin-bottom: 20px; }
                .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                .input-group label { display: block; font-size: 13px; font-weight: 700; color: #4e5968; margin-bottom: 8px; }
                input, select { width: 100%; height: 50px; border: 1px solid #e5e8eb; border-radius: 12px; padding: 0 16px; font-size: 15px; }

                .image-upload-section { background: #f9fafb; padding: 24px; border-radius: 20px; border: 1px solid #e5e8eb; }
                .product-images-grid { display: flex; flex-wrap: wrap; gap: 15px; margin-top: 10px; }
                .draggable-image-card { position: relative; width: 120px; height: 120px; border-radius: 12px; overflow: hidden; border: 2px solid #e5e8eb; background: #fff; cursor: grab; transition: transform 0.2s, box-shadow 0.2s; }
                .draggable-image-card:active { cursor: grabbing; transform: scale(1.05); box-shadow: 0 8px 16px rgba(0,0,0,0.15); }
                .draggable-image-card img { width: 100%; height: 100%; object-fit: cover; }
                .draggable-image-card .main-badge { position: absolute; top: 6px; left: 6px; background: #3182f6; color: #fff; font-size: 10px; font-weight: 800; padding: 3px 6px; border-radius: 6px; }
                .draggable-image-card .order-number { position: absolute; bottom: 6px; left: 6px; background: rgba(0, 0, 0, 0.6); color: #fff; font-size: 10px; font-weight: 700; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
                .draggable-image-card .btn-delete-img { position: absolute; top: 6px; right: 6px; background: rgba(240, 68, 82, 0.9); color: #fff; border: none; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 10px; }
                .image-uploader-card-mini { width: 120px; height: 120px; border-radius: 12px; border: 2px dashed #d1d6db; background: #f9fafb; overflow: hidden; }

                .notice-section { background: #f9fafb; padding: 24px; border-radius: 20px; border: 1px solid #e5e8eb; }
                .notice-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
                .notice-item label { display: block; font-size: 12px; font-weight: 700; color: #6b7684; margin-bottom: 4px; }
                .notice-item input { height: 40px; font-size: 14px; background: #fff; }

                .btn-finish { width: 100%; height: 60px; background: #3182f6; color: white; border: none; border-radius: 18px; font-size: 18px; font-weight: 700; cursor: pointer; margin-top: 20px; }
            `}</style>
        </div>
    );
}
