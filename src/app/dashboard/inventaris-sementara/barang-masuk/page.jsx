"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

// Komponen MUI
import { Box, CircularProgress, Snackbar, Alert, Typography } from '@mui/material';

// Komponen Kustom & Service
import FormComponent from '@/components/dashboard/FormComponent';
import { recordRestock, getAllConsumableProductsForDropdown } from '@/services/consumableServices';
import { useDropdownData } from '@/lib/hooks/useDropdownData';

const productFormatter = (item) => ({
    value: item._id,
    label: `${item.name} (${item.product_code})`,
    unit: item.measurement_unit, // Asumsi model produk memiliki 'measurement_unit'
});
/**
 * Halaman untuk mencatat penambahan stok barang habis pakai (Restock).
 */
export default function ConsumableRestockPage() {
    const router = useRouter();

    // --- STATE MANAGEMENT ---
    const [formData, setFormData] = useState({
        productId: '',
        quantityAdded: 1,
        person_name: '',
        person_role: '',
        notes: '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [submitError, setSubmitError] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });



    const { options: productOptions, loading: isLoadingProducts } = useDropdownData(getAllConsumableProductsForDropdown, productFormatter);

    // --- KONFIGURASI FORM ---
    const formConfig = useMemo(() => [
        { name: 'person_name', label: 'Nama Penambah Stok', type: 'text', required: true },
        { name: 'person_role', label: 'Jabatan (Opsional)', type: 'text' },
        {
            name: 'productId',
            label: 'Produk',
            type: 'autocomplete',
            options: productOptions,
            loading: isLoadingProducts,
            required: true
        },
        {
            name: 'quantityAdded',
            label: 'Jumlah Masuk',
            type: 'number',
            required: true,
            halfWidth: true,
            inputProps: { min: 1 },
        },
        { name: 'notes', label: 'Catatan (Opsional)', type: 'textarea', rows: 4 },
    ], [productOptions, isLoadingProducts]);

    // --- EVENT HANDLERS ---
    const handleFormChange = (name, value) => {
        let newFormData = { ...formData, [name]: value };

        setFormData(newFormData);

        if (fieldErrors[name]) {
            setFieldErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setFieldErrors({});
        setSubmitError(null);

        try {
            const payload = {
                ...formData,
                quantityAdded: parseInt(formData.quantityAdded, 10),
            };
            await recordRestock(payload);

            setSnackbar({ open: true, message: 'Stok berhasil ditambahkan!', severity: 'success' });

            setTimeout(() => {
                router.push('/dashboard/inventaris-sementara');
            }, 1500);

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

    if (isLoadingProducts) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <>
            <Typography variant="h4" sx={{ mb: 2 }}>Barang Masuk (Restock)</Typography>
            <FormComponent
                formConfig={formConfig}
                formData={formData}
                fieldErrors={fieldErrors}
                submitError={submitError}
                onFormChange={handleFormChange}
                onSubmit={handleSubmit}
                onCancel={() => router.back()}
                isSubmitting={isSubmitting}
                submitButtonText="Simpan Stok Masuk"
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
