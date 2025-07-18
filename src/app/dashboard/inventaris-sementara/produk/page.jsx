"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

// Komponen MUI
import { Box, Tooltip, IconButton, Button, Stack, Divider, Snackbar, Alert } from "@mui/material";
import { DataGrid, getGridStringOperators } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

// Komponen Kustom & Service
import CustomToolbar from "@/components/dashboard/CustomToolbar";
import { getPaginatedConsumableProducts, deleteConsumableProductById } from "@/services/consumableServices"; // Menggunakan service API
import { useDataGridServer } from "@/lib/hooks/useDataGridServer";
import theme from "@/theme/theme";
import DialogConfirmation from "@/components/dashboard/DialogConfirmation";

/**
 * Halaman utama untuk menampilkan dan mengelola daftar Produk Habis Pakai menggunakan DataGrid.
 */
export default function ConsumableProductPage() {
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
    refreshData,
  } = useDataGridServer(getPaginatedConsumableProducts);

  const [dialogOpen, setDialogOpen] = useState(false);
   const [selectedId, setSelectedId] = useState(null);
 
   // --- BARU: STATE UNTUK SNACKBAR NOTIFIKASI ---
   const [snackbar, setSnackbar] = useState({
     open: false,
     message: "",
     severity: "success",
   });
 
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
       await deleteConsumableProductById(selectedId);
       setSnackbar({
         open: true,
         message: "Produk berhasil dihapus.",
         severity: "success",
       });
       refreshData();
     } catch (error) {
       setSnackbar({
         open: true,
         message: error.message || "Gagal menghapus produk.",
         severity: "error",
       });
     } finally {
       handleCloseDeleteDialog();
     }
   };
 
   // --- HANDLER BARU UNTUK SNACKBAR ---
   const handleCloseSnackbar = (event, reason) => {
     if (reason === "clickaway") {
       return;
     }
     setSnackbar((prev) => ({ ...prev, open: false }));
   };

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
      field: "product_code", headerName: "Kode Produk", width: 150, filterOperators: getGridStringOperators().filter(
        (operator) => operator.value === 'contains'
      ),
    },
    {
      field: "name", headerName: "Nama Produk", flex: 1, filterOperators: getGridStringOperators().filter(
        (operator) => operator.value === 'contains'
      ),
    },
    {
      field: "categoryName", headerName: "Kategori", flex: 1, filterOperators: getGridStringOperators().filter(
        (operator) => operator.value === 'contains'
      ), valueGetter: (value, row) => row.category?.name || "-"
    },
    {
      field: "measurement_unit", headerName: "Satuan Unit", flex: 1, filterOperators: getGridStringOperators().filter(
        (operator) => operator.value === 'contains'
      ),
    },
    {
      field: "reorder_point", headerName: "Jumlah Minimum Stock", flex: 1, filterOperators: getGridStringOperators().filter(
        (operator) => operator.value === 'contains'
      ),
    },
    {
      field: "actions",
      headerName: "Aksi",
      headerAlign: "center",
      align: "center",
      width: 120,
      filterable: false,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Edit">
            <IconButton onClick={() =>
              router.push(
                `/dashboard/inventaris-sementara/produk/edit/${params.id}`
              )
            }>
              <EditIcon color="action" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Hapus">
            <IconButton onClick={() => handleOpenDeleteDialog(params.id)}>
              <DeleteIcon color="error" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Stack >
      <Divider sx={{ mb: 2 }} />
      <Box display="flex" justifyContent="end" gap={2}>
        <Button
          variant="contained"
          color="primary"
          onClick={
            () => router.push("/dashboard/inventaris-sementara/produk/tambah") // Ubah ke rute tambah aset
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
        sx={{
          backgroundColor: theme.palette.background.paper,
          "& .MuiDataGrid-columnHeaderTitle": {
            fontWeight: 600,
          },
        }}
      /><DialogConfirmation
        dialogOpen={dialogOpen}
        handleCloseDeleteDialog={handleCloseDeleteDialog}
        handleConfirmDelete={handleConfirmDelete}
        title="Konfirmasi Hapus"
        content="Apakah Anda yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan."
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
