"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

// Komponen MUI
import { Snackbar, Alert } from '@mui/material';

// Komponen Kustom & Service
import FormComponent from '@/components/dashboard/FormComponent';
import { createCategory } from '@/services/categoryServices'; // Pastikan path service benar

/**
 * Halaman untuk menambahkan data kategori baru.
 */
export default function TambahKategoriPage() {
    const router = useRouter();
    
    // --- STATE MANAGEMENT ---
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [submitError, setSubmitError] = useState(null); // State untuk error umum

    // State untuk Snackbar, disesuaikan agar konsisten
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success",
    });

    // --- KONFIGURASI FORM ---
    const formConfig = [
        { name: 'name', label: 'Nama Kategori', type: 'text', required: true },
        { name: 'description', label: 'Deskripsi (Opsional)', type: 'textarea', rows: 4 },
    ];

    // --- EVENT HANDLERS ---
    const handleFormChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        // Hapus error untuk field yang sedang diubah
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({...prev, [name]: undefined}));
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setFieldErrors({});
        setSubmitError(null);
        
        try {
            await createCategory(formData);
            
            // Tampilkan notifikasi sukses
            setSnackbar({
                open: true,
                message: "Kategori baru berhasil ditambahkan!",
                severity: "success",
            });
            
            // Arahkan kembali ke halaman daftar setelah jeda
            setTimeout(() => {
                router.push('/dashboard/inventaris-sementara/kategori'); // Sesuaikan dengan rute Anda
            }, 1500);

        } catch (err) {
            const errorMessage = err.message || "Terjadi kesalahan yang tidak diketahui.";
            setSnackbar({ open: true, message: errorMessage, severity: 'error' });
            
            if (err.errors) {
                setFieldErrors(err.errors);
            } else {
                setSubmitError(errorMessage); // Simpan error umum jika ada
            }
            setIsSubmitting(false); // Hentikan submit hanya jika ada error
        }
    };

    const handleCancel = () => {
        router.back();
    };

    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    return (
        <>
            <FormComponent
                title="Tambah Kategori Baru"
                formConfig={formConfig}
                formData={formData}
                fieldErrors={fieldErrors}
                submitError={submitError} // Kirim error umum ke FormComponent
                onFormChange={handleFormChange}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                isSubmitting={isSubmitting}
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
