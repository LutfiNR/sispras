// Lokasi: /services/api/assetApi.js

import apiClient from '@/lib/api/apiClient'; // Pastikan path ini benar

/**
 * Frontend Service: Mengambil daftar aset individual dengan paginasi dan filter.
 * @param {object} params - Berisi parameter untuk query.
 * @returns {Promise<object>} - Objek respons dari API.
 */
export async function getPaginatedAssets({ page = 1, limit = 10, sortBy = 'createdAt', order = 'desc', filters = {} }) {
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

  return apiClient.get('/assets', { params });
}

/**
 * Frontend Service: Mengambil data agregat aset dengan paginasi dan filter.
 * @param {object} params - Berisi parameter untuk query.
 * @returns {Promise<object>} - Objek respons dari API.
 */
export async function getAssetAggregateSummary({ page = 1, limit = 10, sortBy = 'productName', order = 'asc', filters = {} }) {
  // Membersihkan filter dari nilai yang kosong atau null
  const cleanedFilters = {};
  for (const key in filters) {
    if (filters[key] != null && filters[key] !== '') {
      cleanedFilters[key] = filters[key];
    }
  }

  // Gabungkan semua parameter
  const params = {
    page,
    limit,
    sortBy,
    order,
    ...cleanedFilters,
  };

  // Panggil endpoint agregat yang baru
  return apiClient.get('/assets/summary', { params });
}

export async function createAssets(assetsData) {
  return apiClient.post('/assets', assetsData);
}

export async function getAssetById(id) {
  return apiClient.get(`/assets/${id}`);
}

export async function updateAssetById(id, assetData) {
  return apiClient.put(`/assets/${id}`, assetData);
}

export async function deleteAsset(id) {
  return apiClient.delete(`/assets/${id}`);
}
