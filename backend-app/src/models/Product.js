const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    // 🏷 기본 정보 (쿠팡 상품명 가이드라인 준수)
    name: { type: String, required: true, index: true },
    brand: { type: String },
    status: { 
        type: String, 
        enum: ['ON_SALE', 'OUT_OF_STOCK', 'HIDDEN', 'STOPPED'], 
        default: 'ON_SALE' 
    },
    
    // 🏢 매장 및 카테고리 (스타필드/쿠팡 분류 체계)
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    display_template: { type: String, enum: ['A', 'B'], default: 'A' }, // A: 정찰제, B: 변동제(옵션형)
    
    // 💸 가격 정보
    base_price: { type: Number, default: 0 }, // 대표 가격

    // 🛠 쿠팡식 '상품 상세 고시' (카테고리별 필수 항목)
    product_notices: [{
        label: String,
        value: String
    }],

    // 🎨 쿠팡식 옵션 구성 (색상, 사이즈, 용량 등)
    options: [{
        name: String,
        values: [String]
    }],

    // 📦 개별 아이템 (SKU 단위 관리)
    variants: [{
        sku: String,
        option_values: mongoose.Schema.Types.Mixed, 
        sale_price: { type: Number, required: true }, 
        discount_rate: { type: Number, default: 0 },   
        stock_quantity: { type: Number, default: 0 },
        nfc_uid: { type: String, unique: true, sparse: true },
        nfc_link: String,
        is_main_variant: { type: Boolean, default: false } 
    }],

    // 🖼 쿠팡형 이미지 관리
    images: {
        main: String,           
        gallery: [String],      
        description_detail: String 
    },

    // 🔍 검색 최적화 키워드
    search_keywords: [String],

    // 📄 네이버 스타일 블록 상세 설명
    description_blocks: [{
        type: { type: String, enum: ['TEXT', 'IMAGE', 'VIDEO'] },
        content: String
    }],

    // 🔗 연관 추천 상품 (교차 판매용)
    related_products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],

    // 🚚 배송/반품 정보
    delivery_info: {
        type: { type: String, enum: ['PICKUP', 'DELIVERY', 'BOTH'], default: 'BOTH' },
        fee: { type: Number, default: 0 },
        return_policy: String
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// 프론트엔드 호환용 가상 필드
productSchema.virtual('price').get(function() {
    return this.base_price;
});

productSchema.index({ name: 'text', search_keywords: 'text' });
productSchema.index({ storeId: 1, status: 1 });
productSchema.index({ category: 1 });

productSchema.pre('save', function (next) {
    const baseUrl = 'smartstore://nfc/product';
    this.variants.forEach(variant => {
        if (!variant.nfc_link && variant.sku) {
            variant.nfc_link = `${baseUrl}/${this._id.toString()}?sku=${variant.sku}`;
        }
    });
    next();
});

module.exports = mongoose.model('Product', productSchema);
