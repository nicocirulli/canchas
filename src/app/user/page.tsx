"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface TurnoData {
  id: number;
  horaInicio: string;
  horaFin: string;
  duracionMinutos: number;
  email: string;
  cancha: {
    nombre: string;
    tipo: "FUTBOL" | "PADEL";
  };
}

const CONTACT_PHONE_NUMBER = "+5491123456789";

const TZ = "America/Argentina/Buenos_Aires";

export default function UserReservasPage() {
  const [activos, setActivos] = useState<TurnoData[]>([]);
  const [pasados, setPasados] = useState<TurnoData[]>([]);
  const [tab, setTab] = useState<"activos" | "pasados">("activos");
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string>("");

  const router = useRouter();

  // ================= HELPERS =================

  const isCancellationWindowClosed = (iso: string) => {
    const inicioLocal = new Date(new Date(iso).toLocaleString("en-US", { timeZone: TZ }));
    const nowLocal = new Date(new Date().toLocaleString("en-US", { timeZone: TZ }));
    return inicioLocal.getTime() - nowLocal.getTime() < 24 * 60 * 60 * 1000;
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: TZ,
    });

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("es-AR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: TZ,
    });

  // ================= CARGAR RESERVAS =================

  const fetchReservas = async (email: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/mis-reservas?email=${email}`);
      const data = await res.json();

      setActivos(data.pendientes ?? []);
      setPasados(data.pasadas ?? []);
    } catch {}
    setLoading(false);
  };

  // ================= VALIDAR TOKEN =================

  useEffect(() => {
    async function verify() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });

        if (!res.ok) return router.replace("/login");

        const data = await res.json();
        if (data.role !== "USER") return router.replace("/login");

        setUserEmail(data.email ?? "");
        fetchReservas(data.email ?? "");
      } catch {
        router.replace("/login");
      }
    }

    verify();
  }, []);

  // ================= LOGOUT =================

  const handleLogout = () => {
    document.cookie = "token=; Max-Age=0; path=/;";
    router.replace("/login");
  };

  // ================= CANCELAR RESERVA =================

  const handleCancelReservation = async (reservaId: number, canchaNombre: string) => {
    if (!window.confirm(`¿Cancelar la reserva en ${canchaNombre}?`)) return;

    const res = await fetch("/api/turnos/cancel", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: reservaId }),
    });

    if (res.ok) {
      alert("Reserva cancelada");
      fetchReservas(userEmail);
    } else {
      alert("No se pudo cancelar la reserva");
    }
  };

  // ================= LOADING =================

  if (loading || !userEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0F1F]">
        <p className="text-xl text-gray-300">Verificando sesión...</p>
      </div>
    );
  }

  const reservasAMostrar = tab === "activos" ? activos : pasados;

  // ================= UI PRINCIPAL =================

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0F1F] to-[#0F172A] p-4 sm:p-8 text-white">

      {/* HEADER */}
      <header className="bg-white/10 backdrop-blur p-6 rounded-2xl shadow-xl mb-8 flex justify-between items-center border border-white/10">
        <div>
          <h1 className="text-3xl font-extrabold drop-shadow-sm">Mis Turnos</h1>
          <p className="text-gray-300 mt-1 font-medium">{userEmail}</p>
        </div>

        <button
          onClick={handleLogout}
          className="bg-red-600 text-white font-bold py-2 px-4 rounded-xl shadow hover:bg-red-700 hover:scale-105 transition"
        >
          Cerrar Sesión
        </button>
      </header>

      {/* TABS */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setTab("activos")}
          className={`px-5 py-3 rounded-xl text-lg font-bold shadow-sm transition ${
            tab === "activos"
              ? "bg-white text-blue-900 shadow-md scale-105"
              : "bg-white/10 text-white hover:bg-white/20"
          }`}
        >
          Activos
          <span className="ml-2 px-2 py-1 text-xs bg-white/20 rounded-md">{activos.length}</span>
        </button>

        <button
          onClick={() => setTab("pasados")}
          className={`px-5 py-3 rounded-xl text-lg font-bold shadow-sm transition ${
            tab === "pasados"
              ? "bg-white text-blue-900 shadow-md scale-105"
              : "bg-white/10 text-white hover:bg-white/20"
          }`}
        >
          Pasados
          <span className="ml-2 px-2 py-1 text-xs bg-white/20 rounded-md">{pasados.length}</span>
        </button>
      </div>

      {/* SIN RESERVAS */}
      {reservasAMostrar.length === 0 ? (
        <div className="bg-white/10 backdrop-blur p-10 rounded-xl shadow-lg text-center border border-white/10">
          <p className="text-2xl font-semibold">
            {tab === "activos" ? "No tenés reservas activas." : "No tenés reservas pasadas."}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reservasAMostrar.map((turno) => {
            const locked = isCancellationWindowClosed(turno.horaInicio);
            const isPast = tab === "pasados";

            const whatsAppLink = `https://wa.me/${CONTACT_PHONE_NUMBER}?text=Hola%2C%20quiero%20consultar%20por%20mi%20turno%20de%20${turno.cancha.nombre}%20el%20${formatDate(
              turno.horaInicio
            )}%20a%20las%20${formatTime(turno.horaInicio)}`;

            return (
              <div
                key={turno.id}
                className={`p-6 rounded-2xl shadow-lg border border-white/10 bg-white/10 backdrop-blur transition hover:shadow-2xl hover:-translate-y-1 ${
                  isPast ? "opacity-50 grayscale" : ""
                }`}
          >
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-2xl font-bold">{turno.cancha.nombre}</h2>
                    <p classname="text-sm text-gray-300">
                      {turno.cancha.tipo === "FUTBOL" ? "Fútbol" : "Pádel"}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xl font-extrabold text-white">{turno.duracionMinutos} min</p>
                    <span
                      className={`inline-block px-3 py-1 text-xs rounded-full mt-1 ${
                        isPast ? "bg-gray-300 text-gray-900" : "bg-green-300 text-green-900"
                      }`}
                    >
                      {isPast ? "FINALIZADA" : "ACTIVA"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p>📅 {formatDate(turno.horaInicio)}</p>
                  <p>⏰ {formatTime(turno.horaInicio)} – {formatTime(turno.horaFin)}</p>
                </div>

                {!isPast && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    {locked ? (
                      <a
                        href={whatsAppLink}
                        target="_blank"
                        className="block w-full text-center py-2 bg-green-600 text-white font-bold rounded-xl shadow hover:bg-green-700 transition"
                      >
                        Contactar para cancelar
                      </a>
                    ) : (
                      <button
                        onClick={() => handleCancelReservation(turno.id, turno.cancha.nombre)}
                        className="w-full py-2 bg-red-600 text-white font-bold rounded-xl shadow hover:bg-red-700 transition"
                      >
                        Cancelar reserva
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
