'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
// import Link from 'next/link'; // ELIMINADO: Causa error de compilación en el entorno Canvas/Vercel

// --- IMÁGENES ---
const BG_FUTBOL = "https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg?_gl=1*153g0mj*_ga*MTM3MDcxODMxMy4xNzY0NTIyMTg2*_ga_8JE65Q40S6*czE3NjQ1NDY1MDMkbzIkZzEkdDE3NjQ1NDY1NTYkajckbDAkaDA.";
const BG_PADEL = "https://images.pexels.com/photos/32474981/pexels-photo-32474981.jpeg?_gl=1*1i3b6kc*_ga*MTM3MDcxODMxMy4xNzY0NTIyMTg2*_ga_8JE65Q40S6*czE3NjQ1NDY2NTMkajU2JGwwJGgw";
const BTN_PADEL_IMG = "https://images.pexels.com/photos/31012869/pexels-photo-31012869.jpeg?_gl=1*1yur7a4*_ga*MTM3MDcxODMxMy4xNzY0NTIyMTg2*_ga_8JE65Q40S6*czE3NjQ1NDY2MDAkajQ4JGwwJGgw"; 
const BTN_FUTBOL_IMG = "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?q=80&w=800&auto=format&fit=crop";

// --- TIPOS ---
interface Cancha { id: number; nombre: string; tipo: 'FUTBOL' | 'PADEL'; }
interface TurnoOcupado { canchaId: number; horaInicio: string; horaFin: string; }
interface SlotHorario { hora: string; canchasLibres: Cancha[]; cantidad: number; }

