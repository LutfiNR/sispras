"use client";

import React from "react";
import { useRouter } from "next/navigation";

// Komponen MUI
import { Box, Tooltip, IconButton, Button, Chip } from "@mui/material";
import { DataGrid, getGridStringOperators } from "@mui/x-data-grid";
import HistoryIcon from "@mui/icons-material/History";
import DownloadIcon from "@mui/icons-material/Download";
import UploadIcon from "@mui/icons-material/Upload";

// Komponen Kustom & Service
import CustomToolbar from "@/components/dashboard/CustomToolbar";
import { getPaginatedConsumableStock } from "@/services/consumableServices"; // Menggunakan service API
import { useDataGridServer } from "@/lib/hooks/useDataGridServer";
import theme from "@/theme/theme";

/**
 * Halaman utama untuk menampilkan dan mengelola daftar Stok Barang Habis Pakai.
 */
export default function ConsumableStockPage() {
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
  } = useDataGridServer(getPaginatedConsumableStock);

  // --- EVENT HANDLERS ---
  const handleRestock = () => router.push("/dashboard/inventaris-sementara/barang-masuk");
  const handleUsage = (item) => router.push(`/dashboard/inventaris-sementara/barang-keluar?stockId=${item.id}`);
  const handleViewLog = () => router.push("/dashboard/inventaris-sementara/riwayat");

  // --- COLUMN DEFINITIONS ---
  const columns = [
    {
      field: "no",
      headerName: "No.",
      width: 65,
      headerAlign: "center",
      align: "center",
      filterable: false,
      sortable: false,
      renderCell: (params) =>
        params.api.getRowIndexRelativeToVisibleRows(params.id) + 1,
    },
    {
      field: "product.name",
      headerName: "Nama Barang",
      flex: 1,
      valueGetter: (value, row) => row.product?.name || "-",
      filterOperators: getGridStringOperators().filter(
        (operator) => operator.value === 'contains'
      ),
    },
    {
      field: "product.product_code",
      headerName: "Kode Barang",
      width: 150,
      valueGetter: (value, row) => row.product?.product_code || "-",
      filterOperators: getGridStringOperators().filter(
        (operator) => operator.value === 'contains'
      ),
    },
    {
      field: "quantity",
      headerName: "Jumlah Stok",
      type: 'number',
      width: 150,
      headerAlign: "center",
      align: "center",
      filterable: false,
      renderCell: (params) => {
        const isLowStock = params.row.quantity <= params.row.product.reorder_point;
        return (
          <Chip
            label={`${params.row.quantity} ${params.row.product.measurement_unit}`}
            color={isLowStock ? 'error' : 'default'}
            variant={isLowStock ? 'filled' : 'outlined'}
            size="small"
          />
        )
      }
    },
    {
      field: "product.reorder_point",
      headerName: "Batas Minimum",
      type: 'number',
      width: 150,
      headerAlign: "center",
      align: "center",
      filterable: false,
      valueGetter: (value, row) => {
        return row.product?.reorder_point || 0;
      },
    },
    {
      field: "actions",
      headerName: "Ambil Stok",
      headerAlign: "center",
      align: "center",
      width: 120,
      filterable: false,
      sortable: false,
      renderCell: (params) => (
        <Tooltip title="Ambil/Gunakan Stok">
          <IconButton onClick={() => handleUsage(params.row)} color="primary">
            <UploadIcon />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <Box sx={{ height: '80vh', width: '100%' }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button variant="outlined" startIcon={<HistoryIcon />} onClick={handleViewLog}>
          Riwayat
        </Button>
        <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleRestock}>
          Barang Masuk
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
  );
}
