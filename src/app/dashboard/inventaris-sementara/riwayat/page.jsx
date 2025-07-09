"use client";

import React from "react";
import { useRouter } from "next/navigation";

// Komponen MUI
import { Box, Chip, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

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
      width: 100,
      headerAlign: "center",
      align: "center",
      valueGetter: (value, row) => `${row.quantity_changed} ${row.stock_item?.unit || ''}`,
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
    <Box sx={{ height: '80vh', width: '100%' }}>
      <Typography variant="h4" sx={{ mb: 2 }}>Riwayat Transaksi</Typography>
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
  );
}
