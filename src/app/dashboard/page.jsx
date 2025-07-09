"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

// components
import SummaryCard from "@/components/dashboard/SummaryCard";

// material-ui
import { Box, Typography, CircularProgress, Alert, Chip, Stack, Tooltip, IconButton } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import theme from "@/theme/theme";

// Frontend Services
import { getSummary, getLowStock, getRecentLogs } from "@/services/dashboardServices";
import { getGridStringOperators } from "@mui/x-data-grid";

// --- KOMPONEN UTAMA HALAMAN DASHBOARD ---
export default function DashboardPage() {
  const router = useRouter();

  const [lowStockRows, setLowStockRows] = useState([]);
  const [logRows, setLogRows] = useState([]);
  const [dataSummary, setDataSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Panggil semua API dashboard secara paralel untuk efisiensi
        const [summaryRes, lowStockRes, logRes] = await Promise.all([
          getSummary(),
          getLowStock(),
          getRecentLogs()
        ]);

        // Tambahkan ID unik ke setiap baris data untuk DataGrid
        const lowStock = lowStockRes.data.map(item => ({ ...item, id: item._id }));
        const logTransactions = logRes.data.map(item => ({ ...item, id: item._id }));

        setDataSummary(summaryRes.data);
        setLowStockRows(lowStock);
        setLogRows(logTransactions);

      } catch (err) {
        console.error("Gagal memuat data dashboard:", err);
        setError("Gagal memuat data untuk dashboard. Silakan coba lagi nanti.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllData();
  }, []);

  const lowStockColumns = useMemo(() => [
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
      field: "productName", headerName: "Nama Barang", flex: 1,
      
    },
    {
      field: "quantity",
      headerName: "Sisa Stok",
      type: 'number',
      width: 150,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => (
        <Chip
          label={`${params.row.quantity} ${params.row.unit}`}
          color="error"
          size="small"
        />
      )
    },
  ], [router]);

  const logColumns = useMemo(() => [
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
      field: "createdAt",
      headerName: "Tanggal",
      width: 180,
      valueFormatter: (value) =>
        value ? new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-',
    },
    {
      field: "productName",
      headerName: "Nama Barang",
      flex: 1,
      valueGetter: (value, row) => row.stock_item?.product?.name || 'N/A',
    },
    {
      field: "type",
      headerName: "Jenis",
      width: 120,
      renderCell: (params) => {
        const isIncoming = params.value === 'penambahan';
        return (
          <Chip
            label={isIncoming ? 'Masuk' : 'Keluar'}
            color={isIncoming ? 'success' : 'warning'}
            size="small"
            variant="outlined"
          />
        );
      }
    },
    {
      field: "quantity_changed",
      headerName: "Jumlah",
      type: 'number',
      width: 100,
      align: 'center',
      headerAlign: 'center',
      valueGetter: (value, row) => `${row.quantity_changed} ${row.stock_item?.unit || ''}`,
    },
    { field: "person_name", headerName: "Pengambil/Penambah", width: 200 },
    {
      field: "user",
      headerName: "Dicatat Oleh",
      width: 150,
      valueGetter: (value, row) => row.user?.name || 'Sistem',
    },
  ], []);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">{error}</Alert>
    );
  }

  return (
    <Stack direction="column" spacing={4}>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={4}>
        <SummaryCard
          title="Total Inventaris Tetap"
          value={dataSummary?.totalAssets ?? 0}
          unit="Aset"
        />
        <SummaryCard
          title="Total Stok Habis Pakai"
          value={dataSummary?.totalStock ?? 0}
          unit="Item"
        />
      </Stack>

      <Stack direction="column" spacing={2}>
        <Typography variant="h6" fontWeight={600}>Stok Menipis / Habis</Typography>
        <Box sx={{ height: 300, width: '100%' }}>
          <DataGrid
            rows={lowStockRows}
            columns={lowStockColumns}
            loading={isLoading}
            hideFooter
            sx={{
              backgroundColor: theme.palette.background.paper,
              "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 600 },
            }}
          />
        </Box>
      </Stack>

      <Stack direction="column" spacing={2}>
        <Typography variant="h6" fontWeight={600}>Riwayat Stok Terbaru</Typography>
        <Box sx={{ height: 400, width: '100%' }}>
          <DataGrid
            rows={logRows}
            columns={logColumns}
            loading={isLoading}
            hideFooter
            sx={{
              backgroundColor: theme.palette.background.paper,
              "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 600 },
            }}
          />
        </Box>
      </Stack>
    </Stack>
  );
}
