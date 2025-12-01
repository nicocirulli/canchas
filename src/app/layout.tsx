import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NICO Canchas | Reserva tu Turno",
  description: "El mejor predio de la zona. Fútbol y Pádel.",
  icons: {
    icon: "https://fav.farm/⚽", 
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-slate-100 min-h-screen`}>
        {children}
      </body>
    </html>
  );
}