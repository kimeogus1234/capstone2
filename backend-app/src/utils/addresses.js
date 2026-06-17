/** 배송지 JSON 정규화 — id 누락 시 앱 FlatList 크래시 방지 */
function normalizeAddresses(raw) {
    let list = raw;
    if (typeof list === 'string') {
        try {
            list = JSON.parse(list);
        } catch {
            list = [];
        }
    }
    if (!Array.isArray(list)) return [];

    return list.map((addr, index) => ({
        id: addr?.id != null ? String(addr.id) : `addr_${index}`,
        name: String(addr?.name || ''),
        phone: String(addr?.phone || ''),
        base: String(addr?.base || addr?.address || ''),
        detail: String(addr?.detail || ''),
        isDefault: !!addr?.isDefault,
    }));
}

module.exports = { normalizeAddresses };
