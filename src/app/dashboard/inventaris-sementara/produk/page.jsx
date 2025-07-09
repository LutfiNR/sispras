"use client";

import React from "react";
import { useRouter } from "next/navigation";

// Komponen MUI
import { Box, Tooltip, IconButton, Button } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

// Komponen Kustom & Service
import CustomToolbar from "@/components/dashboard/CustomToolbar";
import { getPaginatedConsumableProducts, deleteConsumableProductById } from "@/services/consumableServices"; // Menggunakan service API
import { useDataGridServer } from "@/lib/hooks/useDataGridServer";
import theme from "@/theme/theme";

// Hook untuk notifikasi dan konfirmasi
import { useSnackbar } from "@/components/providers/SnackbarProvider";
import { useConfirmation } from "@/components/providers/ConfirmationDialogProvider";

/**
 * Halaman utama untuk menampilkan dan mengelola daftar Produk Habis Pakai menggunakan DataGrid.
 */
export default function ConsumableProductPage() {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const { showConfirmation } = useConfirmation();

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

  // --- EVENT HANDLERS ---
  const handleAddItem = () => router.push("/inventaris-sementara/produk/tambah");
  const handleEdit = (id) => router.push(`/inventaris-sementara/produk/edit/${id}`);

  const handleDelete = (item) => {
    showConfirmation(
      "Konfirmasi Hapus",
      `Yakin ingin menghapus produk "${item.name}"? Produk ini tidak bisa lagi ditambahkan ke stok.`,
      async () => {
        try {
          await deleteConsumableProductById(item.id);
          showSnackbar("Produk berhasil dihapus.", "success");
          refreshData(); // Muat ulang data setelah berhasil hapus
        } catch (err) {
          showSnackbar(err.message || "Gagal menghapus produk.", "error");
        }
      }
    );
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
    { field: "product_code", headerName: "Kode Produk", width: 150 },
    { field: "name", headerName: "Nama Produk", flex: 1 },
    { field: "categoryName", headerName: "Kategori", flex: 1, valueGetter: (value, row) => row.category?.name || "-" },
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
            <IconButton onClick={() => handleEdit(params.id)}>
              <EditIcon color="action" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Hapus">
            <IconButton onClick={() => handleDelete(params.row)}>
              <DeleteIcon color="error" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ height: '80vh', width: '100%' }}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" onClick={handleAddItem}>
                + Tambah Produk
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
