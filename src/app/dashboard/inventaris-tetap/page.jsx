"use client";

import React, {useState} from "react";
import { useRouter } from "next/navigation";

// Komponen MUI
import { Stack, Box, Tooltip, IconButton, Divider, Button } from "@mui/material";
import { DataGrid, getGridStringOperators } from "@mui/x-data-grid";
import InfoIcon from '@mui/icons-material/Info';
import { Download } from '@mui/icons-material';


// Komponen Kustom & Service
import CustomToolbar from "@/components/dashboard/CustomToolbar";
import { getAssetAggregateSummary } from "@/services/assetServices"; // Menggunakan service baru
import { useDataGridServer } from "@/lib/hooks/useDataGridServer";
import theme from "@/theme/theme";

// Fungsi untuk memproses baris data, menambahkan ID unik untuk DataGrid
const processRow = (row, index) => ({
  ...row,
  // Buat ID unik dari kombinasi field, karena hasil agregasi tidak punya _id
  id: `${row.productName}-${row.brandName}-${row.locationName}-${row.condition}-${index}`,
});

/**
 * Halaman untuk menampilkan laporan agregat Inventaris Tetap.
 * Data diambil dan dipaginasi dari backend.
 */
export default function AssetAggregatePage() {
  const router = useRouter();

  // Gunakan custom hook untuk menangani state DataGrid (pagination, filter, sort, dll.)
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
  } = useDataGridServer(getAssetAggregateSummary, processRow);

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadInNewTab = () => {
    setIsDownloading(true);

    // a. Tentukan URL dasar dari API Anda
    const baseUrl = '/api/inventory/assets/export';

    // b. Siapkan parameter dasar
    const baseParams = {
      type: 'summary', // Ganti ke 'summary' jika perlu
    };

    // f. Buat URL lengkap
    const finalUrl = `${baseUrl}?type=${baseParams.type}`;

    console.log("Opening new tab for download:", finalUrl);

    // g. Buka URL di tab baru. Browser akan memulai download secara otomatis.
    window.open(finalUrl, '_blank');

    // Sedikit delay sebelum menonaktifkan status loading,
    // karena kita tidak tahu pasti kapan proses di server selesai.
    setTimeout(() => {
      setIsDownloading(false);
    }, 2000); // Tunggu 2 detik
  };

  // --- Handler untuk tombol detail ---
  const handleShowDetail = (row) => {
    // Buat query string dari ID produk, lokasi, dan kondisi
    const queryParams = new URLSearchParams({
      product: row.productId,
      location: row.locationId,
    }).toString();

    // Arahkan ke halaman daftar aset individual dengan filter yang sudah diterapkan
    router.push(`/dashboard/inventaris-tetap/aset?${queryParams}`);
  };

  // Definisi kolom untuk DataGrid
  const columns = [
    {
      field: "no",
      headerName: "No.",
      width: 45,
      headerAlign: "center",
      align: "center",
      filterable: false,
      sortable: false,
      renderCell: (params) =>
        params.api.getRowIndexRelativeToVisibleRows(params.id) + 1,
    },
    {
      field: "building", headerName: "Gd", width: 50, filterOperators: getGridStringOperators().filter(
        (operator) => operator.value === 'contains'
      ),
    },
    {
      field: "floor", headerName: "Lt", width: 50, filterOperators: getGridStringOperators().filter(
        (operator) => operator.value === 'contains'
      ),
    },
    {
      field: "room", headerName: "Ruangan", flex: 1, filterOperators: getGridStringOperators().filter(
        (operator) => operator.value === 'contains'
      ),
    },
    {
      field: "productName", headerName: "Nama Aset", flex: 1,
      filterOperators: getGridStringOperators().filter(
        (operator) => operator.value === 'contains'
      ),
    },
    {
      field: "brandName", headerName: "Merk", flex: 1, filterOperators: getGridStringOperators().filter(
        (operator) => operator.value === 'contains'
      ),
    },
    {
      field: "jumlah",
      headerName: "Jumlah",
      type: 'number',
      width: 65,
      headerAlign: "center",
      filterable: false,
      align: "center",
    },
    {
      field: "estimated_price",
      headerName: "Harga Satuan",
      flex: 1,
      type: 'number',
      filterable: false,
      align: 'right',
      headerAlign: 'right',
      valueFormatter: (value) => {
        if (value == null || isNaN(value)) return '';
        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0,
        }).format(value);
      },
    },
    {
      field: "actions",
      headerName: "Detail",
      headerAlign: "center",
      align: "center",
      width: 65,
      filterable: false,
      sortable: false,
      renderCell: (params) => (
        <Tooltip title="Lihat Detail Aset">
          <IconButton onClick={() => handleShowDetail(params.row)}>
            <InfoIcon color="info" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <Stack>
          <Divider sx={{ mb: 2 }} />
          <Box display="flex" justifyContent="end" gap={2}>

            <Button
              variant="contained"
              color="primary"
              onClick={handleDownloadInNewTab}
              disabled={isDownloading}
              startIcon={isDownloading ? <CircularProgress size={20} color="inherit" /> : <Download />}
              sx={{ mb: 2, px: 4 }}
            >
              {isDownloading ? 'Mengunduh...' : 'Download Laporan'}
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
        slots={{
          toolbar: CustomToolbar
        }}
        slotProps={{
          loadingOverlay: {
            variant: "skeleton",
            noRowsVariant: "skeleton",
          },
          toolbar: {
            title: "Filter dan Export",
          },
          columnHeaders: {
            title: {},
          },
        }}
        showToolbar
        sx={{

          backgroundColor: theme.palette.background.paper,
          "& .MuiDataGrid-columnHeaderTitle": {
            fontWeight: 600,
          },
        }}
      />
    </Stack>
  );
}
