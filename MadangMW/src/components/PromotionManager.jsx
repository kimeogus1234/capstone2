import React, { useState, useEffect } from 'react';
import * as api from '../api';

export default function PromotionManager({ token }) {
    const [activeTab, setActiveTab] = useState('coupons'); // 'coupons' | 'rules'
    const [couponFilter, setCouponFilter] = useState('ALL'); // 'ALL' (금액별/Nudge) | 'STORE' (매장별) | 'CATEGORY' (카테고리별)
    const [coupons, setCoupons] = useState([]);
    const [rules, setRules] = useState([]);
    const [stores, setStores] = useState([]);
    const [categories, setCategories] = useState([]);
    
    const [showAddForm, setShowAddForm] = useState(false);
    const [showRuleForm, setShowRuleForm] = useState(false);
    const [editingRuleId, setEditingRuleId] = useState(null);
    const [editingCouponId, setEditingCouponId] = useState(null);

    // 쿠폰 폼 데이터
    const [couponFormData, setCouponFormData] = useState({
        name: '', code: '', discount_type: 'AMOUNT', discount_value: '', 
        min_order_amount: 0, valid_from: '', valid_until: '',
        is_public: false,
        scope: 'ALL', // ALL | STORE | CATEGORY
        applicable_ids: []
    });

    // 프로모션 룰 폼 데이터
    const [ruleFormData, setRuleFormData] = useState({
        title: '', description: '',
        condition: { type: 'TOTAL_AMOUNT', target_id: '', min_amount: 0 },
        reward: { coupon_id: '', message: '' }
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [couponData, ruleData, storeData, categoryData] = await Promise.all([
                api.getAllCoupons(),
                api.getAllPromotionRules(),
                api.getStores(),
                api.getCategoryTree()
            ]);
            setCoupons(couponData);
            setRules(ruleData);
            setStores(storeData.stores || storeData || []);
            setCategories(categoryData);
        } catch (e) { console.error(e); }
    };

    const handleCouponSubmit = async (e) => {
        e.preventDefault();
        try {
            // 제출 시 scope 및 applicable_ids 보정
            const payload = { ...couponFormData };
            if (couponFilter === 'ALL') {
                payload.scope = 'ALL';
                payload.applicable_ids = [];
            } else {
                payload.scope = couponFilter;
                payload.min_order_amount = 0; // 매장/카테고리 쿠폰은 조건 없이 상품 매칭 적용
            }

            if (editingCouponId) {
                await api.updateCoupon(editingCouponId, payload);
                alert('쿠폰 정보가 수정되었습니다.');
            } else {
                await api.createCoupon(payload);
                alert('쿠폰이 발행되었습니다.');
            }
            setShowAddForm(false);
            setEditingCouponId(null);
            loadData();
        } catch (e) { alert('작업 실패'); }
    };

    const handleEditCoupon = (coupon) => {
        const cScope = coupon.scope || 'ALL';
        setCouponFilter(cScope);
        setCouponFormData({
            name: coupon.name,
            code: coupon.code,
            discount_type: coupon.discount_type,
            discount_value: coupon.discount_value,
            min_order_amount: coupon.min_order_amount || 0,
            valid_from: new Date(coupon.valid_from).toISOString().split('T')[0],
            valid_until: new Date(coupon.valid_until).toISOString().split('T')[0],
            is_public: coupon.is_public || false,
            scope: cScope,
            applicable_ids: coupon.applicable_ids || []
        });
        setEditingCouponId(coupon._id);
        setShowAddForm(true);
    };

    const handleDeleteCoupon = async (id) => {
        if (!window.confirm('이 쿠폰을 정말 삭제하시겠습니까?')) return;
        try {
            await api.deleteCoupon(id);
            alert('쿠폰이 삭제되었습니다.');
            loadData();
        } catch (e) { alert('삭제 실패'); }
    };

    const handleRuleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingRuleId) {
                await api.updatePromotionRule(editingRuleId, ruleFormData);
                alert('프로모션 규칙이 수정되었습니다.');
            } else {
                await api.createPromotionRule(ruleFormData);
                alert('프로모션 규칙이 등록되었습니다.');
            }
            setShowRuleForm(false);
            setEditingRuleId(null);
            loadData();
        } catch (e) { alert('작업 실패'); }
    };

    const handleEditRule = (rule) => {
        setRuleFormData({
            title: rule.title,
            description: rule.description || '',
            condition: { 
                type: rule.condition.type, 
                target_id: rule.condition.target_id || '', 
                min_amount: rule.condition.min_amount 
            },
            reward: { 
                coupon_id: rule.reward.coupon_id?._id || '', 
                message: rule.reward.message 
            }
        });
        setEditingRuleId(rule._id);
        setShowRuleForm(true);
    };

    const handleDeleteRule = async (id) => {
        if (!window.confirm('이 규칙을 삭제하시겠습니까?')) return;
        try {
            await api.deletePromotionRule(id);
            loadData();
        } catch (e) { alert('삭제 실패'); }
    };

    const flattenCategories = (nodes, parentName = '') => {
        let flatList = [];
        nodes.forEach(node => {
            const displayName = parentName ? `${parentName} > ${node.name}` : node.name;
            flatList.push({ ...node, displayName });
            if (node.children && node.children.length > 0) {
                flatList = [...flatList, ...flattenCategories(node.children, displayName)];
            }
        });
        return flatList;
    };

    const flatCategories = flattenCategories(categories);

    const filteredCoupons = coupons.filter(c => {
        if (couponFilter === 'ALL') return c.scope === 'ALL' || !c.scope;
        return c.scope === couponFilter;
    });

    const getTargetName = (scope, ids) => {
        if (!ids || ids.length === 0) return '전체';
        const targetId = ids[0];
        if (scope === 'STORE') {
            const st = stores.find(s => s._id === targetId);
            return st ? st.name : '알 수 없는 매장';
        }
        if (scope === 'CATEGORY') {
            const cat = flatCategories.find(c => c._id === targetId);
            return cat ? cat.displayName : '알 수 없는 카테고리';
        }
        return '전체';
    };

    return (
        <div className="promotion-manager manager-container">
            <header className="pm-header">
                <div className="header-left">
                    <h2 className="title">🎁 쿠폰 관리</h2>
                </div>
                <button onClick={() => { 
                    setEditingCouponId(null);
                    setCouponFormData({ 
                        name: '', 
                        code: '', 
                        discount_type: 'AMOUNT', 
                        discount_value: '', 
                        min_order_amount: couponFilter === 'ALL' ? 30000 : 0, 
                        valid_from: new Date().toISOString().split('T')[0], 
                        valid_until: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0], 
                        is_public: true, // 기본적으로 전체 공개로 설정하여 바로 연동되도록 유도
                        scope: couponFilter, 
                        applicable_ids: [] 
                    });
                    setShowAddForm(true); 
                }} className="btn-primary">+ 새 {couponFilter === 'ALL' ? '금액별' : (couponFilter === 'STORE' ? '매장별' : '카테고리별')} 쿠폰 발행</button>
            </header>

            {/* --- 쿠폰 발행 모달 --- */}
            {showAddForm && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>
                            {editingCouponId ? '쿠폰 정보 수정' : '신규 쿠폰 발행'} 
                            <span style={{ fontSize: 13, color: '#3182f6', marginLeft: 8 }}>
                                [{couponFilter === 'ALL' ? '금액별 퀘스트용' : (couponFilter === 'STORE' ? '매장별' : '카테고리별')}]
                            </span>
                        </h3>
                        <form onSubmit={handleCouponSubmit} className="pm-form">
                            <div className="form-group">
                                <label>쿠폰명</label>
                                <input required placeholder="예: [매장혜택] 스타벅스 3천원 할인" value={couponFormData.name} onChange={e => setCouponFormData({...couponFormData, name: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>쿠폰 코드</label>
                                <input required placeholder="예: COFFEE3000" value={couponFormData.code} onChange={e => setCouponFormData({...couponFormData, code: e.target.value.toUpperCase()})} />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>공개 여부</label>
                                    <select value={couponFormData.is_public} onChange={e => setCouponFormData({...couponFormData, is_public: e.target.value === 'true'})}>
                                        <option value="false">비공개 (퀘스트 보상 / 지급용)</option>
                                        <option value="true">전체 공개 (일반 쿠폰북 등록)</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>할인 방식</label>
                                    <select value={couponFormData.discount_type} onChange={e => setCouponFormData({...couponFormData, discount_type: e.target.value})}>
                                        <option value="AMOUNT">정액 (원)</option>
                                        <option value="PERCENT">정률 (%)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>할인 값 ({couponFormData.discount_type === 'AMOUNT' ? '원' : '%'})</label>
                                    <input required type="number" value={couponFormData.discount_value} onChange={e => setCouponFormData({...couponFormData, discount_value: e.target.value})} />
                                </div>
                                {couponFilter === 'ALL' ? (
                                    <div className="form-group">
                                        <label>최소 적용금액 (원)</label>
                                        <input type="number" value={couponFormData.min_order_amount} onChange={e => setCouponFormData({...couponFormData, min_order_amount: e.target.value})} />
                                    </div>
                                ) : (
                                    <div className="form-group">
                                        <label>{couponFilter === 'STORE' ? '대상 매장 선택' : '대상 카테고리 선택'}</label>
                                        <select required value={couponFormData.applicable_ids[0] || ''} onChange={e => setCouponFormData({...couponFormData, applicable_ids: [e.target.value]})}>
                                            <option value="">선택해주세요</option>
                                            {couponFilter === 'STORE' ? (
                                                stores.map(s => <option key={s._id} value={s._id}>{s.name}</option>)
                                            ) : (
                                                flatCategories.map(c => <option key={c._id} value={c._id}>{c.displayName}</option>)
                                            )}
                                        </select>
                                    </div>
                                )}
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>시작일</label>
                                    <input required type="date" value={couponFormData.valid_from} onChange={e => setCouponFormData({...couponFormData, valid_from: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label>만료일</label>
                                    <input required type="date" value={couponFormData.valid_until} onChange={e => setCouponFormData({...couponFormData, valid_until: e.target.value})} />
                                </div>
                            </div>
                            <div className="form-actions">
                                <button type="button" onClick={() => { setShowAddForm(false); setEditingCouponId(null); }} className="btn-cancel">취소</button>
                                <button type="submit" className="btn-submit">{editingCouponId ? '수정완료' : '발행하기'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

                                    {/* --- 콘텐츠 영역 --- */}
            <div>
                {/* 세가지 쿠폰 종류 분류 필터 버튼 */}
                <div className="coupon-filter-bar">
                    <button className={`filter-btn ${couponFilter === 'ALL' ? 'active' : ''}`} onClick={() => setCouponFilter('ALL')}>💰 금액별 자동 증정 쿠폰 (Nudge)</button>
                    <button className={`filter-btn ${couponFilter === 'STORE' ? 'active' : ''}`} onClick={() => setCouponFilter('STORE')}>🏪 매장별 쿠폰</button>
                    <button className={`filter-btn ${couponFilter === 'CATEGORY' ? 'active' : ''}`} onClick={() => setCouponFilter('CATEGORY')}>🍔 카테고리별 쿠폰</button>
                </div>

                {filteredCoupons.length === 0 && <div className="empty-state">해당 종류의 쿠폰이 존재하지 않습니다.</div>}
                <div className="coupon-grid">
                    {filteredCoupons.map(coupon => (
                        <div key={coupon._id} className={`coupon-card ${!coupon.is_active ? 'inactive' : ''}`}>
                            <div className="coupon-main">
                                <div className="visibility-tag">
                                    {coupon.scope === 'STORE' ? '🏪 매장 쿠폰' : (coupon.scope === 'CATEGORY' ? '🍔 카테고리 쿠폰' : '💰 금액별 쿠폰')}
                                </div>
                                <div className="discount-info">
                                    <span className="val">{Number(coupon.discount_value).toLocaleString()}{coupon.discount_type === 'AMOUNT' ? '원' : '%'}</span>
                                    <span className="label">OFF</span>
                                </div>
                                <div className="coupon-details">
                                    <h4 className="name">{coupon.name}</h4>
                                    <p className="code">CODE: <strong>{coupon.code}</strong></p>
                                    <p className="condition">
                                        {coupon.scope === 'ALL' 
                                            ? `최소 ${Number(coupon.min_order_amount).toLocaleString()}원 이상 구매 시`
                                            : `적용 대상: ${getTargetName(coupon.scope, coupon.applicable_ids)}`
                                        }
                                    </p>
                                </div>
                            </div>
                            <div className="coupon-footer">
                                <span>📅 {new Date(coupon.valid_from).toLocaleDateString()} ~ {new Date(coupon.valid_until).toLocaleDateString()}</span>
                                <div className="footer-right">
                                    <button onClick={() => handleEditCoupon(coupon)} className="btn-edit-link">수정</button>
                                    <button onClick={() => handleDeleteCoupon(coupon._id)} className="btn-delete-link" style={{ color: '#ff3b30' }}>삭제</button>
                                    <span className={`status ${new Date() > new Date(coupon.valid_until) ? 'expired' : 'active'}`}>
                                        {new Date() > new Date(coupon.valid_until) ? '만료됨' : (coupon.is_active ? '사용 가능' : '중지됨')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
                .promotion-manager { padding: 20px; }
                .pm-header { display: flex; justify-content: space-between; align-items: flex-end; marginBottom: 30px; border-bottom: 2px solid #f2f4f6; padding-bottom: 20px; margin-bottom: 30px; }
                .header-left { display: flex; flex-direction: column; gap: 15px; }
                .title { font-size: 28px; font-weight: 900; color: #191f28; margin: 0; }

                .coupon-filter-bar { display: flex; gap: 10px; margin-bottom: 25px; border-bottom: 1px solid #e5e8eb; padding-bottom: 12px; }
                .filter-btn { padding: 12px 20px; border: 1px solid #e5e8eb; background: #fff; font-size: 14px; font-weight: 700; color: #4e5968; cursor: pointer; border-radius: 12px; transition: 0.2s; }
                .filter-btn:hover { background: #f9fafb; border-color: #3182f6; }
                .filter-btn.active { color: #fff; background: #3182f6; border-color: #3182f6; box-shadow: 0 4px 10px rgba(49, 130, 246, 0.2); }

                .btn-primary { background: #3182f6; color: #fff; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 800; cursor: pointer; transition: 0.2s; }
                .btn-primary:hover { background: #1c62cc; transform: scale(1.02); }; flex-direction: column; gap: 15px; }
                .title { font-size: 28px; font-weight: 900; color: #191f28; margin: 0; }
                
                .tab-group { display: flex; gap: 10px; }
                .tab-btn { padding: 10px 20px; border: none; background: none; font-size: 16px; font-weight: 700; color: #8b95a1; cursor: pointer; border-radius: 8px; transition: 0.2s; }
                .tab-btn:hover { background: #f2f4f6; }
                .tab-btn.active { color: #3182f6; background: #e8f3ff; }

                .coupon-filter-bar { display: flex; gap: 10px; margin-bottom: 25px; border-bottom: 1px solid #e5e8eb; padding-bottom: 12px; }
                .filter-btn { padding: 12px 20px; border: 1px solid #e5e8eb; background: #fff; font-size: 14px; font-weight: 700; color: #4e5968; cursor: pointer; border-radius: 12px; transition: 0.2s; }
                .filter-btn:hover { background: #f9fafb; border-color: #3182f6; }
                .filter-btn.active { color: #fff; background: #3182f6; border-color: #3182f6; box-shadow: 0 4px 10px rgba(49, 130, 246, 0.2); }

                .btn-primary { background: #3182f6; color: #fff; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 800; cursor: pointer; transition: 0.2s; }
                .btn-primary:hover { background: #1c62cc; transform: scale(1.02); }

                /* 쿠폰 그리드 및 카드 */
                .coupon-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 20px; }
                .coupon-card { background: #fff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e8eb; transition: 0.2s; }
                .coupon-card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
                .coupon-main { display: flex; padding: 25px; background: linear-gradient(135deg, #3182f6 0%, #1c62cc 100%); color: #fff; position: relative; }
                .coupon-main::after { content: ''; position: absolute; right: -15px; top: 50%; transform: translateY(-50%); width: 30px; height: 30px; background: #f9fafb; border-radius: 50%; }
                .discount-info { display: flex; flex-direction: column; align-items: center; justify-content: center; border-right: 1px dashed rgba(255,255,255,0.3); padding-right: 20px; margin-right: 20px; min-width: 80px; }
                .discount-info .val { font-size: 28px; font-weight: 900; }
                .visibility-tag { position: absolute; top: 15px; right: 20px; font-size: 10px; font-weight: 900; background: rgba(0,0,0,0.2); padding: 4px 8px; border-radius: 6px; color: #fff; z-index: 1; }
                .coupon-details .name { font-size: 18px; margin-bottom: 8px; font-weight: 800; }
                .coupon-footer { padding: 15px 25px; background: #fff; display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #8b95a1; font-weight: 600; }
                .footer-right { display: flex; align-items: center; gap: 12px; }
                .btn-edit-link, .btn-delete-link { background: none; border: none; color: #3182f6; cursor: pointer; font-size: 12px; font-weight: 800; padding: 0; text-decoration: underline; }
                .btn-edit-link:hover { color: #1c62cc; }
                .btn-delete-link:hover { opacity: 0.8; }

                /* 프로모션 규칙 리스트 */
                .rules-list { display: flex; flex-direction: column; gap: 20px; }
                .rule-card { background: #fff; border-radius: 20px; padding: 25px; border: 1px solid #e5e8eb; transition: 0.2s; }
                .rule-card:hover { border-color: #3182f6; box-shadow: 0 8px 16px rgba(49, 130, 246, 0.08); }
                .rule-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                .rule-title { font-size: 18px; font-weight: 800; color: #333d4b; margin: 0; }
                .rule-actions { display: flex; gap: 8px; }
                .btn-delete-small { background: #fff; color: #f04452; border: 1px solid #f04452; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 700; transition: 0.2s; }
                .btn-delete-small:hover { background: #f04452; color: #fff; }
                .btn-edit-small { background: #fff; color: #3182f6; border: 1px solid #3182f6; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 700; transition: 0.2s; }
                .btn-edit-small:hover { background: #3182f6; color: #fff; }

                .rule-path { display: flex; align-items: center; gap: 15px; margin-bottom: 20px; }
                .path-box { flex: 1; padding: 15px; border-radius: 12px; position: relative; }
                .path-box.if { background: #f9fafb; border: 1px solid #e5e8eb; }
                .path-box.then { background: #e8f3ff; border: 1px solid #3182f6; }
                .path-box .tag { font-size: 10px; font-weight: 900; padding: 2px 6px; border-radius: 4px; margin-bottom: 5px; display: inline-block; }
                .if .tag { background: #4e5968; color: #fff; }
                .then .tag { background: #3182f6; color: #fff; }
                .path-box p { margin: 0; font-size: 14px; color: #333d4b; }
                .path-arrow { font-size: 24px; color: #adb5bd; }

                .nudge-preview { display: flex; align-items: center; gap: 15px; padding-top: 15px; border-top: 1px solid #f2f4f6; }
                .nudge-preview .label { font-size: 13px; font-weight: 700; color: #8b95a1; }
                .nudge-bubble { background: #f2f4f6; padding: 10px 15px; border-radius: 12px 12px 12px 0; font-size: 14px; color: #191f28; font-weight: 600; }

                /* 모달 공통 */
                .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
                .modal-content { background: #fff; padding: 40px; border-radius: 24px; width: 500px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 40px rgba(0,0,0,0.2); }
                .rule-modal { width: 600px; }
                .subtitle { color: #8b95a1; margin-bottom: 30px; font-weight: 500; }
                .pm-form { display: flex; flex-direction: column; gap: 20px; }
                .rule-section { background: #f9fafb; padding: 20px; border-radius: 16px; border: 1px solid #e5e8eb; }
                .section-title { font-size: 14px; color: #3182f6; font-weight: 900; margin-top: 0; margin-bottom: 15px; }
                .form-group { display: flex; flex-direction: column; gap: 8px; }
                .form-group label { font-size: 13px; font-weight: 700; color: #4e5968; }
                .form-group input, .form-group select { padding: 12px; border-radius: 10px; border: 1px solid #e5e8eb; font-size: 15px; }
                .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
                .form-actions { display: grid; grid-template-columns: 1fr 2fr; gap: 10px; margin-top: 20px; }
                .btn-submit { padding: 15px; background: #3182f6; color: #fff; border: none; border-radius: 12px; font-weight: 800; cursor: pointer; }
                .btn-cancel { padding: 15px; background: #f2f4f6; color: #4e5968; border: none; border-radius: 12px; font-weight: 800; cursor: pointer; }
                .empty-state { padding: 100px; text-align: center; color: #8b95a1; font-weight: 600; }
            `}</style>
        </div>
    );
}
