"use client";

// 1. Import hook React dan Next.js
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// 2. Import komponen dari MUI
import {
  Button,
  Stack,
  IconButton,
  Box,
  Snackbar,
  Alert,
  Divider,
  Chip,
  CircularProgress,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { Download } from '@mui/icons-material';

// 3. Import komponen kustom
import DialogConfirmation from "@/components/dashboard/DialogConfirmation";
import CustomToolbar from "@/components/dashboard/CustomToolbar";
import theme from "@/theme/theme";

// 4. Import service frontend untuk Aset
import {
  getPaginatedAssets,
  deleteAsset, // Asumsi ada service ini
} from "@/services/assetServices"; // Asumsi nama file service-nya

// 5. Import custom hook
import { useDataGridServer } from "@/lib/hooks/useDataGridServer";
import { getGridStringOperators } from "@mui/x-data-grid";

// ===================================================================================

// Fungsi untuk memproses dan meratakan data aset dari server
const processItemRow = (item) => ({
  ...item,
  id: item._id,
  // "Ratakan" data populate menjadi string agar bisa ditampilkan dan difilter
  product: item.product?.name || "N/A",
  brand: item.product?.brand?.name || "N/A",
  location: item.location?.name || "N/A",
});

export default function AssetPage() {
  const router = useRouter();
  const searchParams = useSearchParams()

  const initialFilters = {
    product: searchParams.get('product') || null,
    location: searchParams.get('location') || null,
  };
  // 6. Panggil custom hook dengan service Aset
  const {
    rows,
    loading,
    rowCount,
    paginationModel,
    setPaginationModel,
    filterModel,
    setFilterModel,
    refreshData,
  } = useDataGridServer(getPaginatedAssets, processItemRow, initialFilters);

  // --- State untuk dialog konfirmasi ---
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  // --- State untuk notifikasi Snackbar ---
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadInNewTab = () => {
    setIsDownloading(true);

    // a. Tentukan URL dasar dari API Anda
    const baseUrl = '/api/inventory/assets/export';

    // b. Siapkan parameter dasar
    const baseParams = {
      type: 'individual', // Ganti ke 'summary' jika perlu
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

  // --- Handler untuk dialog ---
  const handleOpenDeleteDialog = (id) => {
    setSelectedId(id);
    setDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setSelectedId(null);
    setDialogOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!selectedId) return;

    try {
      await deleteAsset(selectedId); // Panggil service deleteAsset
      setSnackbar({
        open: true,
        message: "Aset berhasil dihapus.",
        severity: "success",
      });
      refreshData();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || "Gagal menghapus aset.",
        severity: "error",
      });
    } finally {
      handleCloseDeleteDialog();
    }
  };

  // --- Handler untuk Snackbar ---
  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // --- Definisi kolom untuk DataGrid Aset ---
  const columns = [
    {
      field: "no",
      headerName: "No.",
      width: 65,
      headerAlign: "center",
      align: "center",
      filterable: false,
      sortable: false,
      renderCell: (params) => {
        return (
          <Box display="flex" justifyContent="center" alignItems="center">
            {params.api.getRowIndexRelativeToVisibleRows(params.id) + 1}
          </Box>
        );
      },
    },
    {
      field: "serial_number", headerName: "No. Seri", flex: 1, filterOperators: getGridStringOperators().filter(
        (operator) => operator.value === 'contains'
      ),
    },
    {
      field: "location", headerName: "Lokasi", flex: 1, filterOperators: getGridStringOperators().filter(
        (operator) => operator.value === 'contains'
      ),
    },
    {
      field: "product", headerName: "Nama Aset", flex: 1, filterOperators: getGridStringOperators().filter(
        (operator) => operator.value === 'contains'
      ),
    },
    {
      field: "brand", headerName: "Merk", flex: 1, filterOperators: getGridStringOperators().filter(
        (operator) => operator.value === 'contains'
      ),
    },
    {
      field: "purchased_year", headerName: "Tahun", flex: 1, filterOperators: getGridStringOperators().filter(
        (operator) => operator.value === 'contains'
      ),
    },
    {
      field: "estimated_price",
      headerName: "Harga",
      flex: 1,
      filterable: false,
      type: "number", // Penting untuk sorting numerik
      align: "right", // Rata kanan untuk angka/mata uang
      headerAlign: "right",
      valueFormatter: (value) => {
        // Cek jika value null, undefined, atau bukan angka
        if (value == null || isNaN(value)) {
          return ""; // Kembalikan string kosong
        }
        // Format ke Rupiah Indonesia
        return new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          minimumFractionDigits: 0, // Tidak ada angka di belakang koma
          maximumFractionDigits: 0,
        }).format(value);
      },
    },
    {
      field: "condition",
      headerName: "Kondisi",
      width: 120, filterOperators: getGridStringOperators().filter(
        (operator) => operator.value === 'contains'
      ),
      renderCell: (params) => {
        const color =
          params.value === "Baik"
            ? "success"
            : params.value === "Rusak"
              ? "error"
              : "warning";
        return (
          <Chip
            label={params.value}
            color={color}
            size="small"
            sx={{ width: "80px" }}
          />
        );
      },
    },
    {
      field: "actions",
      headerName: "Aksi",
      headerAlign: "center",
      align: "center",
      width: 120,
      filterable: false,
      disableExport: true,
      sortable: false,
      renderCell: (params) => (
        <Box
          height="100%"
          display="flex"
          justifyContent="space-around"
          alignItems="center"
        >
          <IconButton
            size="small"
            color="primary"
            onClick={() =>
              router.push(
                `/dashboard/inventaris-tetap/aset/edit/${params.id}` // Ubah ke rute edit aset
              )
            }
          >
            <EditIcon />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => handleOpenDeleteDialog(params.id)}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Stack>
      <Divider sx={{ mb: 2 }} />
      <Box display="flex" justifyContent="end" gap={2}>
        <Button
          variant="outlined"
          color="primary"
          onClick={
            () => router.replace("/dashboard/inventaris-tetap/aset?page=1&limit=10&sortBy=createdAt&order=desc") // Ubah ke rute tambah aset
          }
          sx={{ mb: 2, px: 4 }}
        >
          Tampilkan Semua Aset
        </Button>
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
        <Button
          variant="contained"
          color="primary"
          onClick={
            () => router.push("/dashboard/inventaris-tetap/aset/tambah") // Ubah ke rute tambah aset
          }
          sx={{ mb: 2, px: 4 }}
        >
          Tambah
        </Button>
      </Box>

      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        rowCount={rowCount}
        paginationMode="server"
        pageSizeOptions={[10, 25, 50, 100]}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        filterMode="server"
        filterModel={filterModel}
        onFilterModelChange={setFilterModel}
        slots={{ toolbar: CustomToolbar }}
        showToolbar
        slotProps={{
          toolbar: {
            title: "Filter dan Export",
          },
        }}
        sx={{
          backgroundColor: theme.palette.background.paper,
          "& .MuiDataGrid-columnHeaderTitle": {
            fontWeight: 600,
          },
        }}
      />
      <DialogConfirmation
        dialogOpen={dialogOpen}
        handleCloseDeleteDialog={handleCloseDeleteDialog}
        handleConfirmDelete={handleConfirmDelete}
        title="Konfirmasi Hapus"
        content="Apakah Anda yakin ingin menghapus aset ini? Tindakan ini tidak dapat dibatalkan."
      />
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
