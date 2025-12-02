'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Usamos localStorage para simular el inicio de sesión y persistir el email de la reserva
const USER_EMAIL_STORAGE_KEY = 'userEmailForReservas';

// -----------------------------------------------------
// CREDENCIALES FIJAS PARA EL LOGIN DE DEMOSTRACIÓN
// -----------------------------------------------------
const FIXED_LOGIN_CREDENTIALS = {
  // Email que el usuario debe ingresar para pasar el login
  loginEmail: 'user@demo.com', 
  // Contraseña que debe ingresar
  loginPassword: 'turnos123',
  // Email que se usará para BUSCAR LAS RESERVAS en la base de datos (tu email)
  reservationEmail: 'nicocirulli@hotmail.com',
};

export default function UserLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // Nuevo estado para la contraseña
  const [error, setError] = useState('');
  const router = useRouter();

  // Verifica si ya hay un email de reserva guardado (ya "logueado")
  useEffect(() => {
    const storedEmail = localStorage.getItem(USER_EMAIL_STORAGE_KEY);
    if (storedEmail) {
      // Si ya tiene email, lo mandamos directo al panel
      router.replace('/user');
    }
  }, [router]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // 1. Validaciones de campos
    if (!email || !password) {
      setError('Por favor, ingresa el email y la contraseña.');
      return;
    }
    if (!email.includes('@')) {
      setError('El formato del email no es válido.');
      return;
    }

    // 2. Control de Acceso (Hardcoded)
    if (email.toLowerCase() !== FIXED_LOGIN_CREDENTIALS.loginEmail || password !== FIXED_LOGIN_CREDENTIALS.loginPassword) {
        setError('Credenciales incorrectas. Intenta con user@demo.com y turnos123.');
        return;
    }

    // 3. Autenticación exitosa: Guardamos el email de la RESERVA
    // El email guardado es el que tiene tus reservas asociadas
    localStorage.setItem(USER_EMAIL_STORAGE_KEY, FIXED_LOGIN_CREDENTIALS.reservationEmail);

    // Redirige al panel de reservas del usuario
    router.push('/user');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6 text-center">
          Acceso a Mis Reservas 🔑
        </h1>
        <p className="text-sm text-gray-500 mb-6 text-center">
          Ingresa tus credenciales para ver el historial de turnos.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email de Acceso
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="user@demo.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <input
              id="password"
              type="password" // El tipo password oculta los caracteres
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="turnos123"
              required
            />
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ease-in-out"
          >
            Iniciar Sesión
          </button>
        </form>
      </div>
    </div>
  );
}