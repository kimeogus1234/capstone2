/** JWT에서 로그인 사용자 ID 추출 (문자열로 통일) */
function resolveAuthUserId(req) {
    if (!req.user) return null;
    const id = req.user.id ?? req.user.userId ?? req.user.sub;
    if (id === undefined || id === null || id === '') return null;
    return String(id);
}

module.exports = { resolveAuthUserId };
