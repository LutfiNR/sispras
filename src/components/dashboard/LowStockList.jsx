"use client";

import { Fragment } from "react";
import { useRouter } from "next/navigation";

// Komponen MUI
import {
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemText,
  Typography,
  Divider,
  Button,
  Box
} from "@mui/material";

/**
 * Komponen Card untuk menampilkan daftar item dengan stok yang menipis.
 * @param {object} props
 * @param {Array<object>} props.items - Array berisi item stok yang rendah.
 */
const LowStockList = ({ items }) => {
  const router = useRouter();

  // Handler untuk mengarahkan ke halaman stok dengan filter stok rendah
  const handleViewAll = () => {
    router.push('/dashboard/inventaris-sementara/stok?low_stock=true');
  };

  return (
    <Card variant="outlined" sx={{ p: 1 }}>
      <CardHeader
        title="Stok Persediaan Menipis"
        action={
          <Button size="small" onClick={handleViewAll}>
            Lihat Semua
          </Button>
        }
      />
      <CardContent sx={{ pt: 0 }}>
        {(!items || items.length === 0) ? (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
            Tidak ada stok yang menipis saat ini.
          </Typography>
        ) : (
          <List disablePadding>
            {items.map((item, index) => (
              <Fragment key={item._id || index}>
                <ListItem disablePadding sx={{ py: 1 }}>
                  <ListItemText
                    // PERBAIKAN: Mengakses nama produk dari objek yang di-populate
                    primary={item.product?.name || 'Produk tidak diketahui'}
                    secondary={`Batas minimum: ${item.reorder_point || 0} ${item.unit || ''}`}
                  />
                  <Typography variant="body1" color="error.main" fontWeight="bold">
                    {/* PERBAIKAN: Menampilkan kuantitas beserta satuan */}
                    {`${item.quantity} ${item.unit || ''}`}
                  </Typography>
                </ListItem>
                {index < items.length - 1 && <Divider component="li" />}
              </Fragment>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

export default LowStockList;
