"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

// Komponen MUI
import { Snackbar, Alert, Box, CircularProgress } from '@mui/material';

// Komponen Kustom & Service
import FormComponent from '@/components/dashboard/FormComponent';
import { getCategoryById, updateCategoryById } from '@/services/categoryServices'; // Pastikan path service benar

/**
 * Halaman untuk mengedit data kategori berdasarkan ID.
 */
export default function EditKategoriPage() {
    const router = useRouter();
    const params = useParams();
    const categoryId = params.id;

    // --- STATE MANAGEMENT ---
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [submitError, setSubmitError] = useState(null);

    // State untuk Snackbar
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success",
    });

    // --- MENGAMBIL DATA AWAL ---
    useEffect(() => {
        if (!categoryId) return;
        const fetchData = async () => {
            setIsLoadingData(true);
            try {
                const response = await getCategoryById(categoryId);
                setFormData({
                    name: response.data.name || '',
                    description: response.data.description || '',
                });
            } catch (err) {
                setSnackbar({
                    open: true,
                    message: "Gagal memuat data kategori. Mungkin tidak ditemukan.",
                    severity: "error",
                });
                router.push('/dashboard/inventaris-sementara/kategori'); // Sesuaikan rute
            } finally {
                setIsLoadingData(false);
            }
        };
        fetchData();
    }, [categoryId, router]);

    // --- KONFIGURASI FORM ---
    const formConfig = [
        { name: 'name', label: 'Nama Kategori', type: 'text', required: true },
        { name: 'description', label: 'Deskripsi (Opsional)', type: 'textarea', rows: 4 },
    ];

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
            await updateCategoryById(categoryId, formData);
            
            setSnackbar({
                open: true,
                message: "Kategori berhasil diperbarui!",
                severity: "success",
            });
            
            setTimeout(() => {
                router.push('/dashboard/inventaris-sementara/kategori'); // Sesuaikan rute
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

    if (isLoadingData) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <>
            <FormComponent
                title={`Edit Kategori: ${formData.name}`}
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
