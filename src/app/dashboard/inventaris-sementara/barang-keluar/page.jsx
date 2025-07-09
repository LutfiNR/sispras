"use client";

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Komponen MUI
import { Box, CircularProgress, Alert, Typography, Snackbar } from '@mui/material';

// Komponen Kustom & Service
import FormComponent from '@/components/dashboard/FormComponent';
import { recordUsage, getConsumableStockById } from '@/services/consumableServices';

/**
 * Komponen Form untuk mencatat pengambilan stok.
 * Dipisahkan agar bisa dibungkus oleh Suspense.
 */
function UsageForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const stockId = searchParams.get('stockId');

    // --- STATE MANAGEMENT ---
    const [formData, setFormData] = useState({
        stockItemId: stockId || '',
        quantityTaken: 1,
        person_name: '',
        person_role: '',
        notes: '',
    });
    const [stockInfo, setStockInfo] = useState(null);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [submitError, setSubmitError] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

    // --- PENGAMBILAN DATA AWAL ---
    useEffect(() => {
        if (!stockId) {
            setIsLoadingData(false);
            setSubmitError("ID Stok tidak valid atau tidak ditemukan di URL.");
            return;
        }

        const fetchStockData = async () => {
            setIsLoadingData(true);
            try {
                const response = await getConsumableStockById(stockId);
                const stockData = response.data;

                if (!stockData) throw new Error("Data stok tidak ditemukan.");

                setStockInfo({
                    name: stockData.product?.name || 'N/A',
                    currentQty: stockData.quantity,
                    unit: stockData.unit
                });
            } catch (err) {
                setSnackbar({ open: true, message: err.message || "Gagal memuat detail stok.", severity: "error" });
                router.back();
            } finally {
                setIsLoadingData(false);
            }
        };
        fetchStockData();
    }, [stockId, router]);

    // --- KONFIGURASI FORM ---
    const formConfig = useMemo(() => [
        {
            name: 'quantityTaken',
            label: `Jumlah Diambil (${stockInfo?.unit || ''})`,
            type: 'number',
            required: true,
            inputProps: { min: 1, max: stockInfo?.currentQty || 9999 },
        },
        { name: 'person_name', label: 'Nama Pengambil', type: 'text', required: true },
        { name: 'person_role', label: 'Jabatan (Opsional)', type: 'text' },
        { name: 'notes', label: 'Keperluan/Catatan (Opsional)', type: 'textarea', rows: 4 },
    ], [stockInfo]);

    // --- EVENT HANDLERS ---
    const handleFormChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setFieldErrors({});
        setSubmitError(null);

        try {
            await recordUsage(formData);
            setSnackbar({ open: true, message: 'Pengambilan stok berhasil dicatat!', severity: 'success' });
            router.push('/dashboard/inventaris-sementara');
        } catch (err) {
            const errorMessage = err.message || "Terjadi kesalahan saat menyimpan.";
            setSnackbar({ open: true, message: errorMessage, severity: 'error' });
            if (err.errors) {
                setFieldErrors(err.errors);
            } else {
                setSubmitError(errorMessage);
            }
            setIsSubmitting(false);
        }
    };

    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') return;
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    if (isLoadingData) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <>
            {stockInfo && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body1">Anda akan mengambil: <strong>{stockInfo.name}</strong></Typography>
                    <Typography variant="body2">Stok saat ini: <strong>{stockInfo.currentQty} {stockInfo.unit}</strong></Typography>
                </Alert>
            )}
            <FormComponent
                formConfig={formConfig}
                formData={formData}
                fieldErrors={fieldErrors}
                submitError={submitError}
                onFormChange={handleFormChange}
                onSubmit={handleSubmit}
                onCancel={() => router.back()}
                isSubmitting={isSubmitting}
                submitButtonText="Simpan Pengambilan"
            />
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
}

/**
 * Halaman utama untuk mencatat pengambilan stok.
 * Membungkus form dengan Suspense untuk menangani `useSearchParams`.
 */
export default function ConsumableUsagePage() {
    return (
        <>
            <Typography variant="h4" sx={{ mb: 2 }}>Ambil/Gunakan Stok Barang</Typography>
            <Suspense fallback={
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                    <CircularProgress />
                </Box>
            }>
                <UsageForm />
            </Suspense>
        </>
    );
}
