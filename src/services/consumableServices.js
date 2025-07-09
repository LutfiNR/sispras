// Lokasi: /services/api/consumableApi.js

import apiClient from '@/lib/api/apiClient'; // Pastikan path ini benar

// ===================================================================================
//  OPERASI PADA KATALOG PRODUK HABIS PAKAI (ConsumableProduct)
// ===================================================================================

/**
 * Mengambil daftar produk habis pakai dengan paginasi, filter, dan sorting.
 * @param {object} params - Opsi untuk query.
 * @returns {Promise<object>} - Objek respons dari API.
 */
export async function getPaginatedConsumableProducts({ page = 1, limit = 10, sortBy = 'name', order = 'asc', filters = {} }) {
  const cleanedFilters = {};
  for (const key in filters) {
    if (filters[key] != null && filters[key] !== '') {
      cleanedFilters[key] = filters[key];
    }
  }

  const params = { page, limit, sortBy, order, ...cleanedFilters };
  return apiClient.get('/consumable-products', { params });
}

/**
 * Mengambil SEMUA produk habis pakai tanpa paginasi untuk dropdown.
 * @returns {Promise<object>} - Objek respons dari API.
 */
export async function getAllConsumableProductsForDropdown() {
  return apiClient.get('/consumable-products?all=true');
}

/**
 * Mengirim data untuk membuat produk habis pakai baru.
 * @param {object} productData - Data produk yang akan dibuat.
 * @returns {Promise<object>} - Objek respons dari API.
 */
export async function createConsumableProduct(productData) {
  return apiClient.post('/consumable-products', productData);
}

/**
 * Mengambil satu data produk habis pakai spesifik berdasarkan ID-nya.
 * @param {string} id - ID produk.
 * @returns {Promise<object>} - Objek respons dari API.
 */
export async function getConsumableProductById(id) {
  return apiClient.get(`/consumable-products/${id}`);
}

/**
 * Mengirim data untuk memperbarui produk habis pakai yang ada.
 * @param {string} id - ID produk yang akan diperbarui.
 * @param {object} productData - Data baru untuk produk.
 * @returns {Promise<object>} - Objek respons dari API.
 */
export async function updateConsumableProductById(id, productData) {
  return apiClient.put(`/consumable-products/${id}`, productData);
}

/**
 * Menghapus satu produk habis pakai berdasarkan ID-nya.
 * @param {string} id - ID produk yang akan dihapus.
 * @returns {Promise<object>} - Objek respons dari API.
 */
export async function deleteConsumableProductById(id) {
  return apiClient.delete(`/consumable-products/${id}`);
}


// ===================================================================================
//  OPERASI PADA STOK & LOG
// ===================================================================================

/**
 * Mengambil daftar stok barang habis pakai dengan paginasi dan filter.
 * @param {object} params - Opsi untuk query.
 * @returns {Promise<object>} - Objek respons dari API.
 */
export async function getPaginatedConsumableStock({ page = 1, limit = 10, sortBy = 'product.name', order = 'asc', filters = {} }) {
  const cleanedFilters = {};
  for (const key in filters) {
    if (filters[key] != null && filters[key] !== '') {
      cleanedFilters[key] = filters[key];
    }
  }
  
  const params = { page, limit, sortBy, order, ...cleanedFilters };
  return apiClient.get('/consumable-stock', { params }); // Sesuaikan dengan nama endpoint Anda
}

/**
 * Mengambil satu data item stok spesifik berdasarkan ID-nya.
 * @param {string} id - ID item stok.
 * @returns {Promise<object>} - Objek respons dari API.
 */
export async function getConsumableStockById(id) {
  return apiClient.get(`/consumable-stock/${id}`);
}

/**
 * Mengambil riwayat transaksi (log) dengan paginasi dan filter.
 * @param {object} params - Opsi untuk query.
 * @returns {Promise<object>} - Objek respons dari API.
 */
export async function getPaginatedConsumableLogs({ page = 1, limit = 10, sortBy = 'createdAt', order = 'desc', filters = {} }) {
  const cleanedFilters = {};
  for (const key in filters) {
    if (filters[key] != null && filters[key] !== '') {
      cleanedFilters[key] = filters[key];
    }
  }

  const params = { page, limit, sortBy, order, ...cleanedFilters };
  return apiClient.get('/consumable-log', { params }); // Sesuaikan dengan nama endpoint Anda
}

/**
 * Mengirim data untuk mencatat penambahan stok (restock).
 * @param {object} restockData - Data untuk penambahan stok.
 * @returns {Promise<object>} - Objek respons dari API.
 */
export async function recordRestock(restockData) {
  return apiClient.post('/consumable-stock/restock', restockData); // Sesuaikan dengan nama endpoint Anda
}

/**
 * Mengirim data untuk mencatat pengambilan/pemakaian stok.
 * @param {object} usageData - Data untuk pengambilan stok.
 * @returns {Promise<object>} - Objek respons dari API.
 */
export async function recordUsage(usageData) {
  return apiClient.post('/consumable-stock/usage', usageData); // Sesuaikan dengan nama endpoint Anda
}
