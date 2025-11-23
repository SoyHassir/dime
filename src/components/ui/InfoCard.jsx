import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, Phone, X } from 'lucide-react'; // Asegúrate de tener estos iconos

export const InfoCard = ({ titulo, categoria, direccion, onClose }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 30, scale: 0.95 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      className="relative w-full bg-white p-6 rounded-[2rem] shadow-2xl border border-gray-100"
    >
      
      {/* Botón Cerrar (Circular y flotante en la esquina) */}
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 bg-gray-50 p-2 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Etiqueta de Categoría (Pequeña píldora azul) */}
      <div className="inline-block bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
        {categoria}
      </div>

      {/* Título Grande */}
      <h3 className="font-bold text-2xl text-gray-900 mb-4 pr-8 leading-tight">
        {titulo}
      </h3>

      {/* Información con Iconos */}
      <div className="space-y-3">
        
        {/* Dirección */}
        <div className="flex items-start gap-3 text-gray-600">
          <div className="bg-gray-50 p-1.5 rounded-full shrink-0">
             <MapPin className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-sm leading-snug mt-0.5">
            {direccion || "Dirección no disponible en el registro."}
          </p>
        </div>

        {/* Horario (Placeholder visual) */}
        <div className="flex items-center gap-3 text-gray-600">
          <div className="bg-gray-50 p-1.5 rounded-full shrink-0">
             <Clock className="w-4 h-4 text-orange-400" />
          </div>
          <p className="text-sm">08:00 AM - 04:00 PM</p>
        </div>

      </div>

      {/* Botón de Acción Principal */}
      <button className="w-full mt-6 bg-blue-600 text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2">
        <Phone className="w-4 h-4" />
        Contactar
      </button>

    </motion.div>
  );
};