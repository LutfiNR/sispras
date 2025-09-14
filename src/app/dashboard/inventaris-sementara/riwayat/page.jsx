"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

// Komponen MUI
import { Box, Chip, Typography, Button, CircularProgress } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { id } from 'date-fns/locale';
import { Download } from '@mui/icons-material';

// Komponen Kustom & Service
import CustomToolbar from "@/components/dashboard/CustomToolbar";
import { getPaginatedConsumableLogs } from "@/services/consumableServices"; // Menggunakan service API
import { useDataGridServer } from "@/lib/hooks/useDataGridServer";
import theme from "@/theme/theme";

/**
 * Halaman untuk menampilkan riwayat transaksi barang habis pakai.
 */
export default function ConsumableLogPage() {
  const router = useRouter();

  // Gunakan custom hook untuk menangani state DataGrid
  const {
    rows,
    loading,
    rowCount,
    paginationModel,
    setPaginationModel,
    filterModel,
    setFilterModel,
    sortModel,
    setSortModel,
  } = useDataGridServer(getPaginatedConsumableLogs);

  // --- State & Handler untuk Ekspor Riwayat ---
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [isDownloadingLogs, setIsDownloadingLogs] = useState(false);

  const handleDownloadLogs = () => {
    if (!startDate || !endDate) {
      alert("Harap pilih periode tanggal mulai dan selesai.");
      return;
    }
    if (startDate > endDate) {
      alert("Tanggal mulai tidak boleh melebihi tanggal selesai.");
      return;
    }
    
    setIsDownloadingLogs(true);
    
    const baseUrl = '/api/inventory/consumable-log/export';
    const formattedStartDate = startDate.toISOString().split('T')[0];
    const formattedEndDate = endDate.toISOString().split('T')[0];

    // Ambil filter pencarian (q) dari DataGrid jika ada
    const filtersFromGrid = filterModel.items.reduce((acc, item) => {
        if (item.value) { acc.q = item.value; }
        return acc;
    }, {});
    
    const params = {
      startDate: formattedStartDate,
      endDate: formattedEndDate,
      ...filtersFromGrid
    };

    const queryString = new URLSearchParams(params).toString();
    const finalUrl = `${baseUrl}?${queryString}`;
    
    console.log("Opening new tab for log download:", finalUrl);
    window.open(finalUrl, '_blank');

    setTimeout(() => {
      setIsDownloadingLogs(false);
    }, 2000);
  };

  // --- COLUMN DEFINITIONS ---
  const columns = [
    {
      field: "createdAt",
      headerName: "Tanggal",
      width: 180,
      valueFormatter: (value) =>
        value ? new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-',
    },
    {
      field: "stock_item.product.name",
      headerName: "Nama Barang",
      flex: 1,
      valueGetter: (value, row) => row.stock_item?.product?.name || 'N/A',
    },
    {
      field: "transaction_type",
      headerName: "Jenis Transaksi",
      width: 150,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => {
        const isIncoming = params.value === 'penambahan';
        return (
          <Chip
            label={isIncoming ? 'Stok Masuk' : 'Stok Keluar'}
            color={isIncoming ? 'success' : 'warning'}
            size="small"
            variant="outlined"
          />
        )
      }
    },
    {
      field: "quantity_changed",
      headerName: "Jumlah",
      type: 'number',
      width: 120,
      headerAlign: "center",
      align: "center",
      valueGetter: (value, row) => `${row.quantity_changed} ${row.stock_item?.product?.measurement_unit || ''}`,
    },
    { field: "person_name", headerName: "Nama Pengambil/Penambah", width: 200 },
    {
      field: "user.name",
      headerName: "Dicatat oleh",
      width: 150,
      valueGetter: (value, row) => row.user?.name || 'Sistem',
    },
    { field: "notes", headerName: "Catatan/Keperluan", flex: 1 },
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={id}>
      <Box sx={{ height: '80vh', width: '100%' }}>
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="subtitle1" sx={{ mr: 1, fontWeight: 500 }}>
              Export Laporan:
            </Typography>
            <DatePicker
              label="Tanggal Mulai"
              value={startDate}
              onChange={(newValue) => setStartDate(newValue)}
              slotProps={{ textField: { size: 'small' } }}
              sx={{ maxWidth: 200 }}
            />
            <DatePicker
              label="Tanggal Selesai"
              value={endDate}
              onChange={(newValue) => setEndDate(newValue)}
              slotProps={{ textField: { size: 'small' } }}
              sx={{ maxWidth: 200 }}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleDownloadLogs}
              disabled={isDownloadingLogs}
              startIcon={isDownloadingLogs ? <CircularProgress size={20} color="inherit" /> : <Download />}
            >
              {isDownloadingLogs ? 'Memproses...' : 'Download Riwayat'}
            </Button>
        </Box>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          rowCount={rowCount}
          // Konfigurasi Server-side
          paginationMode="server"
          filterMode="server"
          sortingMode="server"
          // Model & Handler
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          filterModel={filterModel}
          onFilterModelChange={setFilterModel}
          sortModel={sortModel}
          onSortModelChange={setSortModel}
          // Tampilan & Slot
          pageSizeOptions={[10, 25, 50]}
          slots={{ toolbar: CustomToolbar }}
          showToolbar
          sx={{
            backgroundColor: theme.palette.background.paper,
            "& .MuiDataGrid-columnHeaderTitle": {
              fontWeight: 600,
            },
          }}
        />
      </Box>
    </LocalizationProvider>
  );
}

