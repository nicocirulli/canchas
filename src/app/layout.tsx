import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Turnos",
  description: "Demo Tailwind v4 + Next 15",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      {/* Fondo gris para comprobar que Tailwind aplica */}
      <body className="bg-gray-100">{children}</body>
    </html>
  );
}
