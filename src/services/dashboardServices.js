// Lokasi: /services/api/dashboardApi.js

import apiClient from '@/lib/api/apiClient'; // Pastikan path ini benar

/**
 * Frontend Service: Mengambil data ringkasan untuk kartu di dashboard.
 * @returns {Promise<object>} Objek respons dari API.
 */
export async function getSummary() {
  return apiClient.get('/dashboard/summary');
}

/**
 * Frontend Service: Mengambil daftar item dengan stok di bawah ambang batas.
 * @returns {Promise<object>} Objek respons dari API.
 */
export async function getLowStock() {
  return apiClient.get('/dashboard/low-stock');
}

/**
 * Frontend Service: Mengambil riwayat transaksi (log) terbaru.
 * @returns {Promise<object>} Objek respons dari API.
 */
export async function getRecentLogs() {
  return apiClient.get('/dashboard/recent-logs');
}
