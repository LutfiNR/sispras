"use client";

// 1. Import hook React dan Next.js
import { useState } from "react"; // 'useEffect' dan 'useCallback' tidak lagi dibutuhkan di sini
import { useRouter } from "next/navigation";

// 2. Import komponen dari MUI
import { Button, Stack, IconButton, Box, Snackbar, Alert, Divider } from "@mui/material";
import { DataGrid, getGridStringOperators } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import DialogConfirmation from "@/components/dashboard/DialogConfirmation";
import CustomToolbar from "@/components/dashboard/CustomToolbar";
import theme from "@/theme/theme";

// 3. Import service frontend
import {
  getPaginatedLocations,
  deleteLocation,
} from "@/services/locationServices";

// 4. Import custom hook
import { useDataGridServer } from "@/lib/hooks/useDataGridServer";

// ===================================================================================

export default function RoomsPage() {
  const router = useRouter();

  // 5. Panggil custom hook
  const {
    rows,
    loading,
    rowCount,
    paginationModel,
    setPaginationModel,
    filterModel,
    setFilterModel,
    refreshData,
  } = useDataGridServer(getPaginatedLocations);

  // --- BARU: STATE UNTUK DIALOG KONFIRMASI ---
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  // --- BARU: STATE UNTUK SNACKBAR NOTIFIKASI ---
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // --- HANDLER BARU UNTUK DIALOG ---
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
      await deleteLocation(selectedId);
      setSnackbar({
        open: true,
        message: "Lokasi berhasil dihapus.",
        severity: "success",
      });
      refreshData();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || "Gagal menghapus lokasi.",
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

  // --- Definisi kolom diubah untuk memanggil dialog ---
  const columns = [
    {
      field: "no",
      headerName: "No.",
      width: 65,
      headerAlign: "center",
      filterable: false,
      renderCell: (params) => {
        return (
          <Box display="flex" justifyContent="center" alignItems="center">
            {params.api.getRowIndexRelativeToVisibleRows(params.id) + 1}
          </Box>
        );
      },
    },
    {
      field: "floor", headerName: "Lantai", width: 150, filterOperators: getGridStringOperators().filter(
        (operator) => operator.value === 'contains'
      ),
    },
    {
      field: "building", headerName: "Gedung", width: 150, filterOperators: getGridStringOperators().filter(
        (operator) => operator.value === 'contains'
      ),
    },
    {
      field: "name", headerName: "Nama Ruangan", flex: 1, filterOperators: getGridStringOperators().filter(
        (operator) => operator.value === 'contains'
      ),
    },
    {
      field: "actions",
      headerName: "Aksi",
      headerAlign: "center",
      width: 120,
      disableExport: true,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box
          height="100%"
          display="flex"
          direction="row"
          justifyContent="space-around"
          alignItems="center"
        >
          <IconButton
            size="small"
            color="primary"
            onClick={() =>
              router.push(
                `/dashboard/inventaris-tetap/ruangan/edit/${params.id}`
              )
            }
          >
            <EditIcon />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            // DIUBAH: Panggil handleOpenDeleteDialog
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
      <Box display="flex" justifyContent="end">
        <Button
          variant="contained"
          color="primary"
          onClick={() =>
            router.push("/dashboard/inventaris-tetap/ruangan/tambah")
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
      />
      <DialogConfirmation
        dialogOpen={dialogOpen}
        handleCloseDeleteDialog={handleCloseDeleteDialog}
        handleConfirmDelete={handleConfirmDelete}
        title="Konfirmasi Hapus"
        content="Apakah Anda yakin ingin menghapus lokasi ini? Tindakan ini tidak dapat dibatalkan."
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
