"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: any) {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "include", // 👈 si usás cookie httpOnly
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Credenciales incorrectas");
      return;
    }

    // 🟩 GUARDAR TOKEN + ROL EN LOCALSTORAGE (CLAVE PARA /admin)
    if (data.token) {
      localStorage.setItem("token", data.token);
    }

    if (data.role) {
      localStorage.setItem("role", data.role);
    }

    // 🔥 Redirección según rol
    if (data.role === "ADMIN") {
      window.location.href = "/admin";
    } else {
      window.location.href = "/user";
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-center">Iniciar Sesión</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="border p-2 w-full rounded"
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Contraseña"
            className="border p-2 w-full rounded"
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <p className="text-red-500 text-center">{error}</p>
          )}

          <button className="bg-blue-600 text-white p-2 w-full rounded">
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
}
