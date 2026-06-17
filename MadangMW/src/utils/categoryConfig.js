export const getCategoryConfig = (rootCategoryName) => {
    const configs = {
        '일반 패션/스포츠': {
            notices: [
                { label: '제품 소재', value: '' },
                { label: '색상', value: '' },
                { label: '치수', value: '' },
                { label: '제조국', value: '' },
                { label: '세탁방법 및 취급시 주의사항', value: '' }
            ]
        },
        '해외명품/패션': {
            notices: [
                { label: '제품 소재', value: '' },
                { label: '색상', value: '' },
                { label: '치수', value: '' },
                { label: '제조국', value: '' },
                { label: '수입여부', value: '수입' }
            ]
        },
        '패션잡화/슈즈': {
            notices: [
                { label: '종류', value: '' },
                { label: '소재', value: '' },
                { label: '색상', value: '' },
                { label: '크기', value: '' },
                { label: '제조자', value: '' }
            ]
        },
        '디지털/가전/취미': {
            notices: [
                { label: '모델명', value: '' },
                { label: '정격전압/소비전력', value: '' },
                { label: '출시년월', value: '' },
                { label: '제조자/제조국', value: '' },
                { label: '품질보증기준', value: '소비자분쟁해결기준에 따름' }
            ]
        },
        '식음료 (F&B)': {
            notices: [
                { label: '식품의 유형', value: '' },
                { label: '생산자 및 소재지', value: '' },
                { label: '제조연월일/유통기한', value: '' },
                { label: '원재료명 및 함량', value: '' },
                { label: '소비자상담 관련 전화번호', value: '' }
            ]
        },
        '뷰티/헬스/서비스': {
            notices: [
                { label: '용량 또는 중량', value: '' },
                { label: '제품 주요 사양', value: '' },
                { label: '사용기한 또는 개봉 후 사용기간', value: '' },
                { label: '사용할 때 주의사항', value: '' },
                { label: '기능성 화장품 심사 필 유무', value: '' }
            ]
        },
        '리빙/생활/마트': {
            notices: [
                { label: '품명 및 모델명', value: '' },
                { label: '재질', value: '' },
                { label: '구성품', value: '' },
                { label: '크기', value: '' },
                { label: '제조자/제조국', value: '' }
            ]
        },
        '엔터테인먼트/스포츠': {
            notices: [
                { label: '이용권 종류', value: '' },
                { label: '유효기간', value: '' },
                { label: '이용조건', value: '' },
                { label: '취소/환불 기준', value: '' }
            ]
        }
    };

    // 대분류 이름이 정확히 일치하거나 포함되는 경우를 찾음
    const matchedKey = Object.keys(configs).find(key => rootCategoryName.includes(key) || key.includes(rootCategoryName));
    
    return configs[matchedKey] || {
        notices: [
            { label: '기타 정보', value: '상세 페이지 참조' }
        ]
    };
};
