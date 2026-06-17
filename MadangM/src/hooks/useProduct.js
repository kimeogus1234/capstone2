import { useState, useEffect } from 'react';
import axios from 'axios';
import { BASE_URL } from '../api/config';

export const useProduct = (nfcId) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProduct = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/products/${nfcId}`);
      setProduct(response.data);
    } catch (error) {
      console.error("데이터 가져오기 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (nfcId) fetchProduct();
  }, [nfcId]);

  return { product, loading, refetch: fetchProduct };
};