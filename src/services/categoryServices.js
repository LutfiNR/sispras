// Lokasi: /services/api/categoryApi.js

import apiClient from '@/lib/api/apiClient'; // Pastikan path ini benar

// ===================================================================================
//  OPERASI PADA KOLEKSI (Banyak Kategori)
// ===================================================================================

/**
 * Frontend Service: Mengambil daftar kategori dengan paginasi, filter, dan sorting.
 * @param {object} params - Opsi untuk query.
 * @returns {Promise<object>} - Objek respons dari API.
 */
export async function getPaginatedCategories({ page = 1, limit = 10, sortBy = 'name', order = 'asc', filters = {} }) {
  // Membersihkan filter dari nilai yang kosong atau null
  const cleanedFilters = {};
  for (const key in filters) {
    if (filters[key] != null && filters[key] !== '') {
      cleanedFilters[key] = filters[key];
    }
  }

  const params = {
    page,
    limit,
    sortBy,
    order,
    ...cleanedFilters,
  };

  // apiClient akan menangani konversi params menjadi query string
  return apiClient.get('/categories', { params });
}

/**
 * Mengambil SEMUA kategori tanpa paginasi untuk dropdown.
 * @returns {Promise<object>} - Objek respons dari API.
 */
export async function getAllCategoriesForDropdown() {
  return apiClient.get('/categories?all=true');
}

/**
 * Mengirim data untuk membuat kategori baru.
 * @param {object} categoryData - Data kategori yang akan dibuat.
 * @returns {Promise<object>} - Objek respons dari API.
 */
export async function createCategory(categoryData) {
  return apiClient.post('/categories', categoryData);
}


// ===================================================================================
//  OPERASI PADA DOKUMEN TUNGGAL (Berdasarkan ID)
// ===================================================================================

/**
 * Mengambil satu data kategori spesifik berdasarkan ID-nya.
 * @param {string} id - ID kategori.
 * @returns {Promise<object>} - Objek respons dari API.
 */
export async function getCategoryById(id) {
  return apiClient.get(`/categories/${id}`);
}

/**
 * Mengirim data untuk memperbarui kategori yang ada.
 * @param {string} id - ID kategori yang akan diperbarui.
 * @param {object} categoryData - Data baru untuk kategori.
 * @returns {Promise<object>} - Objek respons dari API.
 */
export async function updateCategoryById(id, categoryData) {
  return apiClient.put(`/categories/${id}`, categoryData);
}

/**
 * Menghapus satu kategori berdasarkan ID-nya.
 * @param {string} id - ID kategori yang akan dihapus.
 * @returns {Promise<object>} - Objek respons dari API.
 */
export async function deleteCategoryById(id) {
  return apiClient.delete(`/categories/${id}`);
}
