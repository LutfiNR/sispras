"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";

import { Box, CircularProgress, Snackbar, Alert, Typography, TextField, IconButton, Button } from "@mui/material";
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import FormComponent from "@/components/dashboard/FormComponent";

// Asumsi fungsi ini ada di /services/assetServices.js di frontend
import { getAssetById, updateAssetById } from "@/services/assetServices";

export default function EditAssetPage() {
  const router = useRouter();
  const params = useParams();
  const assetId = params.id;

  // State untuk data yang bisa diedit
  const [formData, setFormData] = useState({
    condition: "Baik",
    purchased_year: "", // Sesuai skema Mongoose Anda
    estimated_price: "",
    attributes:{}
  });
  
  // State terpisah untuk data yang hanya ditampilkan (read-only)
  const [displayData, setDisplayData] = useState({}); 
  const [attributes, setAttributes] = useState([{ key: '', value: '' }]);
  const [measurementUnit, setMeasurementUnit] = useState('');
  
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!assetId) return;
    const fetchAssetData = async () => {
      setIsLoadingData(true);
      try {
        const response = await getAssetById(assetId);
        const asset = response.data;
        
        // Pisahkan data: mana yang untuk ditampilkan, mana yang untuk diedit
        setDisplayData({
          serial_number: asset.serial_number,
          productName: `${asset.product.name} - ${asset.product.brand?.name || ''}`,
          locationName: `Gd. ${asset.location.building} - Lt. ${asset.location.floor} - R. ${asset.location.name}`,
        });
        
        setFormData({
          condition: asset.condition,
          purchased_year: asset.purchased_year || "",
          estimated_price: asset.estimated_price || "",
          attributes:{}
        });

        // Inisialisasi atribut dari data yang ada
        if (asset.attributes && Object.keys(asset.attributes).length > 0) {
            setAttributes(Object.entries(asset.attributes).map(([key, value]) => ({ key, value })));
        } else {
            setAttributes([{ key: '', value: '' }]);
        }
        
        setMeasurementUnit(asset.product.measurement_unit);

      } catch (error) {
        setSnackbar({ open: true, message: "Gagal memuat data aset.", severity: "error" });
        router.push("/dashboard/inventaris-tetap/aset");
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchAssetData();
  }, [assetId, router]);

  // Konfigurasi form dengan beberapa field yang dinonaktifkan
  const formConfig = useMemo(() => [
    { name: "serial_number", label: "Nomor Seri", type: "text", disabled: true },
    { name: "productName", label: "Produk", type: "text", disabled: true },
    { name: "locationName", label: "Lokasi", type: "text", disabled: true },
    {
    name: "condition",
      label: "Kondisi",
      type: "select",
      options: [
        { value: "Baik", label: "Baik" },
        { value: "Kurang Baik", label: "Kurang Baik" },
        { value: "Rusak", label: "Rusak" },
      ],
      required: true,
    },
    { name: "purchased_year", label: "Tahun Perolehan", type: "text" },
    { name: "estimated_price", label: "Perkiraan Harga (Rp)", type: "number" },
  ], []);

  const handleFormChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleAttributeChange = (index, field, value) => {
    const newAttributes = [...attributes];
    newAttributes[index][field] = value;
    setAttributes(newAttributes);
  };

  const addAttributeRow = () => setAttributes([...attributes, { key: '', value: '' }]);
  const removeAttributeRow = (index) => {
    if (attributes.length > 1) setAttributes(attributes.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setFieldErrors({});

    const attributesObject = attributes.reduce((acc, attr) => {
        if (attr.key.trim()) acc[attr.key.trim()] = attr.value;
        return acc;
    }, {});
    
    // Kirim hanya data yang boleh diubah
    const payload = { ...formData, attributes: attributesObject };

    try {
      await updateAssetById(assetId, payload);
      setSnackbar({ open: true, message: "Aset berhasil diperbarui!", severity: "success" });
      setTimeout(() => router.push("/dashboard/inventaris-tetap/aset"), 1500);
    } catch (err) {
      setSnackbar({ open: true, message: err.message || "Gagal memperbarui data.", severity: "error" });
      if (err.errors) setFieldErrors(err.errors);
      setIsSubmitting(false);
    }
  };

  if (isLoadingData) {
    return <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}><CircularProgress /></Box>;
  }

  return (
    <>
      <FormComponent
        title="Edit Aset"
        formConfig={formConfig}
        // Gabungkan data display dan data form untuk ditampilkan
        formData={{ ...displayData, ...formData }}
        fieldErrors={fieldErrors}
        onFormChange={handleFormChange}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        isSubmitting={isSubmitting}
        submitButtonText="Simpan Perubahan"
      >
        {measurementUnit === 'Meter' && (
          <Box mt={3} p={2} border={1} borderColor="grey.300" borderRadius={1}>
            <Typography variant="h6" gutterBottom>Atribut Tambahan</Typography>
            {attributes.map((attr, index) => (
              <Box display="flex" gap={2} key={index} mb={2}>
                <TextField label="Nama Atribut" value={attr.key} onChange={(e) => handleAttributeChange(index, 'key', e.target.value)} fullWidth />
                <TextField label="Nilai Atribut" value={attr.value} onChange={(e) => handleAttributeChange(index, 'value', e.target.value)} fullWidth />
                <IconButton onClick={() => removeAttributeRow(index)} disabled={attributes.length <= 1}>
                  <RemoveCircleOutlineIcon color={attributes.length <= 1 ? 'disabled' : 'error'} />
                </IconButton>
              </Box>
            ))}
            <Button startIcon={<AddCircleOutlineIcon />} onClick={addAttributeRow}>Tambah Atribut</Button>
          </Box>
        )}
      </FormComponent>
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(p => ({...p, open: false}))}>
        <Alert onClose={() => setSnackbar(p => ({...p, open: false}))} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
