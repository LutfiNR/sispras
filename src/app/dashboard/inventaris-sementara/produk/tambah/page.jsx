"use client";

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

// Komponen MUI
import { Snackbar, Alert, Box, CircularProgress } from '@mui/material';

// Komponen Kustom & Service
import FormComponent from '@/components/dashboard/FormComponent';
import { createConsumableProduct } from '@/services/consumableServices';
import { getAllCategoriesForDropdown } from '@/services/consumableServices';
import { useDropdownData } from '@/lib/hooks/useDropdownData';

/**
 * Halaman untuk menambahkan data produk habis pakai baru.
 */
export default function TambahConsumableProductPage() {
    const router = useRouter();
    
    // --- STATE MANAGEMENT ---
    const [formData, setFormData] = useState({
        product_code: '',
        name: '',
        category: '',
    });
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

    // --- KONFIGURASI FORM ---
    const formConfig = useMemo(() => [
        { name: 'product_code', label: 'Kode Produk', type: 'text', required: true },
        { name: 'name', label: 'Nama Produk', type: 'text', required: true },
        { 
            name: 'category', 
            label: 'Kategori', 
            type: 'autocomplete', // Menggunakan autocomplete untuk konsistensi
            options: categoryOptions, 
            loading: isLoadingCategories,
            required: true 
        },
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
        
        try {
            await createConsumableProduct(formData);
            
            setSnackbar({
                open: true,
                message: "Produk habis pakai baru berhasil ditambahkan!",
                severity: "success",
            });
            
            setTimeout(() => {
                router.push('/dashboard/inventaris-sementara/produk'); // Sesuaikan rute
            }, 1500);

        } catch (err) {
            const errorMessage = err.message || "Terjadi kesalahan yang tidak diketahui.";
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

    // Tampilkan loading spinner jika data dropdown belum siap
    if (isLoadingCategories) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                <CircularProgress />
            </Box>
        );
    }
    
    return (
        <>
            <FormComponent
                title="Tambah Produk Habis Pakai"
                formConfig={formConfig}
                formData={formData}
                fieldErrors={fieldErrors}
                submitError={submitError}
                onFormChange={handleFormChange}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                isSubmitting={isSubmitting}
                submitButtonText="Simpan Produk"
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
