import React, { useState, useEffect } from 'react';
import { MapView } from './features/Map/MapView';
import { obtenerLugaresConCache } from './services/api';
import { Compass, Mic, Send, User, MoreHorizontal, AlertTriangle, HelpCircle, X, Check } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Preloader } from './components/ui/Preloader';
import { WelcomeCarousel } from './features/Onboarding/WelcomeCarousel.jsx';
import { DimeRobotIcon } from './components/ui/DimeRobotIcon';
import dimeIcon from './assets/dime-icon.png';

function App() {
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [lugarSeleccionado, setLugarSeleccionado] = useState(null);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [modalReporte, setModalReporte] = useState(false);
  const [modalAyuda, setModalAyuda] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [textoReporte, setTextoReporte] = useState('');
  const [mensajeChat, setMensajeChat] = useState('');
  const [tecladoVisible, setTecladoVisible] = useState(false);
  const [alturaTeclado, setAlturaTeclado] = useState(0);
  const [posicionChat, setPosicionChat] = useState('1rem');
  const [lugares, setLugares] = useState([]);
  const [errorCarga, setErrorCarga] = useState(null);
  
  // Cargar datos desde la API
  useEffect(() => {
    const cargarDatos = async () => {
      const inicioTiempo = Date.now();
      const tiempoMinimoPreloader = 2500; // Mínimo 2.5 segundos para ver los mensajes
      
      try {
        setLoading(true);
        setErrorCarga(null);
        
        // Timeout de seguridad (máximo 10 segundos)
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout: La API tardó demasiado en responder')), 10000)
        );
        
        // Obtener lugares desde la API con caché
        const lugaresData = await Promise.race([
          obtenerLugaresConCache(),
          timeoutPromise
        ]);
        
        if (lugaresData && lugaresData.length > 0) {
          setLugares(lugaresData);
        } else {
          // Si no hay datos, usar datos de prueba como fallback
          const datosPrueba = await import('./data/datos_prueba.json');
          setLugares(datosPrueba.default);
        }
      } catch (error) {
        setErrorCarga(error.message);
        
        // En caso de error, usar datos de prueba como fallback
        try {
          const datosPrueba = await import('./data/datos_prueba.json');
          setLugares(datosPrueba.default);
        } catch (fallbackError) {
          // Si incluso el fallback falla, usar array vacío
          setLugares([]);
        }
      } finally {
        // Calcular cuánto tiempo ha pasado
        const tiempoTranscurrido = Date.now() - inicioTiempo;
        const tiempoRestante = Math.max(0, tiempoMinimoPreloader - tiempoTranscurrido);
        
        // Esperar el tiempo restante para cumplir el mínimo
        if (tiempoRestante > 0) {
          await new Promise(resolve => setTimeout(resolve, tiempoRestante));
        }
        
        // Siempre establecer loading a false después del tiempo mínimo
        setLoading(false);
        
        // Verificamos si es la primera vez que el usuario usa la app
        const hasSeenOnboarding = localStorage.getItem('dime-onboarding-completed');
        if (!hasSeenOnboarding) {
          // Solo mostramos el onboarding si no lo ha visto antes
          setShowOnboarding(true);
        }
      }
    };

    cargarDatos();
  }, []);

  // Detectar cuando el teclado está visible usando múltiples métodos
  useEffect(() => {
    const handleViewportChange = () => {
      if (typeof window !== 'undefined' && window.visualViewport) {
        const viewportHeight = window.visualViewport.height;
        const windowHeight = window.innerHeight;
        const diferencia = windowHeight - viewportHeight;
        // El teclado está visible si el viewport es significativamente menor
        const visible = diferencia > 150; // Más de 150px de diferencia indica teclado
        setTecladoVisible(visible);
        if (visible) {
          // Calcular la altura del teclado (diferencia entre window y viewport)
          setAlturaTeclado(diferencia);
          // Posicionar el chat justo encima del teclado (8px de espacio como WhatsApp)
          setPosicionChat('8px');
        } else {
          setAlturaTeclado(0);
          setPosicionChat('1rem');
        }
      }
    };

    const handleResize = () => {
      if (typeof window !== 'undefined' && window.visualViewport) {
        handleViewportChange();
      }
    };

    if (typeof window !== 'undefined') {
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', handleViewportChange);
        window.visualViewport.addEventListener('scroll', handleViewportChange);
      }
      window.addEventListener('resize', handleResize);
      
      // Verificar inicialmente
      handleViewportChange();
    }

    return () => {
      if (typeof window !== 'undefined') {
        if (window.visualViewport) {
          window.visualViewport.removeEventListener('resize', handleViewportChange);
          window.visualViewport.removeEventListener('scroll', handleViewportChange);
        }
        window.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  // Función que se ejecuta cuando el usuario completa el onboarding
  const handleOnboardingComplete = () => {
    // Guardamos en localStorage que el usuario ya completó el onboarding
    localStorage.setItem('dime-onboarding-completed', 'true');
    setShowOnboarding(false);
  };

  const manejarClickEnMarcador = (lugar) => {
    setLugarSeleccionado(lugar);
  };

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <Preloader key="loader" />
      ) : showOnboarding ? (
        <WelcomeCarousel key="onboarding" onComplete={handleOnboardingComplete} />
      ) : (
        <motion.div 
          key="app" 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="h-full w-full relative bg-gray-100 overflow-hidden flex flex-col font-sans"
        >
          {/* --- 1. HEADER FLOTANTE (Estilo 'Tolú 360') --- */}
          {/* --- 1. HEADER FLOTANTE (Estilo Barra de Búsqueda) --- */}
          {/* CAMBIO: Usamos left-4 y right-4 para que mida IGUAL que el chat de abajo */}
          {/* --- 1. HEADER FLOTANTE (Corregido: Solo DIME) --- */}
          <motion.div 
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="absolute top-4 left-4 right-4 z-[1000] flex justify-center pointer-events-none"
          >
            <div className="bg-white w-full px-5 py-3 rounded-full shadow-xl flex items-center justify-between pointer-events-auto border border-gray-100">
          
          <div className="flex items-center gap-1.5">
             {/* Icono Brújula */}
            <div className="bg-blue-50 p-2 rounded-full">
              <img 
                src={dimeIcon} 
                alt="DIME" 
                className="w-5 h-5 object-contain"
              />
            </div>
            {/* Solo el Título DIME */}
            <h1 className="font-bold text-xl leading-none tracking-tight" style={{ color: '#1c528b' }}>D I M E</h1>
          </div>

          {/* --- MENÚ DE TRES PUNTOS --- */}
          <div className="relative pointer-events-auto">
            
            <button 
              onClick={() => setMenuAbierto(!menuAbierto)}
              className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors active:scale-95"
            >
              <MoreHorizontal className="text-blue-400 w-6 h-6" />
            </button>

            {/* DROPDOWN MENU */}
            {menuAbierto && (
              <>
                <div className="fixed inset-0 z-[1001]" onClick={() => setMenuAbierto(false)}></div>
                
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                  className="absolute top-12 right-0 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[1002] overflow-hidden origin-top-right"
                >
                  
                  {/* Opción 1: Reportar error */}
                  <button 
                    className="w-full text-left px-5 py-4 hover:bg-blue-50 text-gray-700 text-sm flex items-center gap-3 transition-colors border-b border-gray-50"
                    onClick={() => { setModalReporte(true); setMenuAbierto(false); }}
                  >
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    <span>Reportar error</span>
                  </button>

                  {/* Opción 2: Ayuda */}
                  <button 
                    className="w-full text-left px-5 py-4 hover:bg-blue-50 text-gray-700 text-sm flex items-center gap-3 transition-colors"
                    onClick={() => { setModalAyuda(true); setMenuAbierto(false); }}
                  >
                    <HelpCircle className="w-4 h-4 text-blue-500" />
                    <span>Ayuda / Acerca de</span>
                  </button>

                </motion.div>
              </>
            )}
          </div>

            </div>
          </motion.div>

          {/* --- 2. EL MAPA (Fondo) --- */}
          {/* Ocupa toda la pantalla detrás de los elementos flotantes */}
          <motion.div 
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
            className="absolute inset-0 z-0"
          >
            <MapView 
              lugares={lugares} 
              lugarSeleccionado={lugarSeleccionado}
              onMarkerClick={manejarClickEnMarcador}
            />
          </motion.div>

          {/* --- 3. INTERFAZ DE CHAT (Estilo Burbuja Inferior) --- */}
          {/* Esta es la parte clave de tu imagen */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className={`absolute left-4 right-4 flex flex-col justify-end pointer-events-none ${
              tecladoVisible ? 'z-[99999]' : 'z-[1000]'
            }`}
            style={{ 
              bottom: posicionChat,
              paddingBottom: tecladoVisible ? '0' : 'max(1rem, env(safe-area-inset-bottom))',
              transition: 'bottom 0.3s ease-out, padding-bottom 0.3s ease-out'
            }}
          >
            {/* Tarjeta contenedora del Chat */}
            <div className="bg-white rounded-[2rem] shadow-2xl p-5 pointer-events-auto border border-gray-100">
          
          {/* A. Mensaje de Bienvenida (Avatar + Texto) */}
          <div className="flex items-start gap-3 mb-4">
            {/* Avatar Robot DIME */}
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0 shadow-md border-2 border-blue-600 p-1">
              <DimeRobotIcon className="w-8 h-8" />
            </div>
            {/* Burbuja de Texto */}
            <div className="bg-gray-100 text-gray-700 px-4 py-2 rounded-2xl rounded-tl-none text-sm font-medium shadow-sm leading-relaxed">
              Soy DIME-IA, ¿en qué te puedo ayudar?
            </div>
          </div>

          {/* B. Barra de Entrada (Micrófono y Enviar) */}
          <div className="flex items-center gap-4 mt-2 pl-1">
            {/* Botón Micrófono */}
            <button className="text-gray-400 hover:text-blue-600 transition-colors active:scale-90">
              <Mic className="w-6 h-6" />
            </button>

            {/* Input invisible (para que se vea limpio) */}
            <div className="flex-1 h-10 bg-gray-50 rounded-full px-4 flex items-center border border-transparent focus-within:border-blue-200 transition-all">
              <input 
                type="text" 
                value={mensajeChat}
                onChange={(e) => setMensajeChat(e.target.value)}
                onFocus={() => {
                  // Forzar detección cuando el input recibe foco
                  setTimeout(() => {
                    if (typeof window !== 'undefined' && window.visualViewport) {
                      const viewportHeight = window.visualViewport.height;
                      const windowHeight = window.innerHeight;
                      const diferencia = windowHeight - viewportHeight;
                      const visible = diferencia > 150;
                      setTecladoVisible(visible);
                      if (visible) {
                        setAlturaTeclado(diferencia);
                        setPosicionChat('8px');
                      } else {
                        setPosicionChat('1rem');
                      }
                    }
                  }, 300);
                }}
                onBlur={() => {
                  // Pequeño delay para que el teclado se oculte primero
                  setTimeout(() => {
                    setTecladoVisible(false);
                    setAlturaTeclado(0);
                    setPosicionChat('1rem');
                  }, 100);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && mensajeChat.trim()) {
                    // Aquí irá la lógica para enviar el mensaje
                    setMensajeChat('');
                  }
                }}
                placeholder="Escribe o habla..." 
                className="w-full bg-transparent outline-none text-gray-600 text-sm placeholder-gray-400"
              />
            </div>

            {/* Botón Enviar */}
            <button 
              onClick={() => {
                if (mensajeChat.trim()) {
                  // Aquí irá la lógica para enviar el mensaje
                  setMensajeChat('');
                }
              }}
              disabled={!mensajeChat.trim()}
              className={`transition-all active:scale-90 rotate-0 hover:-rotate-12 transition-transform ${
                mensajeChat.trim() 
                  ? 'text-blue-600 hover:text-blue-700' 
                  : 'text-gray-300 cursor-not-allowed'
              }`}
            >
              <Send className="w-6 h-6" />
            </button>
            </div>

          </div>
          </motion.div>

              {/* --- 4. MODALES (VENTANAS EMERGENTES) --- */}
          {/* A. MODAL DE REPORTE */}
          {modalReporte && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
              onClick={() => {
                setModalReporte(false);
                setEnviado(false);
                setTextoReporte('');
              }}
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative"
              >
        
            <button 
              onClick={() => {
                setModalReporte(false);
                setEnviado(false);
                setTextoReporte('');
              }} 
              className="absolute top-4 right-4 bg-gray-50 p-2 rounded-full text-gray-400 hover:text-red-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {!enviado ? (
              <>
                <div className="bg-orange-50 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-orange-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Reportar inconsistencia</h2>
                <p className="text-gray-500 text-sm mb-4">¿Encontraste un dato erróneo? Ayuda a DIME a mejorar para todos.</p>
                
                <textarea 
                  value={textoReporte}
                  onChange={(e) => setTextoReporte(e.target.value)}
                  className="w-full bg-gray-50 rounded-xl p-3 text-sm text-gray-700 border border-gray-200 focus:border-blue-500 outline-none h-24 resize-none mb-4"
                  placeholder="Ej: El horario de la biblioteca está mal..."
                ></textarea>
                
                <button 
                  onClick={() => {
                    if (textoReporte.trim()) {
                      setEnviado(true);
                      // Aquí podrías agregar lógica para enviar el reporte a una API
                    }
                  }}
                  disabled={!textoReporte.trim()}
                  className={`w-full font-bold py-3 rounded-xl active:scale-95 transition-all ${
                    textoReporte.trim() 
                      ? 'bg-gray-900 text-white hover:bg-gray-800' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Enviar
                </button>
              </>
            ) : (
              <div className="text-center py-6">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">¡Gracias!</h3>
                <p className="text-gray-500 text-sm">Tu reporte ayuda a conectar mejor a Tolú.</p>
                <button 
                  onClick={() => {
                    setModalReporte(false);
                    setEnviado(false);
                    setTextoReporte('');
                  }} 
                  className="mt-6 text-blue-600 font-semibold text-sm hover:text-blue-700 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            )}
              </motion.div>
            </motion.div>
          )}

          {/* B. MODAL DE AYUDA / CRÉDITOS */}
          {modalAyuda && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
              onClick={() => setModalAyuda(false)}
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative text-center"
              >
            
            <button 
              onClick={() => setModalAyuda(false)} 
              className="absolute top-4 right-4 bg-gray-50 p-2 rounded-full text-gray-400 hover:text-red-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="bg-blue-50 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="w-8 h-8 text-blue-600" />
            </div>
            
            <h2 className="text-2xl font-bold mb-1" style={{ color: '#1c528b' }}>DIME</h2>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-widest mb-6">Versión Prototipo 1.0</p>
            
            <div className="text-left space-y-4 mb-6">
              <div className="flex gap-3">
                <div className="bg-gray-100 p-2 rounded-lg h-min"><Mic className="w-4 h-4 text-gray-600"/></div>
                <div>
                  <h4 className="font-bold text-gray-800 text-sm">Asistente de voz</h4>
                  <p className="text-xs text-gray-500">Pregunta naturalmente para encontrar trámites.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="bg-gray-100 p-2 rounded-lg h-min"><AlertTriangle className="w-4 h-4 text-gray-600"/></div>
                <div>
                  <h4 className="font-bold text-gray-800 text-sm">Ayúdanos a mejorar</h4>
                  <p className="text-xs text-gray-500">¿Encontraste un dato erróneo? Ayuda a DIME a mejorar para todos.</p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-400">Desarrollado para el Concurso<br/>Datos al Ecosistema 2025</p>
            </div>

              </motion.div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default App;