import "./globals.css";
import { Figtree } from "next/font/google";

const font = Figtree({ subsets: ["latin"], display: "swap" });

export const metadata = {
  title: "Student Placement Management System",
  description: "Manage students, companies, drives, eligibility and placement results.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={font.className}>{children}</body>
    </html>
  );
}
