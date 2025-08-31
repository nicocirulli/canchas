"use client";

import { useEffect, useState } from "react";

type Turno = {
  id: number;
  nombre: string;
  fecha: string; // ISO
  creadoEn?: string;
};

export default function Home() {
  const [nombre, setNombre] = useState("");
  const [fecha, setFecha] = useState("");
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  function toast(type: "ok" | "err", text: string) {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 2500);
  }

  async function cargarTurnos() {
    const res = await fetch("/api/turnos", { cache: "no-store" });
    const data = await res.json();
    setTurnos(data);
  }

  useEffect(() => {
    cargarTurnos();
  }, []);

  // Validaciones frontend
  function valida() {
    if (!nombre.trim()) return "Ingresá un nombre";
    if (!fecha) return "Elegí fecha y hora";
    const f = new Date(fecha);
    if (Number.isNaN(f.getTime())) return "Fecha inválida";
    if (f.getTime() < Date.now() - 60_000) return "No se permiten fechas pasadas";
    return null;
  }

  async function crearTurno(e: React.FormEvent) {
    e.preventDefault();
    const error = valida();
    if (error) return toast("err", error);

    setLoading(true);
    try {
      const res = await fetch("/api/turnos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nombre.trim(), fecha }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error ?? "Error guardando turno");
      }
      setNombre("");
      setFecha("");
      await cargarTurnos();
      toast("ok", "Turno creado ✅");
    } catch (e: any) {
      toast("err", e.message ?? "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function borrarTurno(id: number) {
    const ok = confirm("¿Eliminar este turno?");
    if (!ok) return;
    try {
      const res = await fetch(`/api/turnos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("No se pudo borrar");
      setTurnos((prev) => prev.filter((t) => t.id !== id));
      toast("ok", "Turno eliminado 🗑️");
    } catch (e: any) {
      toast("err", e.message ?? "Error eliminando");
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center p-8">
      <div className="w-full max-w-xl relative">
        {/* Toast */}
        {msg && (
          <div
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 rounded-lg px-4 py-2 shadow text-white
            ${msg.type === "ok" ? "bg-green-600" : "bg-red-600"}`}
          >
            {msg.text}
          </div>
        )}

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
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="datetime-local"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 rounded-lg font-medium text-white
              ${loading ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"}`}
          >
            {loading ? "Guardando..." : "Crear turno"}
          </button>
        </form>

        {/* Lista */}
        <ul className="bg-white rounded-xl shadow-md divide-y">
          {turnos.length === 0 && (
            <li className="p-4 text-gray-400 text-center">No hay turnos aún</li>
          )}
          {turnos.map((t) => (
            <li key={t.id} className="p-4 flex items-center justify-between gap-4">
              <div>
                <div className="font-semibold">{t.nombre}</div>
                <div className="text-gray-500">
                  {new Date(t.fecha).toLocaleString("es-AR")}
                </div>
              </div>
              <button
                onClick={() => borrarTurno(t.id)}
                className="text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-md"
              >
                Borrar
              </button>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
