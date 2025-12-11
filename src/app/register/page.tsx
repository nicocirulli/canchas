"use client";

import { useState } from "react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: any) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Error al crear la cuenta");
    } else {
      setSuccess("Cuenta creada correctamente. Ya podés iniciar sesión.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-center">Crear Cuenta</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="border p-2 w-full rounded"
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Contraseña"
            className="border p-2 w-full rounded"
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className="text-red-500 text-center">{error}</p>}
          {success && (
            <p className="text-green-600 text-center">{success}</p>
          )}

          <button className="bg-green-600 text-white p-2 w-full rounded">
            Registrarse
          </button>
        </form>

        <p className="mt-4 text-sm text-center text-gray-600">
          ¿Ya tenés cuenta?{" "}
          <a href="/login" className="text-blue-600 font-bold">
            Iniciar Sesión
          </a>
        </p>
      </div>
    </div>
  );
}
