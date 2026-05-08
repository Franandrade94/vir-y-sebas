import "./admin.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin · Vir y Seba",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }) {
  return children;
}
