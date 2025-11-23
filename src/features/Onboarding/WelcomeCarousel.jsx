import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Mic, WifiOff, ArrowRight, Check } from 'lucide-react';

export const WelcomeCarousel = ({ onComplete }) => {
  const [paso, setPaso] = useState(0);

  // Los 3 Pasos de tu Onboarding
  const slides = [
    {
      id: 1,
      titulo: "Tolú en tu mano",
      texto: "Encuentra colegios, puestos de salud y oficinas públicas en un solo lugar. Todo georreferenciado.",
      icono: <MapPin className="w-16 h-16 text-blue-600" />,
      color: "bg-blue-50"
    },
    {
      id: 2,
      titulo: "Habla con DIME-IA",
      texto: "¿No quieres escribir? Presiona el micrófono y DIME-IA te escuchará para guiarte.",
      icono: <Mic className="w-16 h-16 text-purple-600" />,
      color: "bg-purple-50"
    },
    {
      id: 3,
      titulo: "¿Sin acceso a Internet?",
      texto: "No importa. DIME-IA guarda el directorio en tu celular para que lo consultes en cualquier lugar.",
      icono: <WifiOff className="w-16 h-16 text-orange-500" />,
      color: "bg-orange-50"
    }
  ];

  const siguientePaso = () => {
    if (paso < slides.length - 1) {
      setPaso(paso + 1);
    } else {
      onComplete(); // Avisa a App.jsx que terminamos
    }
  };

  return (
    <div className="fixed inset-0 z-[4000] bg-white flex flex-col items-center justify-between p-8 font-sans">
      
      {/* Botón Saltar (arriba derecha) */}
      <button 
        onClick={onComplete}
        className="self-end text-gray-400 font-medium text-sm hover:text-blue-600"
      >
        Saltar
      </button>

      {/* --- EL CONTENIDO DESLIZABLE --- */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={paso}
            initial={{ x: 50, opacity: 0, scale: 0.9 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: -50, opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex flex-col items-center"
          >
            {/* Círculo del Icono */}
            <motion.div 
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
              className={`p-8 rounded-full mb-8 ${slides[paso].color} shadow-xl shadow-gray-100`}
            >
              {slides[paso].icono}
            </motion.div>

            {/* Textos */}
            <motion.h2 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="text-2xl font-bold text-gray-900 mb-4 leading-tight"
            >
              {slides[paso].titulo}
            </motion.h2>
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              className="text-gray-500 leading-relaxed"
            >
              {slides[paso].texto}
            </motion.p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* --- CONTROLES INFERIORES --- */}
      <div className="w-full max-w-sm flex items-center justify-between mt-8">
        
        {/* Indicadores de Puntos (Dots) */}
        <div className="flex gap-2">
          {slides.map((_, index) => (
            <div 
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === paso ? "w-8 bg-blue-600" : "w-2 bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* Botón Siguiente / Empezar */}
        <button
          onClick={siguientePaso}
          className="bg-blue-600 text-white p-4 rounded-full shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-90 transition-all flex items-center justify-center"
        >
          {paso === slides.length - 1 ? (
            <Check className="w-6 h-6" /> // Check si es el último
          ) : (
            <ArrowRight className="w-6 h-6" /> // Flecha si faltan
          )}
        </button>
      </div>

    </div>
  );
};

