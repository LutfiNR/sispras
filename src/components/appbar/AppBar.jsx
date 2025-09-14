import Image from "next/image";

import DashboardIcon from "@mui/icons-material/Dashboard";
import InventoryIcon from "@mui/icons-material/Inventory";
import DoorBackIcon from '@mui/icons-material/DoorBack';
import ViewStreamIcon from '@mui/icons-material/ViewStream';
import TurnedInIcon from '@mui/icons-material/TurnedIn';
import TableChartIcon from '@mui/icons-material/TableChart';
import HistoryIcon from "@mui/icons-material/History";
import CategoryIcon from '@mui/icons-material/Category';
import AssessmentIcon from '@mui/icons-material/Assessment';



export const NAVIGATION = [
  {
    kind: "header",
    title: "Beranda",
  },
  {
    segment: "dashboard",
    title: "Beranda",
    icon: <DashboardIcon />,
  },
  {
    kind: "divider",
  },
  {
    kind: "header",
    title: "Inventaris Tetap",
  },
  {
    segment: "dashboard/inventaris-tetap",
    title: "Overview",
    icon: <TableChartIcon />,
  },
  {
    segment: "dashboard/inventaris-tetap/aset",
    title: "Aset",
    icon: <InventoryIcon />,
  },
  {
    segment: "dashboard/inventaris-tetap/produk",
    title: "Produk",
    icon: <ViewStreamIcon />,
  },
  {
    segment: "dashboard/inventaris-tetap/ruangan",
    title: "Ruangan",
    icon: <DoorBackIcon />,
  },
  {
    segment: "dashboard/inventaris-tetap/merk",
    title: "Merk",
    icon: <TurnedInIcon />,
  },
  {
    kind: "divider",
  },
  {
    kind: "header",
    title: "Inventaris Sementara",
  },
  {
    segment: "dashboard/inventaris-sementara",
    title: "Stok",
    icon: <InventoryIcon />,
  },
  {
    segment: "dashboard/inventaris-sementara/riwayat",
    title: "Riwayat",
    icon: <HistoryIcon />,
  },
  {
    segment: "dashboard/inventaris-sementara/produk",
    title: "Produk",
    icon: <ViewStreamIcon />,
  },
  {
    segment: "dashboard/inventaris-sementara/kategori",
    title: "Kategori",
    icon: <CategoryIcon />,
  },
  {
    segment: "dashboard/inventaris-sementara/laporan",
    title: "Laporan",
    icon: <AssessmentIcon />,
  },
];

export const BRAND = {
  logo: <Image src="/Logo.svg" alt="Sispras Logo" width={36} height={36} />,
  title: "Sispras",
  homeUrl: "/",
};
