"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { DateRange, Range, RangeKeyDict } from "react-date-range";
import { startOfDay, endOfDay } from "date-fns";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

// TYPES
interface Cancha {
  nombre: string;
  tipo: "FUTBOL" | "PADEL";
}

interface TurnoAdmin {
  id: number;
  nombreCliente: string;
  horaInicio: string;
  horaFin: string;
  duracionMinutos: number;
  cancha: Cancha;
  cancelado: boolean;
  email?: string;
}

type Filtro = "HOY" | "FUTURO" | "PASADOS" | "TODOS" | "CANCELADOS";

interface ModalState {
  show: boolean;
  message: string;
  actionId?: number;
  isConfirm: boolean;
}

interface JwtPayload {
  role?: string;
  [key: string]: any;
}

function parseJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(base64);
    const jsonPayload = decodeURIComponent(
      decoded
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

const DialogModal = ({
  message,
  onConfirm,
  onCancel,
  show,
  isConfirm,
}: {
  message: string;
  onConfirm?: () => void;
  onCancel: () => void;
  show: boolean;
  isConfirm: boolean;
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full space-y-4">
        <p className="text-slate-800 font-medium text-center">{message}</p>
        <div className="flex justify-center gap-3">
          {isConfirm ? (
            <>
              <button
                onClick={onCancel}
                className="flex-1 py-2 text-sm font-bold border border-gray-300 rounded-lg hover:bg-gray-100 transition"
              >
                Volver
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 py-2 text-sm font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Cancelar reserva
              </button>
            </>
          ) : (
            <button
              onClick={onCancel}
              className="py-2 px-6 text-sm font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
            >
              Cerrar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// MAIN COMPONENT
export default function AdminPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [turnos, setTurnos] = useState<TurnoAdmin[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtro, setFiltro] = useState<Filtro>("HOY");

  const [showStats, setShowStats] = useState(false);
  const [modal, setModal] = useState<ModalState>({
    show: false,
    message: "",
    isConfirm: false,
  });

  const [range, setRange] = useState<Range>({
    startDate: startOfDay(new Date(new Date().setDate(new Date().getDate() - 7))),
    endDate: endOfDay(new Date()),
    key: "selection",
  });

  const handleRangeChange = (ranges: RangeKeyDict) => {
    const sel = ranges.selection;
    setRange({
      startDate: sel.startDate ? startOfDay(sel.startDate) : undefined,
      endDate: sel.endDate ? endOfDay(sel.endDate) : undefined,
      key: "selection",
    });
  };

  const startTs = range.startDate?.getTime() ?? 0;
  const endTs = range.endDate?.getTime() ?? 9999999999999;

  // AUTH CHECK
  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? window.localStorage.getItem("token")
        : null;

    if (!token) {
      router.replace("/login");
      return;
    }

    const payload = parseJwt(token);

    if (!payload || payload.role !== "ADMIN") {
      router.replace("/");
      return;
    }

    setAuthorized(true);
    setCheckingAuth(false);
  }, [router]);

  // LOAD DATA
  const cargarDatos = () => {
    setLoading(true);
    fetch("/api/admin?includeCancelados=true")
      .then((res) => res.json())
      .then((data: TurnoAdmin[]) => {
        data.sort(
          (a, b) =>
            new Date(a.horaInicio).getTime() -
            new Date(b.horaInicio).getTime()
        );
        setTurnos(data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (authorized) cargarDatos();
  }, [authorized]);

  const handleEliminarClick = (id: number) => {
    setModal({
      show: true,
      message: "¿Deseás cancelar esta reserva?",
      isConfirm: true,
      actionId: id,
    });
  };

  const confirmarEliminacion = async () => {
    if (!modal.actionId) return;
    setModal({ ...modal, show: false });

    const res = await fetch(`/api/admin?id=${modal.actionId}`, {
      method: "DELETE",
    });

    cargarDatos();

    setModal({
      show: true,
      message: "Reserva cancelada exitosamente.",
      isConfirm: false,
    });
  };

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const ahora = Date.now();

  const turnosFiltrados = useMemo(() => {
    return turnos.filter((t) => {
      const ts = new Date(t.horaInicio).getTime();

      if (filtro === "CANCELADOS") return t.cancelado;
      if (t.cancelado) return false;

      if (filtro === "HOY") {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const th = new Date(t.horaInicio);
        th.setHours(0, 0, 0, 0);
        return th.getTime() === hoy.getTime();
      }

      if (filtro === "FUTURO") return ts > ahora;
      if (filtro === "PASADOS") return ts < ahora;

      return true;
    });
  }, [turnos, filtro, ahora]);

  const precioPorHora = 20000;

  const activos = turnos.filter((t) => !t.cancelado);
  const cancelados = turnos.filter((t) => t.cancelado);

  const activosEnRango = activos.filter((t) => {
    const ts = new Date(t.horaInicio).getTime();
    return ts >= startTs && ts <= endTs;
  });

  const canceladosEnRango = cancelados.filter((t) => {
    const ts = new Date(t.horaInicio).getTime();
    return ts >= startTs && ts <= endTs;
  });

  const ingresosRangoTotal = activosEnRango.reduce(
    (acc, t) => acc + (t.duracionMinutos / 60) * precioPorHora,
    0
  );

  const diasRango = Math.max(
    1,
    Math.round((endTs - startTs) / (1000 * 60 * 60 * 24))
  );

  const ingresosPromedioDia = ingresosRangoTotal / diasRango;

  const duracionPromedioRango =
    activosEnRango.length === 0
      ? 0
      : activosEnRango.reduce((a, t) => a + t.duracionMinutos, 0) /
        activosEnRango.length;

  const reservasPorDia = useMemo(() => {
    const map = new Map<string, number>();
    activosEnRango.forEach((t) => {
      const d = new Date(t.horaInicio).toLocaleDateString("es-AR", {
        timeZone: "America/Argentina/Buenos_Aires",
      });
      map.set(d, (map.get(d) || 0) + 1);
    });
    return {
      labels: [...map.keys()],
      datasets: [
        {
          label: "Reservas",
          data: [...map.values()],
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59,130,246,.2)",
          tension: 0.3,
          fill: true,
        },
      ],
    };
  }, [activosEnRango]);
  const horariosMasVendidos = useMemo(() => {
    const map = new Map<string, number>();
    activosEnRango.forEach((t) => {
      const h = new Date(t.horaInicio).toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Argentina/Buenos_Aires",
      });
      map.set(h, (map.get(h) || 0) + 1);
    });

    const labels = [...map.keys()].sort();

    return {
      labels,
      datasets: [
        {
          label: "Turnos",
          data: labels.map((h) => map.get(h) || 0),
          backgroundColor: "rgba(16,185,129,.8)",
        },
      ],
    };
  }, [activosEnRango]);

  const ingresosDiarios = useMemo(() => {
    const map = new Map<string, number>();
    activosEnRango.forEach((t) => {
      const d = new Date(t.horaInicio).toLocaleDateString("es-AR", {
        timeZone: "America/Argentina/Buenos_Aires",
      });
      const monto = (t.duracionMinutos / 60) * precioPorHora;
      map.set(d, (map.get(d) || 0) + monto);
    });

    return {
      labels: [...map.keys()],
      datasets: [
        {
          label: "Ingresos ($)",
          data: [...map.values()],
          borderColor: "#22c55e",
          backgroundColor: "rgba(34,197,94,.2)",
          tension: 0.3,
          fill: true,
        },
      ],
    };
  }, [activosEnRango]);

  const retencionData = useMemo(() => {
    const map = new Map<string, number>();

    activosEnRango.forEach((t) => {
      if (!t.email) return;
      map.set(t.email, (map.get(t.email) || 0) + 1);
    });

    let one = 0,
      twoThree = 0,
      fourPlus = 0;

    map.forEach((count) => {
      if (count === 1) one++;
      else if (count <= 3) twoThree++;
      else fourPlus++;
    });

    const total = one + twoThree + fourPlus || 1;

    return {
      labels: ["1 vez", "2-3 veces", "4+ veces"],
      datasets: [
        {
          data: [
            Math.round((one / total) * 100),
            Math.round((twoThree / total) * 100),
            Math.round((fourPlus / total) * 100),
          ],
          backgroundColor: ["#3b82f6", "#a855f7", "#22c55e"],
          borderWidth: 0,
        },
      ],
    };
  }, [activosEnRango]);

  const chartOptionsBase = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: "#e5e7eb" },
      },
    },
    scales: {
      x: { ticks: { color: "#9ca3af" } },
      y: { ticks: { color: "#9ca3af" } },
    },
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1c] text-white">
        Verificando acceso...
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0f1c] to-black text-white">
      <DialogModal
        show={modal.show}
        message={modal.message}
        isConfirm={modal.isConfirm}
        onConfirm={confirmarEliminacion}
        onCancel={() =>
          setModal({ show: false, message: "", isConfirm: false })
        }
      />

      <nav className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-black/20 backdrop-blur">
        <h1 className="text-xl sm:text-2xl font-extrabold">
          Panel de Administración
        </h1>

        <button
          onClick={() => {
            window.localStorage.removeItem("token");
            router.replace("/login");
          }}
          className="text-sm bg-red-600 px-4 py-2 rounded-xl font-bold hover:bg-red-500"
        >
          Cerrar sesión
        </button>
      </nav>

      <main className="max-w-6xl mx-auto p-6 space-y-8">
        {/* ESTADÍSTICAS */}
        <section className="bg-white/5 border border-white/10 rounded-2xl shadow overflow-hidden">
          <button
            onClick={() => setShowStats((s) => !s)}
            className="w-full flex justify-between items-center px-4 py-3 bg-white/10 hover:bg-white/20 transition text-left"
          >
            <div>
              <h2 className="font-semibold text-lg">📊 Estadísticas del sistema</h2>
              <p className="text-xs opacity-70 mt-1">
                Rango actual:{" "}
                {range.startDate?.toLocaleDateString("es-AR")} -{" "}
                {range.endDate?.toLocaleDateString("es-AR")}
              </p>
            </div>
            <span className="font-bold text-sm opacity-80">
              {showStats ? "Ocultar ▲" : "Mostrar ▼"}
            </span>
          </button>

          {/* CAJA PLEGABLE */}
          <div
            className={`transition-all duration-500 overflow-hidden ${
              showStats ? "max-h-[2400px] opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="p-4 space-y-8">
              {/* SELECTOR DE FECHA */}
              <div className="bg-black/20 rounded-2xl border border-white/10 p-3 flex flex-col md:flex-row gap-4">
                <div>
                  <p className="text-sm font-semibold mb-2">
                    Seleccionar rango de fechas
                  </p>
                  <DateRange
                    ranges={[range]}
                    onChange={handleRangeChange}
                    editableDateInputs
                    moveRangeOnFirstSelection={false}
                    rangeColors={["#3b82f6"]}
                    direction="horizontal"
                    months={1}
                  />
                </div>

                {/* METRICAS */}
                <div className="flex-1 grid gap-3 md:grid-cols-2 xl:grid-cols-2 items-start">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow">
                    <p className="text-sm text-gray-300">Reservas activas</p>
                    <p className="text-3xl font-extrabold mt-2">
                      {activosEnRango.length}
                    </p>
                    <p className="text-xs opacity-70 mt-1">
                      Canceladas:{" "}
                      <span className="font-semibold text-red-300">
                        {canceladosEnRango.length}
                      </span>
                    </p>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow">
                    <p className="text-sm text-gray-300">Ingresos totales</p>
                    <p className="text-3xl font-extrabold mt-2 text-green-300">
                      ${ingresosRangoTotal.toLocaleString("es-AR")}
                    </p>
                    <p className="text-xs opacity-70 mt-1">
                      Promedio diario:{" "}
                      <span className="font-semibold text-blue-300">
                        ${ingresosPromedioDia.toFixed(0).toLocaleString("es-AR")}
                      </span>
                    </p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow">
                    <p className="text-sm text-gray-300">Duración promedio</p>
                    <p className="text-3xl font-extrabold mt-2">
                      {duracionPromedioRango.toFixed(0)} min
                    </p>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow">
                    <p className="text-sm text-gray-300">Días del rango</p>
                    <p className="text-3xl font-extrabold mt-2">{diasRango}</p>
                  </div>
                </div>
              </div>

              {/* GRAFICOS */}
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow">
                  <h2 className="font-semibold mb-2">Reservas por día</h2>
                  <div className="h-64">
                    <Line data={reservasPorDia} options={chartOptionsBase} />
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow">
                  <h2 className="font-semibold mb-2">Horarios más vendidos</h2>
                  <div className="h-64">
                    <Bar data={horariosMasVendidos} options={chartOptionsBase} />
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow">
                  <h2 className="font-semibold mb-2">Ingresos diarios</h2>
                  <div className="h-64">
                    <Line data={ingresosDiarios} options={chartOptionsBase} />
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow">
                  <h2 className="font-semibold mb-2">Retención de usuarios</h2>
                  <div className="flex items-center justify-center h-64">
                    <Doughnut
                      data={retencionData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            labels: { color: "#e5e7eb" },
                            position: "bottom",
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TABLA */}
        <section className="bg-white/5 border border-white/10 rounded-2xl shadow overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-4 py-3 border-b border-white/10">
            <h2 className="font-semibold text-lg">Listado de reservas</h2>

            <div className="flex flex-wrap gap-2 bg-white/5 p-1 rounded-xl">
              {(["HOY", "FUTURO", "PASADOS", "TODOS", "CANCELADOS"] as Filtro[]).map(
                (f) => (
                  <button
                    key={f}
                    onClick={() => setFiltro(f)}
                    className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg font-semibold transition ${
                      filtro === f
                        ? "bg-white text-slate-900 shadow"
                        : "text-gray-300 hover:bg-white/10"
                    }`}
                  >
                    {f}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/10 text-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3 text-left">Cliente</th>
                  <th className="px-4 py-3 text-left">Cancha</th>
                  <th className="px-4 py-3 text-left">Duración</th>

                  {filtro !== "PASADOS" && (
                    <th className="px-4 py-3 text-left">Estado</th>
                  )}

                  {filtro !== "PASADOS" && (
                    <th className="px-4 py-3 text-right">Acciones</th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-6 text-center text-gray-300"
                    >
                      Cargando datos...
                    </td>
                  </tr>
                ) : turnosFiltrados.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-6 text-center text-gray-400"
                    >
                      No hay reservas para este filtro.
                    </td>
                  </tr>
                ) : (
                  turnosFiltrados.map((t) => (
                    <tr
                      key={t.id}
                      className={`${
                        t.cancelado
                          ? "opacity-60 bg-red-950/40"
                          : "hover:bg-white/5"
                      }`}
                    >
                      <td className="px-4 py-3 text-gray-100">
                        {formatDateTime(t.horaInicio)}
                      </td>
                      <td className="px-4 py-3 text-gray-100">
                        {t.nombreCliente}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-bold ${
                            t.cancha.tipo === "FUTBOL"
                              ? "bg-emerald-500/20 text-emerald-200"
                              : "bg-blue-500/20 text-blue-200"
                          }`}
                        >
                          {t.cancha.nombre}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-100">
                        {t.duracionMinutos} min
                      </td>

                      {filtro !== "PASADOS" && (
                        <td className="px-4 py-3">
                          {t.cancelado ? (
                            <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-200">
                              CANCELADO
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-200">
                              ACTIVO
                            </span>
                          )}
                        </td>
                      )}

                      {filtro !== "PASADOS" && (
                        <td className="px-4 py-3 text-right">
                          {!t.cancelado && (
                            <button
                              onClick={() => handleEliminarClick(t.id)}
                              className="text-red-300 hover:text-red-100 text-xs sm:text-sm font-bold px-3 py-1 rounded-lg hover:bg-red-500/20 transition"
                            >
                              Cancelar
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
