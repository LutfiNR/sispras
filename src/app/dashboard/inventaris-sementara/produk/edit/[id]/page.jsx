"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';

// Komponen MUI
import { Snackbar, Alert, Box, CircularProgress } from '@mui/material';

// Komponen Kustom & Service
import FormComponent from '@/components/dashboard/FormComponent';
import { getConsumableProductById, updateConsumableProductById } from '@/services/consumableServices';
import { getAllCategoriesForDropdown } from '@/services/categoryServices';
import { useDropdownData } from '@/lib/hooks/useDropdownData';

/**
 * Halaman untuk mengedit data produk habis pakai yang sudah ada.
 */
export default function EditConsumableProductPage() {
    const router = useRouter();
    const params = useParams();
    const productId = params.id;

    // --- STATE MANAGEMENT ---
    const [formData, setFormData] = useState({
        product_code: '',
        name: '',
        category: '',
        measurement_unit: '',
        reorder_point: '',
    });
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [submitError, setSubmitError] = useState(null);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success",
    });

    // --- PENGAMBILAN DATA DROPDOWN ---
    const { options: categoryOptions, loading: isLoadingCategories } = useDropdownData(getAllCategoriesForDropdown);

    // --- PENGAMBILAN DATA AWAL PRODUK ---
    useEffect(() => {
        if (!productId) return;

        const fetchInitialData = async () => {
            setIsLoadingData(true);
            try {
                const response = await getConsumableProductById(productId);
                const productData = response.data;

                setFormData({
                    product_code: productData.product_code || '',
                    name: productData.name || '',
                    category: productData.category?._id || '',
                    measurement_unit: productData.measurement_unit || '',
                    reorder_point: productData.reorder_point || '',
                });

            } catch (err) {
                setSnackbar({
                    open: true,
                    message: "Gagal memuat data produk. Mungkin tidak ditemukan.",
                    severity: "error",
                });
                router.push('/dashboard/inventaris-sementara/produk'); // Sesuaikan rute
            } finally {
                setIsLoadingData(false);
            }
        };

        fetchInitialData();
    }, [productId, router]);

    // --- KONFIGURASI FORM ---
    const formConfig = useMemo(() => [
        { name: 'product_code', label: 'Kode Produk', type: 'text', required: true },
        { name: 'name', label: 'Nama Produk', type: 'text', required: true },
        {
            name: 'category',
            label: 'Kategori',
            type: 'autocomplete',
            options: categoryOptions,
            loading: isLoadingCategories,
            required: true
        },
        { name: 'measurement_unit', label: 'Satuan Unit', type: 'text', required: true },
        { name: 'reorder_point', label: 'Jumlah Minimum Stock', type: 'number', required: true },
    ], [categoryOptions, isLoadingCategories]);

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

        const payload = {
            ...formData,
            reorder_point: parseInt(formData.reorder_point),
        };
        try {
            await updateConsumableProductById(productId, payload);

            setSnackbar({
                open: true,
                message: "Produk berhasil diperbarui!",
                severity: "success",
            });

            setTimeout(() => {
                router.push('/dashboard/inventaris-sementara/produk'); // Sesuaikan rute
            }, 1500);

        } catch (err) {
            const errorMessage = err.message || "Gagal memperbarui data.";
            setSnackbar({ open: true, message: errorMessage, severity: 'error' });

            if (err.errors) {
                setFieldErrors(err.errors);
            } else {
                setSubmitError(errorMessage);
            }
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        router.back();
    };

    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') return;
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    // Tampilkan loading spinner jika data awal atau dropdown belum siap
    if (isLoadingData || isLoadingCategories) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <>
            <FormComponent
                title={`Edit Produk: ${formData.name}`}
                formConfig={formConfig}
                formData={formData}
                fieldErrors={fieldErrors}
                submitError={submitError}
                onFormChange={handleFormChange}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                isSubmitting={isSubmitting}
                submitButtonText="Simpan Perubahan"
            />
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
}
