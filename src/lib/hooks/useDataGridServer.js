// Lokasi: /lib/hooks/useDataGridServer.js

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';

// Fungsi konversi bisa kita taruh di sini atau di file utilitas terpisah
const convertFilterModelToApiParams = (filterModel) => {
  const params = {};
  if (filterModel.items) {
    filterModel.items.forEach(item => {
      if (item.value) params[item.field] = item.value;
    });
  }
  if (filterModel.quickFilterValues?.length > 0) {
    params.q = filterModel.quickFilterValues.join(' ');
  }
  return params;
};

const defaultRowProcessor = (item) => ({ ...item, id: item._id });

/**
 * Custom Hook untuk MUI DataGrid server-side.
 * @param {Function} fetchFunction - Fungsi service untuk mengambil data.
 * @param {Function} [rowProcessor=defaultRowProcessor] - (Opsional) Fungsi untuk memproses setiap baris data.
 */
export function useDataGridServer(fetchFunction, rowProcessor = defaultRowProcessor, initialFilters={}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rowCount, setRowCount] = useState(0);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [filterModel, setFilterModel] = useState({ items: [] });

  const fetchData = useCallback(async () => {
    setLoading(true);
    if(!initialFilters.productId){
      const apiFilters = convertFilterModelToApiParams(filterModel);
      try {
        const response = await fetchFunction({
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize,
          filters: apiFilters,
        });
  
        // --- PERBAIKAN KUNCI DI SINI ---
        // Gunakan fungsi rowProcessor untuk memformat data
        const formattedRows = response.data.map(rowProcessor);
        
        setRows(formattedRows);
        setRowCount(response.pagination.totalItems || 0);
      } catch (error) {
        toast.error(error.message || "Gagal memuat data.");
      } finally {
        setLoading(false);
      }
    }else{
      try {
        const response = await fetchFunction({
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize,
          filters: initialFilters,
        });
  
        // --- PERBAIKAN KUNCI DI SINI ---
        // Gunakan fungsi rowProcessor untuk memformat data
        const formattedRows = response.data.map(rowProcessor);
        
        setRows(formattedRows);
        setRowCount(response.pagination.totalItems || 0);
      } catch (error) {
        toast.error(error.message || "Gagal memuat data.");
      } finally {
        setLoading(false);
      }
    }
  }, [paginationModel, filterModel, fetchFunction, rowProcessor]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    rows,
    loading,
    rowCount,
    paginationModel,
    filterModel,
    setPaginationModel,
    setFilterModel,
    refreshData: fetchData,
  };
}