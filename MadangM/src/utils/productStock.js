/**
 * 상품/옵션 품절 여부 (장바구니·상세 공통)
 */
export const isProductOutOfStock = (product, variantSku = null) => {
  if (!product) return false;

  if (product.status === 'OUT_OF_STOCK' || product.status === 'STOPPED') {
    return true;
  }

  const variants = product.variants || [];

  if (variants.length === 0) {
    return product.status !== 'ON_SALE';
  }

  if (variantSku) {
    const variant = variants.find((v) => v.sku === variantSku);
    return !variant || (variant.stock_quantity || 0) <= 0;
  }

  return !variants.some((v) => (v.stock_quantity || 0) > 0);
};

export const getSelectedVariantStock = (product, selectedVariant) => {
  if (!product) return 0;
  const variants = product.variants || [];
  if (variants.length === 0) {
    return product.status === 'ON_SALE' ? 1 : 0;
  }
  return selectedVariant?.stock_quantity || 0;
};
