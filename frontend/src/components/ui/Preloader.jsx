import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import dimeIcon from '../../assets/dime-icon.png';

export const Preloader = () => {
  const [mensaje, setMensaje] = useState("Iniciando DIME...");

  // Efecto para cambiar los mensajes y reducir la ansiedad de espera
  useEffect(() => {
    const mensajes = [
      "Conectando con Santiago de Tolú...",
      "Cargando directorio público...",
      "Preparando el mapa...",
      "¡Todo listo!"
    ];
    
    let i = 0;
    const interval = setInterval(() => {
      setMensaje(mensajes[i]);
      i = (i + 1) % mensajes.length;
    }, 800); // Cambia texto cada 0.8 segundos

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
      className="fixed inset-0 z-[5000] bg-white flex flex-col items-center justify-center font-sans"
    >
      {/* 1. EL LOGO PULSANDO */}
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1], 
          opacity: [1, 0.8, 1] 
        }}
        transition={{ 
          repeat: Infinity, 
          duration: 1.5, 
          ease: "easeInOut" 
        }}
        className="bg-blue-50 p-6 rounded-full mb-3 shadow-lg shadow-blue-100"
      >
        <img 
          src={dimeIcon} 
          alt="DIME" 
          className="w-16 h-16 object-contain"
        />
      </motion.div>

      {/* 2. EL TÍTULO */}
      <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ color: '#1c528b' }}>
        D I M E
      </h1>

      {/* 3. EL TEXTO DINÁMICO */}
      <p className="text-gray-400 text-sm font-medium animate-pulse">
        {mensaje}
      </p>

      {/* 4. BARRA DE PROGRESO DECORATIVA (Opcional) */}
      <div className="w-32 h-1 bg-gray-100 rounded-full mt-8 overflow-hidden">
        <motion.div 
          className="h-full bg-blue-500"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 2.5, ease: "easeInOut" }}
        />
      </div>

      <div className="absolute bottom-8 text-xs text-gray-300">
        Datos al Ecosistema 2025
      </div>

    </motion.div>
  );
};