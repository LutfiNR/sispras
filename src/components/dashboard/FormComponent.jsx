"use client";

import * as React from "react";
import {
  Box,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Paper,
  Typography,
  FormHelperText,
  Autocomplete,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

/**
 * Komponen form dinamis yang dapat menampilkan error validasi per field.
 * @param {array} formConfig - Konfigurasi untuk setiap field di form.
 * @param {object} formData - State yang menyimpan nilai dari setiap field.
 * @param {object} errors - Objek yang berisi pesan error untuk setiap field.
 * @param {function} onFormChange - Handler untuk memperbarui state.
 * @param {function} onSubmit - Handler saat tombol 'Simpan' ditekan.
 * @param {function} onCancel - Handler saat tombol 'Batal' ditekan.
 * @param {boolean} isSubmitting - Status apakah form sedang dalam proses pengiriman.
 * @param {string} title - Judul yang ditampilkan di atas form.
 */
export default function FormComponent({
  formConfig,
  formData,
  errors = {},
  onFormChange,
  onSubmit,
  onCancel,
  isSubmitting = false, // Tambahkan prop isSubmitting
  title,
  children,
}) {
  // ... (handler dan renderInputField tetap sama)

  const handleInputChange = (event) => {
    onFormChange(event.target.name, event.target.value);
  };

  const handleDateChange = (name, newValue) => {
    onFormChange(name, newValue);
  };

  const renderInputField = (fieldConfig) => {
    const {
      name,
      label,
      type,
      options = [],
      required = false,
      rows = 1,
      loading,
      disabled = false
    } = fieldConfig;
    const value = formData[name] || "";
    const hasError = !!errors[name];
    const errorMessage = Array.isArray(errors[name])
      ? errors[name][0]
      : errors[name] || "";

    switch (type) {
      case "autocomplete": // Atau ganti case 'select' Anda
        // Temukan objek opsi yang lengkap berdasarkan nilai saat ini, karena Autocomplete bekerja dengan objek.
        const selectedOption =
          options.find((option) => option.value === value) || null;

        return (
          <Autocomplete
            // Opsi-opsi yang akan ditampilkan di dropdown
            disabled={disabled}
            options={options}
            loading={loading}
            // Memberitahu Autocomplete cara mendapatkan label dari setiap objek opsi
            getOptionLabel={(option) => option.label || ""}
            // Memberitahu Autocomplete cara membandingkan opsi dengan nilai
            isOptionEqualToValue={(option, value) =>
              option.value === value.value
            }
            // Nilai saat ini (harus berupa objek opsi atau null)
            value={selectedOption}
            // Handler saat pengguna memilih opsi baru
            onChange={(event, newValue) => {
              // Kita sesuaikan agar 'handleInputChange' menerima format yang sama seperti input biasa
              const syntheticEvent = {
                target: {
                  name: name,
                  value: newValue ? newValue.value : "", // Ambil hanya 'value' dari objek opsi
                },
              };
              handleInputChange(syntheticEvent);
            }}
            // Fungsi untuk merender input field (TextField)
            renderInput={(params) => (
              <TextField
                {...params}
                label={label}
                required={required}
                error={hasError}
                helperText={hasError ? errorMessage : ""}
              />
            )}
          />
        );
      case "select":
        return (
          <FormControl fullWidth required={required} error={hasError}>
            <InputLabel>{label}</InputLabel>
            <Select
              disabled={disabled}

              name={name}
              value={value}
              label={label}
              onChange={handleInputChange}
            >
              {options.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {hasError && <FormHelperText>{errorMessage}</FormHelperText>}
          </FormControl>
        );

      case "textarea":
      case "number":
      case "text":
      default:
        return (
          <TextField
            disabled={disabled}

            fullWidth
            required={required}
            type={type === "number" ? "number" : "text"}
            multiline={type === "textarea"}
            rows={type === "textarea" ? (rows > 1 ? rows : 4) : undefined}
            name={name}
            label={label}
            value={value}
            onChange={handleInputChange}
            error={hasError}
            helperText={errorMessage}
          />
        );

      case "date":
        return (
          <DatePicker
            disabled={disabled}

            label={label}
            value={value ? new Date(value) : null} // Pastikan value adalah objek Date atau null
            onChange={(newValue) => handleDateChange(name, newValue)}
            slotProps={{
              textField: {
                fullWidth: true,
                required: required,
                error: hasError,
                helperText: errorMessage,
              },
            }}
          />
        );
    }
  };

  return (
    <Paper
      component="form"
      sx={{ p: { xs: 2, sm: 3 }, display: "flex", flexDirection: "column" }}
      variant="outlined"
    >
      {title && (
        <Typography variant="h6" component="h2" gutterBottom sx={{ mb: 2 }}>
          {title}
        </Typography>
      )}
      <Box display="flex" flexDirection="column" justifyContent="center" mb={2}>
        {formConfig.map((field) => (
          <Box key={field.name} sx={{ mb: 2 }}>
            {renderInputField(field)}
          </Box>
        ))}
        {children}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Box
            sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 2 }}
          >
            <Button
              variant="outlined"
              color="error"
              sx={{ px: 4 }}
              onClick={onCancel}
            >
              Batal
            </Button>
            <Button
              variant="contained"
              onClick={onSubmit}
              sx={{ px: 4 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}
