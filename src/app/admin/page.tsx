'use client';

import { useEffect, useState } from 'react';

// --- TIPOS ---
interface Cancha {
  nombre: string;
  tipo: 'FUTBOL' | 'PADEL';
}

interface TurnoAdmin {
  id: number;
  nombreCliente: string;
  horaInicio: string;
  horaFin: string;
  duracionMinutos: number;
  cancha: Cancha;
}

type Filtro = 'HOY' | 'FUTURO' | 'TODOS';

// --- COMPONENTES AUXILIARES DE UI ---

// Reemplazo de alert() y confirm() con un Modal de Diálogo
const DialogModal = ({ message, onConfirm, onCancel, show }: {
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  show: boolean;
}) => {
  if (!show) return null;

  const isConfirmation = !!onConfirm && !!onCancel;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full space-y-4">
        <p className="text-slate-800 font-medium text-center">{message}</p>
        <div className="flex justify-center gap-3">
          {isConfirmation ? (
            <>
              <button 
                onClick={onCancel} 
                className="flex-1 py-2 text-sm font-bold border border-gray-300 rounded-lg hover:bg-gray-100 transition"
              >
                No, volver
              </button>
              <button 
                onClick={onConfirm} 
                className="flex-1 py-2 text-sm font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Sí, Cancelar
              </button>
            </>
          ) : (
            <button 
              onClick={onCancel} // Usamos onCancel para cerrar el diálogo simple
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


export default function AdminPage() {
  // --- ESTADOS ---
  const [autorizado, setAutorizado] = useState(false);
  const [password, setPassword] = useState('');
  
  const [turnos, setTurnos] = useState<TurnoAdmin[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtro, setFiltro] = useState<Filtro>('HOY');

  // Estado del Modal (para reemplazar alert/confirm)
  const [modal, setModal] = useState<{
    show: boolean;
    message: string;
    actionId?: number; // Para la confirmación de borrado
    isConfirm: boolean;
  }>({
    show: false,
    message: '',
    isConfirm: false,
  });

  // --- EFECTO DE AUTOCARGA (Solo después de login) ---
  useEffect(() => {
    if (autorizado) {
      cargarDatos();
    }
  }, [autorizado]);


  // --- LOGIN SIMPLE ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') { // CLAVE SIMPLE
      setAutorizado(true);
      // El useEffect se encargará de cargar los datos
    } else {
      setModal({ show: true, message: 'Contraseña incorrecta', isConfirm: false });
    }
  };

  // --- CARGAR DATOS ---
  const cargarDatos = () => {
    setLoading(true);
    fetch('/api/admin')
      .then(res => {
        if (!res.ok) throw new Error('Error al obtener datos del servidor.');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          // Ordenar por fecha para que el resumen sea correcto
          data.sort((a, b) => new Date(a.horaInicio).getTime() - new Date(b.horaInicio).getTime());
          setTurnos(data);
        }
      })
      .catch((error: unknown) => { // 👈 CORRECCIÓN: any a unknown
        let errorMessage = 'Error al cargar los turnos.';
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        setModal({ show: true, message: errorMessage, isConfirm: false });
      })
      .finally(() => setLoading(false));
  };

  // --- BORRAR TURNO ---
  const handleEliminarClick = (id: number) => {
    setModal({
      show: true,
      message: '¿Estás seguro de cancelar esta reserva? Esta acción no se puede deshacer.',
      actionId: id,
      isConfirm: true
    });
  };

  const confirmarEliminacion = async () => {
    if (!modal.actionId) return;

    setModal({ show: false, message: '', isConfirm: false });
    setLoading(true);

    try {
      const res = await fetch(`/api/admin?id=${modal.actionId}`, { method: 'DELETE' });

      if (res.ok) {
        setModal({ show: true, message: 'Reserva cancelada con éxito.', isConfirm: false });
        cargarDatos();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Error al eliminar la reserva.');
      }
    } catch (error: unknown) { // 👈 CORRECCIÓN: any a unknown
      let errorMessage = 'Error de conexión al eliminar.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      setModal({ show: true, message: errorMessage, isConfirm: false });
    }
    setLoading(false);
  };

  // --- HELPER FECHAS ---
  const formatearFechaHora = (iso: string) => {
    const fecha = new Date(iso);
    return fecha.toLocaleString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  // --- FILTRADO DE DATOS ---
  const turnosFiltrados = turnos.filter(t => {
    // Convertimos a UTC medianoche para la comparación
    const fechaTurno = new Date(t.horaInicio).setHours(0,0,0,0);
    const hoy = new Date().setHours(0,0,0,0);

    if (filtro === 'HOY') return fechaTurno === hoy;
    if (filtro === 'FUTURO') return fechaTurno >= hoy;
    return true; // TODOS
  });

  // ---------------- RENDER: PANTALLA LOGIN ----------------
  if (!autorizado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <DialogModal 
            show={modal.show && !modal.isConfirm}
            message={modal.message}
            onCancel={() => setModal({ show: false, message: '', isConfirm: false })}
        />
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-sm">
          <h1 className="text-2xl font-bold text-center mb-6 text-slate-800">Acceso Admin</h1>
          <input 
            type="password" 
            placeholder="Contraseña" 
            className="w-full p-3 border rounded-lg mb-4 focus:ring-slate-900 focus:border-slate-900"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <button 
            className="w-full bg-slate-900 text-white p-3 rounded-lg font-bold hover:bg-slate-800 transition"
            disabled={loading}
          >
            {loading ? 'Cargando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    );
  }

  // ---------------- RENDER: DASHBOARD ----------------
  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      
      {/* MODAL GLOBAL */}
      <DialogModal 
        show={modal.show}
        message={modal.message}
        isConfirm={modal.isConfirm}
        onConfirm={confirmarEliminacion}
        onCancel={() => setModal({ show: false, message: '', isConfirm: false })}
      />

      {/* NAVBAR */}
      <nav className="bg-slate-900 text-white p-4 shadow-md flex justify-between items-center">
        <h1 className="text-xl font-bold">Panel de Control - Nico Canchas</h1>
        <button onClick={() => setAutorizado(false)} className="text-sm bg-slate-700 px-3 py-1 rounded hover:bg-slate-600 transition">
          Cerrar Sesión
        </button>
      </nav>

      <div className="max-w-6xl mx-auto p-6">
        
        {/* RESUMEN SIMPLE */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
            <h3 className="text-gray-500 text-sm font-bold uppercase">Reservas Totales</h3>
            {/* CORRECCIÓN: Uso de optional chaining para acceso seguro */}
            <p className="text-3xl font-black text-slate-800">{turnos?.length || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
            <h3 className="text-gray-500 text-sm font-bold uppercase">Ingresos Estimados</h3>
            <p className="text-3xl font-black text-slate-800">
              {/* CORRECCIÓN: Uso de optional chaining para acceso seguro */}
              ${((turnos?.length || 0) * 22500).toLocaleString('es-AR')}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-purple-500">
             <h3 className="text-gray-500 text-sm font-bold uppercase">Próximo Turno</h3>
             <p className="text-xl font-bold text-slate-800 mt-1">
               {/* CORRECCIÓN: Uso de optional chaining para acceso seguro */}
               {turnos?.[0] ? formatearFechaHora(turnos[0].horaInicio) : 'Sin turnos'}
             </p>
          </div>
        </div>

        {/* CONTROLES Y FILTROS */}
        <div className="bg-white rounded-t-xl p-4 border-b flex flex-col md:flex-row justify-between items-center gap-4">
          <h2 className="text-lg font-bold text-slate-800">Listado de Reservas</h2>
          
          <div className="flex bg-slate-100 p-1 rounded-lg">
            {/* CORRECCIÓN: Eliminamos 'as any' y usamos el tipo Filtro */}
            {(['HOY', 'FUTURO', 'TODOS'] as Filtro[]).map((f) => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${
                  filtro === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* TABLA DE DATOS */}
        <div className="bg-white rounded-b-xl shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-4 font-bold">Fecha y Hora</th>
                <th className="px-6 py-4 font-bold">Cliente</th>
                <th className="px-6 py-4 font-bold">Cancha</th>
                <th className="px-6 py-4 font-bold">Duración</th>
                <th className="px-6 py-4 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500 font-medium">Cargando datos...</td></tr>
              ) : turnosFiltrados.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-400">No hay reservas para este filtro.</td></tr>
              ) : (
                turnosFiltrados.map((turno) => (
                  <tr key={turno.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {formatearFechaHora(turno.horaInicio)}
                    </td>
                    <td className="px-6 py-4">{turno.nombreCliente}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        turno.cancha.tipo === 'FUTBOL' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {turno.cancha.nombre}
                      </span>
                    </td>
                    <td className="px-6 py-4">{turno.duracionMinutos} min</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleEliminarClick(turno.id)}
                        className="text-red-500 hover:text-red-700 font-bold hover:bg-red-50 px-3 py-1 rounded transition-colors disabled:opacity-50"
                        disabled={loading}
                      >
                        Cancelar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
      </div>
    </div>
  );
}