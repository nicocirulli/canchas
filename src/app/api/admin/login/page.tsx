"use client";

import { useState } from "react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: any) {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      setError("Credenciales inválidas");
      return;
    }

    const data = await res.json();

    if (data.role === "ADMIN") {
      window.location.href = "/admin"; // Panel admin
    } else {
      window.location.href = "/user"; // Por si algún user entra acá
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
        <h1 className="text-xl font-bold mb-4">Acceso Administrador</h1>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            className="border p-2 w-full mb-3"
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Contraseña"
            className="border p-2 w-full mb-3"
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className="text-red-500">{error}</p>}

          <button className="bg-blue-600 text-white p-2 w-full rounded">
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
}
