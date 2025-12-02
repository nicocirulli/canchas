'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// La misma clave de almacenamiento que usamos en el login
const USER_EMAIL_STORAGE_KEY = 'userEmailForReservas';

// Interfaz corregida para coincidir con el modelo 'Turno' del schema.prisma
interface TurnoData {
  id: number;
  // Los campos de tiempo vienen como strings ISO de la DB
  horaInicio: string; 
  horaFin: string;
  duracionMinutos: number; 
  email: string; 
  cancha: {
    nombre: string;
    tipo: 'FUTBOL' | 'PADEL';
  };
}

// Número de teléfono de contacto (Ejemplo, reemplaza con el real)
const CONTACT_PHONE_NUMBER = '+5491123456789'; 

// El componente principal, ahora con control de sesión
export default function UserReservasPage() {
  const [reservas, setReservas] = useState<TurnoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();

  // FUNCIÓN CRÍTICA: Verifica si quedan menos de 24 horas para la reserva
  const isCancellationWindowClosed = (isoString: string): boolean => {
    const horaInicio = new Date(isoString);
    const ahora = new Date();
    // La diferencia se calcula en milisegundos. 24 horas en ms = 24 * 60 * 60 * 1000
    const diferenciaMs = horaInicio.getTime() - ahora.getTime();
    const veinticuatroHorasMs = 24 * 60 * 60 * 1000;

    // Si la diferencia es menor a 24 horas (o ya pasó la hora de inicio), devuelve true.
    return diferenciaMs < veinticuatroHorasMs;
  };

  // FUNCIÓN CORREGIDA: Fuerza la visualización de la hora en UTC
  const formatTime = (isoString: string) => {
    // Usamos timeZone: 'UTC' para evitar que el navegador aplique su desfase local.
    return new Date(isoString).toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'UTC' 
    });
  };
  
  // FUNCIÓN CORREGIDA: Fuerza la visualización de la fecha en UTC
  const formatDate = (isoString: string) => {
    // Usamos timeZone: 'UTC' para que la fecha no cambie si el turno es cerca de medianoche.
    return new Date(isoString).toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        timeZone: 'UTC' 
    });
  };

  // Función para cargar las reservas
  const fetchReservas = (email: string) => {
    setLoading(true);
    fetch(`/api/mis-reservas?email=${email}`)
      .then(res => {
        if (!res.ok) {
            throw new Error('Fallo la carga de reservas: ' + res.statusText);
        }
        return res.json();
      })
      .then(data => {
        setReservas(data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching user data:", error);
        setLoading(false);
      });
  };

  // 1. Efecto para verificar la sesión y cargar datos
  useEffect(() => {
    const storedEmail = localStorage.getItem(USER_EMAIL_STORAGE_KEY);
    
    if (!storedEmail) {
      router.replace('/user/login');
      return;
    }

    setUserEmail(storedEmail);
    fetchReservas(storedEmail);
  }, [router]);


  // FUNCIÓN CRÍTICA: Maneja la cancelación de una reserva
  const handleCancelReservation = async (reservaId: number, canchaNombre: string) => {
    // 1. Confirmación de usuario (usando window.confirm simple para garantizar que funcione)
    const isConfirmed = window.confirm(`¿Estás seguro que deseas cancelar el turno en la cancha "${canchaNombre}"? Esta acción es irreversible.`);
    
    if (!isConfirmed) {
      return;
    }

    // 2. Llamada a la API de cancelación
    try {
      const response = await fetch('/api/turnos/cancel', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: reservaId }), // Le enviamos el ID de la reserva a la API
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error desconocido al cancelar.');
      }

      // 3. Éxito: volvemos a cargar la lista de reservas
      window.alert(`¡Reserva en ${canchaNombre} cancelada con éxito!`);
      
      // Forzamos la recarga de la lista
      if (userEmail) {
        fetchReservas(userEmail); 
      }
      
    } catch (error: any) {
      console.error('Error de cancelación:', error);
      window.alert(`Error al intentar cancelar la reserva: ${error.message}.`);
    }
  };


  const handleLogout = () => {
    localStorage.removeItem(USER_EMAIL_STORAGE_KEY);
    router.replace('/user/login');
  };

  if (loading || !userEmail) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <p className="text-xl text-gray-600">Verificando sesión...</p>
        </div>
    );
  }

  // Renderizado principal
  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <header className="bg-white p-6 rounded-xl shadow-md mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-blue-700">
            👤 Mis Turnos
          </h1>
          <p className="text-gray-500 mt-1 font-medium">{userEmail}</p>
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:bg-red-600 transition duration-300"
        >
          Cerrar Sesión
        </button>
      </header>


      {reservas.length === 0 ? (
        <div className="bg-white p-10 rounded-xl shadow-lg text-center border border-gray-200">
          <p className="text-2xl font-semibold text-gray-700">¡No tienes ninguna reserva activa!</p>
          <p className="mt-3 text-lg text-gray-500">
            <a href="/" className="text-blue-500 hover:text-blue-700 font-medium transition duration-300">
                Reserva tu próximo turno
            </a> en la página principal.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reservas.map((turno) => {
            const isCancellationClosed = isCancellationWindowClosed(turno.horaInicio);
            const whatsAppLink = `https://wa.me/${CONTACT_PHONE_NUMBER}?text=Hola%2C%20quisiera%20consultar%20sobre%20la%20cancelaci%C3%B3n%20de%20mi%20turno%20de%20${turno.cancha.nombre}%20del%20d%C3%ADa%20${formatDate(turno.horaInicio)}%20a%20las%20${formatTime(turno.horaInicio)}.`;
            
            return (
              <div 
                key={turno.id} 
                className="bg-white p-6 rounded-xl shadow-xl border-t-8 border-green-500 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{turno.cancha.nombre}</h2>
                    <p className="text-sm font-medium text-gray-500">
                      {turno.cancha.tipo === 'FUTBOL' ? 'Fútbol' : 'Pádel'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-extrabold text-gray-700">{turno.duracionMinutos} min</p> 
                    <span className="inline-block px-3 py-1 text-xs font-semibold leading-none rounded-full bg-blue-100 text-blue-800 mt-1">
                      CONFIRMADA
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2 text-gray-600">
                  <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a1 1 0 100-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>
                      <span className="font-medium">{formatDate(turno.horaInicio)}</span>
                  </div>
                  <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.414L11 9.586V6z" clipRule="evenodd" /></svg>
                      <span className="font-medium">{formatTime(turno.horaInicio)} - {formatTime(turno.horaFin)}</span>
                  </div>
                </div>

                {/* LÓGICA CONDICIONAL DEL BOTÓN */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  {isCancellationClosed ? (
                    // Opción 1: Menos de 24 horas (Botón de Contacto por WhatsApp)
                    <a
                      href={whatsAppLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ease-in-out"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="white"><path d="M12.0001 2.00008C6.47514 2.00008 2.00014 6.47508 2.00014 12.0001C2.00014 13.7141 2.44314 15.3521 3.25014 16.7821L2.01214 22.0001L7.38014 20.8401C8.75614 21.5791 10.3341 21.9991 12.0001 21.9991C17.5251 21.9991 22.0001 17.5241 22.0001 12.0001C22.0001 6.47508 17.5251 2.00008 12.0001 2.00008ZM16.6451 16.3241C16.4851 16.6341 16.1961 16.6981 15.9081 16.5921C15.6201 16.4861 14.2841 15.8271 14.0721 15.5401C13.8601 15.2531 13.5671 15.1761 13.2791 15.3191C13.0671 15.5001 12.0911 16.1431 11.8791 16.4301C11.6671 16.7171 11.4551 16.7941 11.2431 16.6881C10.9551 16.5821 9.94714 16.2081 8.85114 15.2281C7.88214 14.3521 7.23914 13.3721 7.02714 13.0851C6.81514 12.7981 6.81514 12.5691 6.95914 12.3131C7.10314 12.0571 7.42414 11.6031 7.57514 11.4491C7.75614 11.2681 7.94014 11.0871 8.12114 10.9571C8.30214 10.8271 8.38814 10.7411 8.57014 10.4541C8.75114 10.1671 8.75114 9.92308 8.61814 9.77908C8.48514 9.63508 7.95714 9.38708 7.74514 9.25708C7.61214 9.19308 7.50614 9.15708 7.40014 9.15708C7.30914 9.15708 7.15214 9.14508 6.99514 9.14508C6.83814 9.14508 6.57414 9.19808 6.36214 9.49708C6.15014 9.79608 5.64514 10.2911 5.64514 11.2991C5.64514 12.3071 6.38514 13.2981 6.52914 13.5101C6.67314 13.7221 8.01014 15.7721 9.98214 17.5141C11.6671 18.9951 13.0031 19.4671 13.5311 19.6001C13.9051 19.6911 14.6191 19.6641 15.0561 19.5311C15.6591 19.3401 16.8281 18.7841 17.0391 18.1701C17.2511 17.5561 17.2511 17.0421 17.1181 16.7551C17.0001 16.5111 16.8281 16.3541 16.6451 16.3241Z"/></svg>
                      Contactar para Cancelar
                    </a>
                  ) : (
                    // Opción 2: Más de 24 horas (Botón de Cancelación Normal)
                    <button
                        onClick={() => handleCancelReservation(turno.id, turno.cancha.nombre)}
                        className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-150 ease-in-out"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 7a1 1 0 012 0v5a1 1 0 11-2 0V7zm5 0a1 1 0 10-2 0v5a1 1 0 102 0V7z" clipRule="evenodd" /></svg>
                        Cancelar Reserva
                    </button>
                  )}
                </div>
                
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}