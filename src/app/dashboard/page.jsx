"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// components
import SummaryCard from "@/components/dashboard/SummaryCard";
import LowStockList from "@/components/dashboard/LowStockList";

// material-ui
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Alert, Chip } from "@mui/material";

// Frontend Services (asumsi ada file service baru untuk dashboard)
import { getSummary, getLowStock, getRecentLogs } from "@/services/dashboardServices";

// Komponen Tabel Transaksi yang bisa digunakan kembali
const TransactionTable = ({ title, headers, data, renderRow }) => (
  <Box>
    <Typography variant="h6" sx={{ mt: 4, mb: 2, fontWeight: 500 }}>
      {title}
    </Typography>
    <TableContainer component={Paper} variant="outlined">
      <Table>
        <TableHead>
          <TableRow sx={{ "& .MuiTableCell-head": { fontWeight: "bold" } }}>
            {headers.map((header) => (
              <TableCell key={header}>{header}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>{data?.map(renderRow)}</TableBody>
      </Table>
    </TableContainer>
  </Box>
);

// --- KOMPONEN UTAMA HALAMAN DASHBOARD ---
export default function DashboardPage() {
  const router = useRouter();

  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Panggil semua API dashboard secara paralel untuk efisiensi
        const [summaryRes, lowStockRes, recentLogsRes] = await Promise.all([
          getSummary(),
          getLowStock(),
          getRecentLogs(),
        ]);

        setDashboardData({
          summary: summaryRes.data,
          lowStock: lowStockRes.data,
          recentLogs: recentLogsRes.data,
        });

      } catch (err) {
        console.error("Gagal memuat data dashboard:", err);
        setError("Gagal memuat data untuk dashboard. Silakan coba lagi nanti.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllData();
  }, []);

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
    <>
      <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} width={"100%"} gap={4}>
        <SummaryCard
          title="Total Inventaris Tetap"
          value={dashboardData.summary.totalAssets}
          unit="Aset"
          onClick={() => router.push('/dashboard/inventaris-tetap/aset')}
        />
        <SummaryCard
          title="Total Stok Habis Pakai"
          value={dashboardData.summary.totalTempStock}
          unit="Item"
          onClick={() => router.push('/dashboard/inventaris-sementara/stok')}
        />
      </Box>

      <LowStockList items={dashboardData.lowStock} />

      <TransactionTable
        title="5 Aktivitas Terbaru Barang Habis Pakai"
        headers={["Tanggal", "Nama Barang", "Jenis", "Jumlah", "Dicatat Oleh", "Pengambil/Penambah"]}
        data={dashboardData.recentLogs}
        renderRow={(row, index) => (
          <TableRow key={row._id || index}>
            <TableCell>{new Date(row.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</TableCell>
            <TableCell>{row.stock_item?.product?.name || 'N/A'}</TableCell>
            <TableCell>
              <Chip
                label={row.type === 'penambahan' ? 'Masuk' : 'Keluar'}
                color={row.type === 'penambahan' ? 'success' : 'warning'}
                size="small"
                variant="outlined"
              />
            </TableCell>
            <TableCell>{`${row.quantity_changed} ${row.stock_item?.unit || ''}`}</TableCell>
            <TableCell>{row.user?.name || 'Sistem'}</TableCell>
            <TableCell>{row.person_name}</TableCell>
          </TableRow>
        )}
      />
    </>
  );
}