export default function Home() {
  // Estados
  const [paso, setPaso] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' }); // Corregido el valor inicial si había un error tipográfico.

  // Datos DB
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [turnosOcupados, setTurnosOcupados] = useState<TurnoOcupado[]>([]);

  // Selección Usuario
  const [deporteSeleccionado, setDeporteSeleccionado] = useState<'FUTBOL' | 'PADEL' | null>(null);
  const [canchaSeleccionada, setCanchaSeleccionada] = useState<Cancha | null>(null);

  // Formulario
  const [cliente, setCliente] = useState('');
  const [email, setEmail] = useState(''); 
  const [telefono, setTelefono] = useState(''); 
  const [fecha, setFecha] = useState(''); 
  const [hora, setHora] = useState('');
  const [duracion, setDuracion] = useState(60);

  // --- HELPERS ---
  const formatearFecha = (iso: string) => { 
    if (!iso) return ''; 
    const [a, m, d] = iso.split('-'); 
    return `${d}/${m}/${a}`; 
  };
  
  const calcularHoraFin = () => {
    if (!hora) return '';
    const [h, m] = hora.split(':').map(Number);
    const ft = new Date(); 
    ft.setHours(h, m); 
    ft.setMinutes(ft.getMinutes() + duracion);
    return `${ft.getHours().toString().padStart(2, '0')}:${ft.getMinutes().toString().padStart(2, '0')}`;
  };

  // --- CARGA DE DATOS ---
  useEffect(() => {
    fetch('/api/canchas')
      .then(r => r.json())
      .then(d => { if(Array.isArray(d)) setCanchas(d); })
      .finally(() => setLoading(false));
  }, []);

  // Cargar ocupados (con timestamp para romper caché y ver cambios al instante)
  const cargarOcupados = (fechaStr: string) => {
    fetch(`/api/disponibilidad?fecha=${fechaStr}&t=${Date.now()}`)
      .then(r => r.json())
      .then(d => { if(Array.isArray(d)) setTurnosOcupados(d); })
      .catch(err => console.error("Error cargando disponibilidad:", err));
  };

  useEffect(() => {
    if (fecha) {
      setTurnosOcupados([]); 
      cargarOcupados(fecha);
    }
  }, [fecha]);

  // --- LÓGICA DE NEGOCIO ---
  const proximosDias = useMemo(() => {
    const dias = []; const hoy = new Date();
    for (let i = 0; i < 7; i++) {
      const f = new Date(hoy); f.setDate(hoy.getDate() + i);
      const iso = new Date(f.getTime() - f.getTimezoneOffset() * 60000).toISOString().split('T')[0];
      dias.push({ 
        fechaIso: iso, 
        diaNombre: f.toLocaleDateString('es-AR', {weekday:'short'}).toUpperCase().replace('.',''), 
        diaNumero: f.getDate().toString() 
      });
    }
    return dias;
  }, []);

  // ESTABILIZAMOS LA FUNCIÓN CON useCallback (requerido por ESLint/Vercel)
  const obtenerCanchasLibres = useCallback((horaCand: string, durMin: number): Cancha[] => {
    if (!fecha || !deporteSeleccionado) return [];
    
    const cDeporte = canchas.filter(c => c.tipo === deporteSeleccionado);
    // Aseguramos que la fecha es en la zona horaria correcta para la comparación
    const ini = new Date(`${fecha}T${horaCand}:00.000Z`).getTime();
    const fin = ini + (durMin * 60000);
    
    return cDeporte.filter(c => {
        if (!Array.isArray(turnosOcupados)) return true;
        const tieneConflicto = turnosOcupados.some(t => {
            // Comparamos IDs numéricos para no fallar
            if (Number(t.canchaId) !== Number(c.id)) return false;
            
            const tIni = new Date(t.horaInicio).getTime();
            const tFin = new Date(t.horaFin).getTime();
            
            // Si los horarios se tocan, hay conflicto
            return (ini < tFin && fin > tIni);
        });

        return !tieneConflicto; // Solo devolvemos las que NO tienen conflicto
    });
  }, [fecha, deporteSeleccionado, canchas, turnosOcupados]);

  // ⚡️ CÁLCULO EN TIEMPO REAL: Canchas disponibles para la hora seleccionada.
  const canchasDelHorario = useMemo(() => {
      if (!hora) return [];
      // Agregamos obtenerCanchasLibres como dependencia, ahora que es estable
      return obtenerCanchasLibres(hora, duracion);
  }, [hora, duracion, obtenerCanchasLibres]);

  const grillaHorarios = useMemo(() => {
    if (!fecha || !deporteSeleccionado) return [];
    const h: SlotHorario[] = [];
    
    for (let i = 8; i < 24; i++) {
      const hh = i.toString().padStart(2, '0');
      const add = (mm: string) => {
          const slot = `${hh}:${mm}`;
          // Calculamos disponibilidad para el badge
          // Agregamos obtenerCanchasLibres como dependencia, ahora que es estable
          const libres = obtenerCanchasLibres(slot, duracion);
          h.push({ hora: slot, canchasLibres: libres, cantidad: libres.length });
      };
      add('00');
      if (deporteSeleccionado !== 'FUTBOL' && i !== 24) add('30');
    }
    return h;
  }, [fecha, deporteSeleccionado, duracion, obtenerCanchasLibres]);

  const alSeleccionarHorario = (horaStr: string) => { 
    // Al seleccionar la hora, el useMemo de canchasDelHorario se dispara automáticamente
    setHora(horaStr); 
    setCanchaSeleccionada(null); 
  };
  
  const duraciones = deporteSeleccionado === 'FUTBOL' 
    ? [{val:60, lbl:'1 Hora'}] 
    : [{val:60, lbl:'1 Hora'},{val:90, lbl:'1h 30m'},{val:120, lbl:'2 Horas'}];
  
  const precioCancha = deporteSeleccionado === 'FUTBOL' ? 25000 : (20000 * duracion) / 60;
  const precioTotal = precioCancha + 100;

  const confirmarReserva = async () => {
    if (!canchaSeleccionada || !cliente) { 
        console.error('Completa tu nombre'); 
        return; 
    }
    
    setMensaje({ texto: 'Procesando pago simulado...', tipo: 'info' });

    try {
        const res = await fetch('/api/turnos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
              canchaId: canchaSeleccionada.id, 
              cliente, 
              fecha, 
              hora, 
              duracion,
              email: email || 'no-email', 
              telefono: telefono || 'no-phone'
          }),
        });

        let data;
        try { data = await res.json(); } catch { throw new Error('Error crítico servidor'); }

        if (res.ok) {
          setMensaje({ texto: `¡Reserva Confirmada!`, tipo: 'exito' });
          
          // FORZAMOS EL RE-CALCULO DE DISPONIBILIDAD
          cargarOcupados(fecha);

          setTimeout(() => {
              setMensaje({ texto: '', tipo: '' });
              setCliente(''); setEmail(''); setTelefono(''); setHora(''); setCanchaSeleccionada(null); 
              setPaso(1);
          }, 3000); 
        } else {
          setMensaje({ texto: data.error || 'Error al reservar', tipo: 'error' });
        }
    } catch (error: unknown) { // FIX: Cambio de 'any' a 'unknown'
        let errorMessage = 'Error de conexión';
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
        setMensaje({ texto: errorMessage || 'Error de conexión', tipo: 'error' });
    }
  };

  const selectDeporte = (d: 'FUTBOL' | 'PADEL') => {
      setDeporteSeleccionado(d);
      setFecha(''); setHora(''); setCanchaSeleccionada(null); setDuracion(60);
  }

  // --- RENDER ---
  if (loading) return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white animate-pulse text-xl font-bold">Cargando sistema...</div>
    </main>
  );

  return (
    <main className="min-h-screen relative bg-slate-950 flex flex-col items-center justify-center font-sans overflow-hidden">

      {/* NAVBAR */}
      <nav className="absolute top-0 left-0 w-full z-50 flex justify-between items-center p-6 text-white bg-gradient-to-b from-black/60 to-transparent pointer-events-auto">
        <div className="flex items-center gap-2">
          <div className="bg-white text-slate-950 font-black px-2 py-1 rounded text-sm tracking-tighter">NC</div>
        </div>
        <div className="flex gap-4">
          {/* FIX: Usamos <a> en lugar de <Link> */}
          <nav className="absolute top-0 left-0 w-full z-50 flex justify-between items-center p-6 text-white bg-gradient-to-b from-black/60 to-transparent pointer-events-auto">
  <div className="flex items-center gap-2">
    <div className="bg-white text-slate-950 font-black px-2 py-1 rounded text-sm tracking-tighter">NC</div>
  </div>

  <div className="flex gap-4">
    <a
      href="/login"
      className="text-sm font-medium hover:text-blue-300 transition cursor-pointer"
    >
      🔑 Login
    </a>

    <a
      href="/register"
      className="text-sm font-medium hover:text-green-300 transition cursor-pointer"
    >
      📝 Registrarse
    </a>
  </div>
</nav>

          {/* FIX: Usamos <a> en lugar de <Link> */}
          
        </div>
      </nav>

      {/* FONDOS */}
      <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-slate-950"></div>
          <div className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${deporteSeleccionado === 'FUTBOL' ? 'opacity-40' : 'opacity-0'}`} style={{ backgroundImage: `url(${BG_FUTBOL})` }} />
          <div className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${deporteSeleccionado === 'PADEL' ? 'opacity-40' : 'opacity-0'}`} style={{ backgroundImage: `url(${BG_PADEL})` }} />
          <div className="absolute inset-0 bg-slate-900/70 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/50"></div>
      </div>

      {/* TARJETA */}
      <div className="relative z-10 w-full max-w-xl p-4 mt-16">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden min-h-[600px] flex flex-col transition-all duration-500 border border-white/10">
          
          <div className="bg-slate-900 p-6 text-white text-center">
            <p className="text-slate-400 text-xs tracking-widest uppercase mb-1">
              {paso === 1 ? 'Bienvenido al predio' : 'Confirmación'}
            </p>
            <h2 className="text-2xl font-bold tracking-tight">
              {paso === 1 ? 'Reserva tu lugar' : 'Completa tus datos'}
            </h2>
          </div>

          <div className="p-8 flex-1">
            {/* PASO 1 */}
            {paso === 1 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-left-2 duration-500">
                
                {/* Deporte */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">1. Elige Deporte</label>
                  {/* El layout estaba roto, lo ajustamos con flex para que se vean dos columnas en todos los dispositivos */}
                  <div className="flex gap-4 min-h-[10rem]">
                    <div onClick={() => selectDeporte('PADEL')} className={`flex-1 relative group cursor-pointer rounded-xl overflow-hidden shadow-md transition-all duration-300 ring-2 ${deporteSeleccionado === 'PADEL' ? 'ring-blue-600 ring-offset-2 scale-[1.02]' : 'ring-transparent hover:scale-[1.02]'}`}>
                      <div className={`absolute inset-0 bg-cover bg-center transition-all duration-500 ${deporteSeleccionado === 'PADEL' ? 'grayscale-0' : 'grayscale group-hover:grayscale-0'}`} style={{backgroundImage: `url(${BTN_PADEL_IMG})`}}></div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent"></div>
                      <div className="absolute bottom-3 left-0 w-full text-center z-10"><span className="text-white font-black text-xl tracking-wider uppercase drop-shadow-md">Pádel</span><span className="text-blue-300 text-xs font-bold mt-1 block">$20.000 /h</span></div>
                    </div>
                    <div onClick={() => selectDeporte('FUTBOL')} className={`flex-1 relative group cursor-pointer rounded-xl overflow-hidden shadow-md transition-all duration-300 ring-2 ${deporteSeleccionado === 'FUTBOL' ? 'ring-green-600 ring-offset-2 scale-[1.02]' : 'ring-transparent hover:scale-[1.02]'}`}>
                      <div className={`absolute inset-0 bg-cover bg-center transition-all duration-500 ${deporteSeleccionado === 'FUTBOL' ? 'grayscale-0' : 'grayscale group-hover:grayscale-0'}`} style={{backgroundImage: `url(${BTN_FUTBOL_IMG})`}}></div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent"></div>
                      <div className="absolute bottom-3 left-0 w-full text-center z-10"><span className="text-white font-black text-xl tracking-wider uppercase drop-shadow-md">Fútbol</span><span className="text-green-300 text-xs font-bold mt-1 block">$25.000 /h</span></div>
                    </div>
                  </div>
                </div>

                {deporteSeleccionado && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    
                    {/* Fecha */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">2. Fecha y Duración</label>
                      <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide mb-4">
                        {proximosDias.map((d) => (
                          <div key={d.fechaIso} onClick={() => { setFecha(d.fechaIso); setHora(''); setCanchaSeleccionada(null); }} className={`cursor-pointer min-w-[70px] flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all ${fecha === d.fechaIso ? 'bg-slate-800 border-slate-800 text-white shadow-lg scale-105' : 'bg-white border-gray-200 text-gray-500 hover:border-slate-300'}`}>
                            <span className="text-xs font-bold uppercase">{d.diaNombre}</span>
                            <span className="text-xl font-extrabold">{d.diaNumero}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        {duraciones.map(d => (
                          <button key={d.val} type="button" onClick={() => { setDuracion(d.val); setHora(''); setCanchaSeleccionada(null); }} className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold border transition-all ${duracion === d.val ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
                            {d.lbl}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Horarios */}
                    {fecha && (
                      <div className="animate-in fade-in duration-300">
                        <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">3. Horarios</label>
                        <div className="grid grid-cols-4 gap-2">
                          {grillaHorarios.map((slot) => {
                            const disp = slot.cantidad > 0;
                            const sel = hora === slot.hora;
                            
                            // SI NO HAY CUPO, NO RENDERIZAR (SOLUCION A LA PETICION)
                            if (!disp) return null;

                            return (
                              <button key={slot.hora} type="button" onClick={() => alSeleccionarHorario(slot.hora)} className={`py-2 px-1 rounded-md text-sm font-bold border relative transition-all duration-200 ${sel ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-300 transform scale-105 z-10' : 'bg-white text-slate-700 border-gray-300 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50'}`}>
                                {slot.hora}
                                <span className={`absolute -top-2 -right-2 text-[9px] px-1.5 py-0.5 rounded-full font-bold shadow-sm ${sel ? 'bg-white text-blue-600' : 'bg-green-100 text-green-700 border border-green-200'}`}>
                                    {slot.cantidad}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                        {grillaHorarios.every(s => s.cantidad === 0) && (
                              <p className="text-center text-gray-400 text-sm italic mt-4">No hay horarios disponibles.</p>
                        )}
                      </div>
                    )}

                    {/* Cancha (LISTA DINÁMICA EN TIEMPO REAL) */}
                    {hora && canchasDelHorario.length > 0 && (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">4. Cancha</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {canchasDelHorario.map((c) => (
                            <div key={c.id} onClick={() => setCanchaSeleccionada(c)} className={`cursor-pointer p-4 rounded-xl border-2 flex justify-between items-center transition-all duration-200 hover:scale-[1.02] ${canchaSeleccionada?.id === c.id ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900 shadow-md' : 'border-gray-200 hover:border-slate-400'}`}>
                              <span className="font-bold text-slate-800">{c.nombre}</span>
                              {canchaSeleccionada?.id === c.id && <span className="text-slate-900 text-xl">✓</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {canchaSeleccionada && (
                      <div className="animate-in zoom-in duration-300 pt-4">
                        <button onClick={(e) => { e.preventDefault(); setPaso(2); window.scrollTo(0,0); }} className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 hover:scale-[1.02] transition-all duration-300">
                          CONTINUAR
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* PASO 2 */}
            {paso === 2 && canchaSeleccionada && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-slate-900">Confirmar Reserva</h2>
                    <p className="text-slate-500 text-sm">Casi listo. Completa tus datos.</p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-slate-600">Fecha:</span><span className="font-bold text-slate-900">{formatearFecha(fecha)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-600">Hora:</span><span className="font-bold text-slate-900">{hora} a {calcularHoraFin()}</span></div>
                    <div className="flex justify-between"><span className="text-slate-600">Cancha:</span><span className="font-bold text-slate-900 uppercase">{canchaSeleccionada.nombre}</span></div>
                    <div className="flex justify-between pt-2 border-t border-slate-200 text-base"><span className="font-bold text-slate-800">Total:</span><span className="font-black text-slate-900">${precioTotal.toLocaleString('es-AR')}</span></div>
                </div>

                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Nombre Completo</label>
                        <input type="text" value={cliente} onChange={(e) => setCliente(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 outline-none" placeholder="Ej: Lionel Messi" required />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Correo (Opcional)</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 outline-none" placeholder="tu@email.com" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Número (Opcional)</label>
                            <input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 outline-none" placeholder="11 1234..." />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-blue-200 shadow-sm flex justify-between items-center">
                    <span className="text-blue-800 font-bold text-sm">Seña a pagar ahora:</span>
                    <span className="text-blue-900 font-black text-xl">$10.000</span>
                </div>

                <div className="space-y-3 pt-2">
                  <button onClick={confirmarReserva} className="w-full py-4 bg-green-600 text-white font-bold rounded-xl shadow-lg hover:bg-green-500 transition-all duration-300 flex items-center justify-center space-x-2">
                    <span>💳</span><span>CONFIRMAR RESERVA</span>
                  </button>
                  <button onClick={() => setPaso(1)} className="w-full py-3 text-slate-500 font-medium text-sm hover:text-slate-800 transition-colors">
                    Volver
                  </button>
                </div>
              </div>
            )}

            {/* MENSAJES */}
            {mensaje.texto && (
              <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 w-11/12 max-w-md p-4 rounded-xl text-center font-bold shadow-2xl z-50 animate-in slide-in-from-bottom-5 duration-500 ${mensaje.tipo === 'error' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
                {mensaje.texto}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}