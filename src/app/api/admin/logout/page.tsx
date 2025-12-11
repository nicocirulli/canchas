"use client";

import { useEffect } from "react";

export default function LogoutPage() {
  useEffect(() => {
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    window.location.href = "/admin/login";
  }, []);

  return <p>Cerrando sesión...</p>;
}
