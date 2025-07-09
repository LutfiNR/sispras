"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

// Import komponen dari MUI
import { Snackbar, Alert, Box, Typography, TextField, IconButton, Button } from "@mui/material";
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import FormComponent from "@/components/dashboard/FormComponent";

// Import service untuk membuat aset dan mendapatkan data dropdown
// import { createAsset } from "@/services/assetServices"; // Asumsi ada service createAsset
import { getAllProductsForDropdown } from "@/services/productServices";
import { getAllLocationsForDropdown } from "@/services/locationServices";

// Import custom hook untuk data dropdown
import { useDropdownData } from "@/lib/hooks/useDropdownData";
import { createAssets } from "@/services/assetServices";

const productFormatter = (item) => ({
  value: item._id,
  label: `${item.name} - ${item.brand?.name || "Tanpa Merk"}`,
  ...item, // Sertakan seluruh data asli
});

const locationFormatter = (item) => ({
  value: item._id,
  label: `Gd. ${item.building} - Lt. ${item.floor} - R. ${item.name}`,
  ...item,
});
/**
 * Halaman untuk menambah data aset baru.
 */
export default function AddAssetPage() {
  const router = useRouter();


  // --- Panggil hook dengan formatter ---
  const { options: productOptions, loading: isLoadingProducts } =
    useDropdownData(getAllProductsForDropdown, productFormatter);
  const { options: locationOptions, loading: isLoadingLocations } =
    useDropdownData(getAllLocationsForDropdown, locationFormatter);

  // --- STATE MANAGEMENT ---
  const [formData, setFormData] = useState({
    product: "",
    location: "",
    quantity: 1,
    condition: "Baik",
    purchased_year: "",
    estimated_price: "",
  });
  const [attributes, setAttributes] = useState([{ key: "", value: "" }]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // --- KONFIGURASI FORM ---
  const formConfig = [
    {
      name: "product",
      label: "Produk",
      type: "autocomplete",
      options: productOptions,
      loading: isLoadingProducts,
      required: true,
    },
    {
      name: "location",
      label: "Lokasi",
      type: "autocomplete",
      options: locationOptions,
      loading: isLoadingLocations,
      required: true,
    },
    {
      name: "quantity",
      label: "Jumlah",
      type: "number",
      min: 1,
      defaultValue: 1,
      errorMessage: "Jumlah harus minimal 1.",
      required: true,
    },
    { name: "purchased_year", label: "Tahun Perolehan", type: "text" },
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
    { name: "estimated_price", label: "Estimasi Harga (Rp)", type: "number" },
  ];

  const handleFormChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (name === "product") {
      const productData = productOptions.find((p) => p.value === value);
      setSelectedProduct(productData || null);
      setAttributes([{ key: "", value: "" }]);
    }
  };

  const handleAttributeChange = (index, field, value) => {
    const newAttributes = [...attributes];
    newAttributes[index][field] = value;
    setAttributes(newAttributes);
  };

  const addAttributeRow = () =>
    setAttributes([...attributes, { key: "", value: "" }]);
  const removeAttributeRow = (index) => {
    if (attributes.length > 1) {
      setAttributes(attributes.filter((_, i) => i !== index));
    }
  };

  // --- HANDLER UNTUK SUBMIT FORM ---
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    setFieldErrors({});

    const attributesObject = attributes.reduce((acc, attr) => {
      if (attr.key.trim()) {
        acc[attr.key.trim()] = attr.value;
      }
      return acc;
    }, {});

    const payload = {
      ...formData,
      quantity: parseInt(formData.quantity),
      estimated_price: parseFloat(formData.estimated_price,10),
      // Hanya tambahkan atribut jika tidak kosong
      ...(Object.keys(attributesObject).length > 0 && {
        attributes: attributesObject,
      }),
    };

    try {
      // Panggil service createAsset, bukan update
      await createAssets(payload);

      setSnackbar({
        open: true,
        message: "Aset berhasil ditambahkan!",
        severity: "success",
      });
      setTimeout(() => {
        router.push("/dashboard/inventaris-tetap/aset");
      }, 1500);
    } catch (err) {
      const errorMessage = err.message || "Gagal menambahkan data.";
      setSnackbar({ open: true, message: errorMessage, severity: "error" });
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
    if (reason === "clickaway") return;
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return (
    <>
      <FormComponent
        title="Tambah Aset Baru"
        formConfig={formConfig}
        formData={formData}
        fieldErrors={fieldErrors}
        submitError={submitError}
        onFormChange={handleFormChange}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
        submitButtonText="Simpan"
      >
        {selectedProduct?.measurement_unit === "Meter" && (
          <Box mt={3} p={2} border={1} borderColor="grey.300" borderRadius={1}>
            <Typography variant="h6" gutterBottom>
              Atribut Tambahan
            </Typography>
            {attributes.map((attr, index) => (
              <Box display="flex" gap={2} key={index} mb={2}>
                <TextField
                  label="Nama Atribut (cth: panjang)"
                  value={attr.key}
                  onChange={(e) =>
                    handleAttributeChange(index, "key", e.target.value)
                  }
                  fullWidth
                />
                <TextField
                  label="Nilai Atribut (cth: 5.5)"
                  value={attr.value}
                  onChange={(e) =>
                    handleAttributeChange(index, "value", e.target.value)
                  }
                  fullWidth
                />
                <IconButton
                  onClick={() => removeAttributeRow(index)}
                  disabled={attributes.length <= 1}
                >
                  <RemoveCircleOutlineIcon
                    color={attributes.length <= 1 ? "disabled" : "error"}
                  />
                </IconButton>
              </Box>
            ))}
            <Button
              startIcon={<AddCircleOutlineIcon />}
              onClick={addAttributeRow}
            >
              Tambah Atribut
            </Button>
          </Box>
        )}
      </FormComponent>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
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
    </>
  );
}
