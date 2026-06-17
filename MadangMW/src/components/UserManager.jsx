import React, { useState, useEffect, useCallback } from 'react';
import { getUsers, updateUserRole, createUser, deleteUser, getStores, getCategoryTree } from '../api';
import CategoryPickerModal from './CategoryPickerModal';

export default function UserManager({ token }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);
    const [categoryTree, setCategoryTree] = useState([]);
    const [stores, setStores] = useState([]);
    
    // Pagination & Search State
    const [page, setPage] = useState(1);
    const [limit] = useState(15); // 한 페이지당 15명
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // New User Form State
    const [isAdding, setIsAdding] = useState(false);
    const [newUser, setNewUser] = useState({
        username: '', password: '', role: 'STAFF', department: '', managed_categories: [], assignedStoreId: ''
    });

    // Modal State
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [pickerTarget, setPickerTarget] = useState(null);
    const [pickerTree, setPickerTree] = useState([]);
    const [isTreeLoading, setIsTreeLoading] = useState(false);

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        loadUsers();
    }, [page, roleFilter]); // 페이지나 필터 변경 시 자동 로드

    const loadInitialData = async () => {
        try {
            const [storeRes, treeData] = await Promise.all([getStores(), getCategoryTree()]);
            setStores(storeRes.stores || []);
            setCategoryTree(treeData);
        } catch (e) { console.error(e); }
    };

    const loadUsers = async (currentSearch = search) => {
        setLoading(true);
        try {
            const data = await getUsers({
                page,
                limit,
                search: currentSearch,
                role: roleFilter
            });
            setUsers(data.users);
            setTotalCount(data.totalCount);
            setTotalPages(data.totalPages);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    // 검색어 입력 시 딜레이 로직 (Debounce)
    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearch(value);
        setPage(1); // 검색 시 첫 페이지로 이동
    };

    const onSearchSubmit = (e) => {
        e.preventDefault();
        loadUsers(search);
    };

    const openPicker = async (target) => {
        setPickerTarget(target);
        setIsPickerOpen(true);
        setIsTreeLoading(true);
        try {
            const storeId = target === 'NEW' ? newUser.assignedStoreId : target.assignedStoreId;
            const treeData = await getCategoryTree(storeId);
            setPickerTree(treeData);
        } catch (e) {
            setPickerTree(categoryTree);
        } finally {
            setIsTreeLoading(false);
        }
    };

    const getCategoryName = (id) => {
        const findInTree = (tree, targetId) => {
            for (const cat of tree) {
                if (cat._id === targetId) return cat.name;
                if (cat.children) {
                    const found = findInTree(cat.children, targetId);
                    if (found) return found;
                }
            }
            return null;
        };
        return findInTree(categoryTree, id) || '알수없음';
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await createUser(newUser);
            alert('사용자가 생성되었습니다.');
            setNewUser({ username: '', password: '', role: 'STAFF', department: '', managed_categories: [], assignedStoreId: '' });
            setIsAdding(false);
            loadUsers();
        } catch (e) {
            alert('생성 실패: ' + (e.response?.data?.message || '알 수 없는 오류'));
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm('정말 삭제하시겠습니까?')) return;
        try {
            await deleteUser(id);
            loadUsers();
        } catch (e) {
            alert('삭제 실패: ' + (e.response?.data?.message || '권한 부족'));
        }
    };

    const handleUpdateUser = async (userId, updates) => {
        try {
            setUpdatingId(userId);
            const user = users.find(u => u.id === userId);
            const finalData = { ...user, ...updates };
            await updateUserRole(userId, finalData.role, finalData.department, finalData.managed_categories, finalData.assignedStoreId);
            setUsers(users.map(u => u.id === userId ? { ...u, ...updates } : u));
        } catch (e) {
            alert('오류 발생');
        } finally {
            setUpdatingId(null);
        }
    };

    const roles = ['CUSTOMER', 'DELIVERY', 'STAFF', 'ADMIN'];

    return (
        <div className="user-manager-container">
            <header className="page-header">
                <div className="title-group">
                    <h1>👥 사용자 및 직원 관제</h1>
                    <p>수십만 명의 회원 및 입점 직원을 통합 관리하는 엔터프라이즈 센터</p>
                </div>
                <button onClick={() => setIsAdding(!isAdding)} className={`btn-add ${isAdding ? 'cancel' : ''}`}>
                    {isAdding ? '✕ 취소하기' : '+ 신규 사용자 등록'}
                </button>
            </header>

            {isAdding && (
                <div className="add-form-card">
                    <form onSubmit={handleCreateUser}>
                        <div className="form-grid">
                            <div className="input-box">
                                <label>아이디</label>
                                <input value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} placeholder="아이디" required />
                            </div>
                            <div className="input-box">
                                <label>비밀번호</label>
                                <input type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} placeholder="비밀번호" required />
                            </div>
                            <div className="input-box">
                                <label>권한</label>
                                <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                            <div className="input-box">
                                <label>부서/업무</label>
                                <input value={newUser.department} onChange={e => setNewUser({...newUser, department: e.target.value})} placeholder="예: 생선관리" />
                            </div>
                            {newUser.role === 'STAFF' && (
                                <div className="input-box full">
                                    <label>🏠 담당 매장 지정</label>
                                    <select value={newUser.assignedStoreId} onChange={e => setNewUser({...newUser, assignedStoreId: e.target.value})}>
                                        <option value="">매장을 선택하세요</option>
                                        {stores.map(s => <option key={s._id} value={s._id}>{s.name} ({s.floor})</option>)}
                                    </select>
                                </div>
                            )}
                        </div>
                        <button type="submit" className="btn-submit">등록 완료</button>
                    </form>
                </div>
            )}

            <div className="control-bar">
                <div className="filter-tabs">
                    {['ALL', ...roles].map(r => (
                        <button 
                            key={r} 
                            className={roleFilter === r ? 'active' : ''} 
                            onClick={() => { setRoleFilter(r); setPage(1); }}
                        >
                            {r === 'ALL' ? '전체' : r}
                        </button>
                    ))}
                </div>
                <form className="search-box" onSubmit={onSearchSubmit}>
                    <input 
                        placeholder="이름 또는 아이디로 검색..." 
                        value={search} 
                        onChange={handleSearchChange}
                    />
                    <button type="submit">🔍</button>
                </form>
            </div>

            <div className={`table-wrapper ${loading ? 'loading' : ''}`}>
                <table className="enterprise-table">
                    <thead>
                        <tr>
                            <th>사용자 정보</th>
                            <th>역할</th>
                            <th>담당 업무 및 매장</th>
                            <th>관리 권한</th>
                            <th className="text-right">액션</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id} className={updatingId === u.id ? 'updating' : ''}>
                                <td>
                                    <div className="user-info">
                                        <div className="avatar">{u.username.substring(0, 2).toUpperCase()}</div>
                                        <div>
                                            <div className="username">{u.username}</div>
                                            <div className="mileage">💰 {u.mileage?.toLocaleString()}P</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <select 
                                        className={`role-select ${u.role.toLowerCase()}`}
                                        value={u.role}
                                        onChange={(e) => handleUpdateUser(u.id, { role: e.target.value })}
                                    >
                                        {roles.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </td>
                                <td>
                                    <input 
                                        className="dept-input"
                                        value={u.department || ''} 
                                        placeholder="부서 없음"
                                        onBlur={(e) => handleUpdateUser(u.id, { department: e.target.value })}
                                        onChange={(e) => setUsers(users.map(user => user.id === u.id ? { ...user, department: e.target.value } : user))}
                                    />
                                    {u.role === 'STAFF' && (
                                        <select 
                                            className="store-select"
                                            value={u.assignedStoreId || ''}
                                            onChange={(e) => handleUpdateUser(u.id, { assignedStoreId: e.target.value })}
                                        >
                                            <option value="">매장 미지정</option>
                                            {stores.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                        </select>
                                    )}
                                </td>
                                <td>
                                    <div className="category-tags">
                                        {(u.managed_categories || []).map(catId => (
                                            <span key={catId} className="tag">{getCategoryName(catId)}</span>
                                        ))}
                                        <button className="btn-tag-edit" onClick={() => openPicker(u)}>⚙️ 설정</button>
                                    </div>
                                </td>
                                <td className="text-right">
                                    <button className="btn-delete" onClick={() => handleDeleteUser(u.id)}>삭제</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {users.length === 0 && !loading && (
                    <div className="empty-state">검색 결과가 없습니다.</div>
                )}
            </div>

            <footer className="pagination-bar">
                <button disabled={page === 1} onClick={() => setPage(page - 1)}>이전</button>
                <div className="page-info">
                    <span>{page}</span> / {totalPages || 1} (총 {totalCount.toLocaleString()}명)
                </div>
                <button disabled={page === totalPages || totalPages === 0} onClick={() => setPage(page + 1)}>다음</button>
            </footer>

            <CategoryPickerModal 
                isOpen={isPickerOpen}
                onClose={() => { setIsPickerOpen(false); setPickerTarget(null); }}
                initialSelected={pickerTarget === 'NEW' ? newUser.managed_categories : (pickerTarget?.managed_categories || [])}
                categories={pickerTree}
                isLoading={isTreeLoading}
                isStaffMode={(pickerTarget === 'NEW' && newUser.role === 'STAFF') || (pickerTarget !== 'NEW' && pickerTarget?.role === 'STAFF')}
                onSelect={(selected) => {
                    if (pickerTarget === 'NEW') {
                        setNewUser({...newUser, managed_categories: selected});
                    } else if (pickerTarget) {
                        handleUpdateUser(pickerTarget.id, { managed_categories: selected });
                    }
                }}
            />

            <style>{`
                .user-manager-container { max-width: 1200px; margin: 0 auto; padding: 20px; }
                .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
                .title-group h1 { font-size: 32px; font-weight: 900; color: #1a1f27; letter-spacing: -1px; }
                .title-group p { color: #8b95a1; margin-top: 8px; }

                .btn-add { background: #1a1f27; color: #fff; border: none; padding: 12px 24px; border-radius: 14px; font-weight: 700; cursor: pointer; transition: 0.2s; }
                .btn-add.cancel { background: #f2f4f6; color: #4e5968; }
                .btn-add:hover { transform: translateY(-2px); }

                .add-form-card { background: #fff; padding: 30px; border-radius: 24px; border: 1px solid #e5e8eb; margin-bottom: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
                .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
                .input-box.full { grid-column: 1 / -1; }
                .input-box label { display: block; font-size: 13px; font-weight: 700; color: #4e5968; margin-bottom: 8px; }
                .input-box input, .input-box select { width: 100%; padding: 12px; border-radius: 12px; border: 1px solid #e5e8eb; background: #f9fafb; }
                .btn-submit { margin-top: 24px; width: 100%; padding: 16px; border-radius: 14px; border: none; background: #3182f6; color: #fff; font-weight: 700; cursor: pointer; }

                .control-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; gap: 20px; }
                .filter-tabs { display: flex; background: #f2f4f6; padding: 4px; border-radius: 12px; }
                .filter-tabs button { border: none; background: none; padding: 8px 16px; border-radius: 10px; font-size: 14px; font-weight: 600; color: #4e5968; cursor: pointer; }
                .filter-tabs button.active { background: #fff; color: #1a1f27; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }

                .search-box { display: flex; flex: 1; max-width: 400px; background: #fff; border: 1px solid #e5e8eb; border-radius: 12px; padding: 4px 12px; }
                .search-box input { flex: 1; border: none; padding: 8px; outline: none; }
                .search-box button { border: none; background: none; cursor: pointer; }

                .table-wrapper { background: #fff; border-radius: 20px; border: 1px solid #e5e8eb; overflow: hidden; }
                .table-wrapper.loading { opacity: 0.6; pointer-events: none; }
                .enterprise-table { width: 100%; border-collapse: collapse; }
                .enterprise-table th { background: #f9fafb; padding: 16px; text-align: left; font-size: 13px; color: #8b95a1; font-weight: 600; border-bottom: 1px solid #e5e8eb; }
                .enterprise-table td { padding: 16px; border-bottom: 1px solid #f2f4f6; font-size: 14px; vertical-align: middle; }
                
                .user-info { display: flex; align-items: center; gap: 12px; }
                .avatar { width: 40px; height: 40px; background: #e8f3ff; color: #3182f6; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px; }
                .username { font-weight: 700; color: #1a1f27; }
                .mileage { font-size: 12px; color: #8b95a1; margin-top: 2px; }

                .role-select { padding: 4px 8px; border-radius: 8px; border: 1px solid #e5e8eb; font-weight: 700; font-size: 12px; }
                .role-select.admin { background: #fff0f0; color: #f04452; border-color: #ffdbdb; }
                .role-select.staff { background: #e8f3ff; color: #3182f6; border-color: #d0e6ff; }
                .role-select.delivery { background: #fff9e6; color: #ffa114; border-color: #ffeeb2; }

                .dept-input, .store-select { width: 100%; padding: 6px; border: none; border-bottom: 1px solid transparent; outline: none; transition: 0.2s; }
                .dept-input:focus { border-bottom-color: #3182f6; }
                .store-select { margin-top: 4px; font-size: 12px; color: #8b95a1; background: none; }

                .category-tags { display: flex; flex-wrap: wrap; gap: 4px; }
                .tag { background: #f2f4f6; color: #4e5968; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; }
                .btn-tag-edit { background: none; border: 1px dashed #d1d6db; color: #8b95a1; padding: 4px 8px; border-radius: 6px; font-size: 11px; cursor: pointer; }
                
                .btn-delete { background: none; border: none; color: #f04452; font-weight: 700; font-size: 13px; cursor: pointer; opacity: 0.5; }
                .btn-delete:hover { opacity: 1; }

                .pagination-bar { display: flex; justify-content: center; align-items: center; gap: 30px; margin-top: 30px; padding-bottom: 50px; }
                .pagination-bar button { padding: 8px 20px; border-radius: 10px; border: 1px solid #e5e8eb; background: #fff; font-weight: 700; cursor: pointer; }
                .pagination-bar button:disabled { opacity: 0.3; cursor: not-allowed; }
                .page-info { font-weight: 700; color: #4e5968; }
                .page-info span { color: #3182f6; }

                .text-right { text-align: right; }
                .empty-state { padding: 60px; text-align: center; color: #8b95a1; font-weight: 600; }
                tr.updating { opacity: 0.5; }
            `}</style>
        </div>
    );
}
