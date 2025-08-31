"use client";

import { useState } from "react";

export default function Home() {
  const [nombre, setNombre] = useState("");
  const [fecha, setFecha] = useState("");
  const [turnos, setTurnos] = useState<any[]>([]);

  async function cargarTurnos() {
    const res = await fetch("/api/turnos");
    setTurnos(await res.json());
  }

  async function crearTurno(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/turnos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, fecha }),
    });
    setNombre("");
    setFecha("");
    cargarTurnos();
  }

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center p-8">
      <div className="w-full max-w-xl">
        <h1 className="text-3xl font-bold mb-6 text-center">📅 Turnos</h1>

        {/* Formulario */}
        <form
          onSubmit={crearTurno}
          className="bg-white rounded-xl shadow-md p-6 flex flex-col gap-4 mb-6"
        >
          <input
            type="text"
            placeholder="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="datetime-local"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            required
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            Crear turno
          </button>
        </form>

        {/* Botón cargar */}
        <button
          onClick={cargarTurnos}
          className="mb-6 w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
        >
          🔄 Cargar turnos
        </button>

        {/* Lista de turnos */}
        <ul className="bg-white rounded-xl shadow-md divide-y">
          {turnos.length === 0 && (
            <li className="p-4 text-gray-400 text-center">No hay turnos aún</li>
          )}
          {turnos.map((t) => (
            <li key={t.id} className="p-4 flex justify-between">
              <span className="font-medium">{t.nombre}</span>
              <span className="text-gray-500">
                {new Date(t.fecha).toLocaleString("es-AR")}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
