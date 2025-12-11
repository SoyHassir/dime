import React, { useState, useEffect } from 'react';
import { MapView } from './features/Map/MapView';
import { obtenerLugaresConCache } from './services/api';
import { Mic, Send, User, MoreHorizontal, AlertTriangle, HelpCircle, X, Check, ChevronDown, Volume2, VolumeX } from 'lucide-react';
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
  const [tipoError, setTipoError] = useState('');
  const [mensajeChat, setMensajeChat] = useState('');
  const [mensajesChat, setMensajesChat] = useState([
    { tipo: 'bot', texto: 'Soy DIME-IA, ¿en qué te puedo ayudar?' }
  ]);
  const [cargandoRespuesta, setCargandoRespuesta] = useState(false);
  const [chatMinimizado, setChatMinimizado] = useState(false);
  const [tecladoVisible, setTecladoVisible] = useState(false);
  const [alturaTeclado, setAlturaTeclado] = useState(0);
  const [posicionChat, setPosicionChat] = useState('1rem');
  const [vozActiva, setVozActiva] = useState(true);
  const [escuchando, setEscuchando] = useState(false);
  const [respondiendo, setRespondiendo] = useState(false);
  const [lugares, setLugares] = useState([]);
  const [errorCarga, setErrorCarga] = useState(null);
  
  useEffect(() => {
    const cargarDatos = async () => {
      const inicioTiempo = Date.now();
      const tiempoMinimoPreloader = 2500;
      
      try {
        setLoading(true);
        setErrorCarga(null);
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout: La API tardó demasiado en responder')), 10000)
        );
        
        const lugaresData = await Promise.race([
          obtenerLugaresConCache(),
          timeoutPromise
        ]);
        
        if (lugaresData && lugaresData.length > 0) {
          setLugares(lugaresData);
        } else {
          setLugares([]);
        }
      } catch (error) {
        setErrorCarga(error.message);
        setLugares([]);
      } finally {
        const tiempoTranscurrido = Date.now() - inicioTiempo;
        const tiempoRestante = Math.max(0, tiempoMinimoPreloader - tiempoTranscurrido);
        
        if (tiempoRestante > 0) {
          await new Promise(resolve => setTimeout(resolve, tiempoRestante));
        }
        
        setLoading(false);
        
        const hasSeenOnboarding = localStorage.getItem('dime-onboarding-completed');
        if (!hasSeenOnboarding) {
          setShowOnboarding(true);
        }
      }
    };

    cargarDatos();
  }, []);

  const hablar = (texto) => {
    if (!vozActiva || !window.speechSynthesis) {
      if (escuchando) {
        setEscuchando(false);
        setRespondiendo(false);
      }
      return;
    }

    window.speechSynthesis.cancel(); 
    const locucion = new SpeechSynthesisUtterance(texto);
    locucion.lang = 'es-CO';
    locucion.rate = 1.0; 
    locucion.pitch = 1.0; 
    
    const voces = window.speechSynthesis.getVoices();
    const vozEspanola = voces.find(v => v.lang.startsWith('es'));
    if (vozEspanola) locucion.voice = vozEspanola;

    locucion.onstart = () => {
      setRespondiendo(true);
    };

    locucion.onend = () => {
      setRespondiendo(false);
      setEscuchando(false);
      reproducirSonidoFin();
    };

    locucion.onerror = () => {
      setRespondiendo(false);
      setEscuchando(false);
    };

    window.speechSynthesis.speak(locucion);
  };

  const reproducirSonidoInicio = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
      oscillator.frequency.linearRampToValueAtTime(800, audioContext.currentTime + 0.15);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.05);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.15);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.15);
    } catch (error) {
    }
  };

  const reproducirSonidoFin = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
      oscillator.frequency.linearRampToValueAtTime(300, audioContext.currentTime + 0.12);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.03);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.12);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.12);
    } catch (error) {
    }
  };

  const activarVozInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Tu navegador no soporta comandos de voz. Por favor usa el teclado.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-CO';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    reproducirSonidoInicio();
    setEscuchando(true);
    recognition.start();

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      
      reproducirSonidoFin();
      
      if (transcript.trim()) {
        enviarMensaje(transcript, true);
      } else {
        setEscuchando(false);
      }
    };

    recognition.onerror = (event) => {
      console.error("Error de voz:", event.error);
      
      setEscuchando(false);
      setRespondiendo(false);
      reproducirSonidoFin();
      
      if (event.error === 'not-allowed') {
        alert("⚠️ Permiso denegado. Ve a Configuración > Safari > Micrófono y permite el acceso a DIME.");
      } else if (event.error === 'service-not-allowed') {
        alert("⚠️ Error de servicio. Asegúrate de tener activado el 'Dictado' en la configuración de tu iPhone.");
      } else if (event.error === 'network') {
        alert("Error de conexión. Verifica tu internet e intenta de nuevo.");
      } else if (event.error === 'no-speech') {
        alert("No se detectó voz. Intenta hablar más fuerte o más cerca del micrófono.");
      } else if (event.error === 'audio-capture') {
        alert("No se pudo acceder al micrófono. Verifica los permisos en la configuración de tu dispositivo.");
      } else if (event.error === 'aborted') {
        return;
      } else {
        alert(`No te escuché bien. Intenta acercarte al micrófono. Error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      if (escuchando) {
        setEscuchando(false);
        reproducirSonidoFin();
      }
    };

    window.currentRecognition = recognition;
  };

  const enviarMensaje = async (mensaje, desdeVoz = false) => {
    if (!mensaje.trim()) return;
    
    const nuevoMensajeUsuario = { tipo: 'usuario', texto: mensaje.trim() };
    setMensajesChat(prev => [...prev, nuevoMensajeUsuario]);
    setMensajeChat('');
    setCargandoRespuesta(true);
    
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      
      const response = await fetch(`${backendUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pregunta: mensaje.trim() })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const respuestaBot = { tipo: 'bot', texto: data.respuesta };
      setMensajesChat(prev => [...prev, respuestaBot]);
      
      if (desdeVoz) {
        hablar(data.respuesta);
      }
      
      setTimeout(() => {
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
          chatMessages.scrollTop = chatMessages.scrollHeight;
        }
      }, 100);
    } catch (error) {
      const mensajeError = { 
        tipo: 'bot', 
        texto: `Lo siento, hubo un problema al procesar tu mensaje. ${error.message || 'Por favor, intenta de nuevo.'}` 
      };
      setMensajesChat(prev => [...prev, mensajeError]);
      if (desdeVoz) {
        hablar(mensajeError.texto);
      }
    } finally {
      setCargandoRespuesta(false);
    }
  };

  useEffect(() => {
    const handleViewportChange = () => {
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

  const handleOnboardingComplete = () => {
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
          <motion.div 
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="absolute top-4 left-4 right-4 z-[1000] flex justify-center pointer-events-none"
          >
            <div className="bg-white w-full px-5 py-3 rounded-2xl shadow-lg flex items-center justify-between pointer-events-auto border border-gray-100">
          
          <div className="flex items-center gap-1.5">
            <div className="bg-blue-50 p-2 rounded-full">
              <img 
                src={dimeIcon} 
                alt="DIME" 
                className="w-5 h-5 object-contain"
              />
            </div>
            <h1 className="font-bold text-xl leading-none tracking-tight" style={{ color: '#1c528b' }}>D I M E</h1>
          </div>

          <div className="relative pointer-events-auto">
            
            <button 
              onClick={() => setMenuAbierto(!menuAbierto)}
              className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors active:scale-95"
            >
              <MoreHorizontal className="text-blue-400 w-6 h-6" />
            </button>

            {menuAbierto && (
              <>
                <div className="fixed inset-0 z-[1001]" onClick={() => setMenuAbierto(false)}></div>
                
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                  className="absolute top-14 right-0 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[1002] overflow-hidden origin-top-right"
                >
                  <button 
                    className="w-full text-left px-5 py-4 hover:bg-blue-50 text-gray-700 text-sm flex items-center gap-3 transition-colors border-b border-gray-50"
                    onClick={() => { setModalReporte(true); setMenuAbierto(false); }}
                  >
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    <span>Reportar error</span>
                  </button>

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

          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className={`absolute left-4 right-4 flex flex-col justify-end pointer-events-none ${
              tecladoVisible ? 'z-[99999]' : 'z-[1000]'
            } ${modalReporte || modalAyuda ? 'hidden' : ''}`}
            style={{ 
              bottom: posicionChat,
              paddingBottom: tecladoVisible ? '0' : 'max(1rem, env(safe-area-inset-bottom))',
              transition: 'bottom 0.3s ease-out, padding-bottom 0.3s ease-out'
            }}
          >
            {chatMinimizado ? (
              <button
                onClick={() => setChatMinimizado(false)}
                className="bg-white rounded-full p-2 shadow-2xl pointer-events-auto hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center border-2 border-gray-200"
                style={{ width: '56px', height: '56px' }}
              >
                <DimeRobotIcon className="w-10 h-10" />
              </button>
            ) : (
              <div className="bg-white rounded-[2rem] shadow-2xl pointer-events-auto border border-gray-100">
                <div className="flex justify-end items-center p-3 pb-0">
                  <button
                    onClick={() => setChatMinimizado(true)}
                    className="text-gray-400 hover:text-gray-600 transition-colors active:scale-90 p-1"
                    title="Minimizar chat"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="px-5 pb-5">
          <div 
            id="chat-messages"
            className="max-h-64 overflow-y-auto mb-4 space-y-3 pr-2"
            style={{ scrollBehavior: 'smooth' }}
          >
            {mensajesChat.map((mensaje, index) => (
              <div 
                key={index}
                className={`flex items-start gap-3 ${mensaje.tipo === 'usuario' ? 'flex-row-reverse' : ''}`}
              >
                {mensaje.tipo === 'bot' && (
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0 shadow-md border-2 border-blue-600 p-1">
                    <DimeRobotIcon className="w-8 h-8" />
                  </div>
                )}
                {mensaje.tipo === 'usuario' && (
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shrink-0 shadow-md">
                    <User className="w-6 h-6 text-white" />
                  </div>
                )}
                <div className={`px-4 py-2 rounded-2xl text-sm font-medium shadow-sm leading-relaxed ${
                  mensaje.tipo === 'bot' 
                    ? 'bg-gray-100 text-gray-700 rounded-tl-none' 
                    : 'bg-blue-600 text-white rounded-tr-none'
                }`}>
                  {mensaje.texto}
                </div>
              </div>
            ))}
            {cargandoRespuesta && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0 shadow-md border-2 border-blue-600 p-1">
                  <DimeRobotIcon className="w-8 h-8" />
                </div>
                <div className="bg-gray-100 text-gray-700 px-4 py-2 rounded-2xl rounded-tl-none text-sm font-medium shadow-sm">
                  <span className="inline-flex items-center gap-1">
                    <span className="animate-bounce">.</span>
                    <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 mt-2 pl-1">
            <button 
              onClick={() => {
                setVozActiva(!vozActiva);
                window.speechSynthesis.cancel(); 
              }}
              className="text-gray-400 hover:text-blue-600 transition-colors active:scale-90"
              title={vozActiva ? "Silenciar voz" : "Activar voz"}
            >
              {vozActiva ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
            </button>

            <button 
              onClick={activarVozInput}
              className={`transition-colors active:scale-90 ${
                escuchando || respondiendo
                  ? 'text-blue-600' 
                  : 'text-gray-400 hover:text-blue-600'
              }`}
              title={escuchando || respondiendo ? "Escuchando..." : "Hablar"}
              disabled={escuchando || respondiendo}
            >
              <Mic className="w-6 h-6" />
            </button>

            <div className="flex-1 h-10 bg-gray-50 rounded-full px-4 flex items-center border border-transparent focus-within:border-blue-200 transition-all">
              <input 
                type="text" 
                value={mensajeChat}
                onChange={(e) => setMensajeChat(e.target.value)}
                onFocus={() => {
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
                  setTimeout(() => {
                    setTecladoVisible(false);
                    setAlturaTeclado(0);
                    setPosicionChat('1rem');
                  }, 100);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && mensajeChat.trim() && !cargandoRespuesta) {
                    enviarMensaje(mensajeChat);
                  }
                }}
                placeholder="Escribe o habla..." 
                className="w-full bg-transparent outline-none text-gray-600 text-sm placeholder-gray-400"
              />
            </div>

            <button 
              onClick={() => {
                if (mensajeChat.trim() && !cargandoRespuesta) {
                  enviarMensaje(mensajeChat);
                }
              }}
              disabled={!mensajeChat.trim() || cargandoRespuesta}
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
              </div>
            )}
          </motion.div>

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
                setTipoError('');
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
                setTipoError('');
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
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de error
                  </label>
                  <select
                    value={tipoError}
                    onChange={(e) => setTipoError(e.target.value)}
                    className="w-full bg-gray-50 rounded-xl p-3 text-sm text-gray-700 border border-gray-200 focus:border-blue-500 outline-none appearance-none cursor-pointer"
                  >
                    <option value="">Selecciona el tipo de error...</option>
                    <option value="direccion-incorrecta">Dirección incorrecta</option>
                    <option value="telefono-incorrecto">Número de teléfono incorrecto</option>
                    <option value="horario-equivocado">Horario equivocado</option>
                    <option value="nombre-incorrecto">Nombre de la entidad incorrecto</option>
                    <option value="categoria-incorrecta">Categoría incorrecta</option>
                    <option value="ubicacion-mapa-incorrecta">Ubicación en el mapa incorrecta</option>
                    <option value="informacion-desactualizada">Información desactualizada</option>
                    <option value="entidad-no-existe">Entidad ya no existe</option>
                    <option value="barrio-zona-incorrecta">Barrio o zona incorrecta</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mensaje detallado
                  </label>
                <textarea 
                  value={textoReporte}
                  onChange={(e) => setTextoReporte(e.target.value)}
                    className="w-full bg-gray-50 rounded-xl p-3 text-sm text-gray-700 border border-gray-200 focus:border-blue-500 outline-none h-24 resize-none"
                    placeholder="Describe el error con más detalle... (Ej: El horario indica 8 AM pero en realidad abre a las 7 AM)"
                ></textarea>
                </div>
                
                <button 
                  onClick={() => {
                    if (tipoError && textoReporte.trim()) {
                      setEnviado(true);
                    }
                  }}
                  disabled={!tipoError || !textoReporte.trim()}
                  className={`w-full font-bold py-3 rounded-xl active:scale-95 transition-all ${
                    tipoError && textoReporte.trim()
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
                    setTipoError('');
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
              <p className="text-xs text-gray-400">Hecho con 💙 y sabor sincelejano <br/>para guiar a Tolú.</p>
            </div>

              </motion.div>
            </motion.div>
          )}

          {escuchando && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-[3000] flex items-center justify-center bg-white/80 backdrop-blur-md"
            >
              <button
                onClick={() => {
                  if (window.currentRecognition) {
                    window.currentRecognition.stop();
                    window.currentRecognition = null;
                  }
                  if (window.speechSynthesis) {
                    window.speechSynthesis.cancel();
                  }
                  setEscuchando(false);
                  setRespondiendo(false);
                  reproducirSonidoFin();
                }}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-200/80 hover:bg-gray-300/80 flex items-center justify-center transition-colors z-[3001]"
                title="Cerrar"
              >
                <X className="w-6 h-6 text-gray-700" />
              </button>

              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                className="flex flex-col items-center justify-center"
              >
                <div className="relative mb-8">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="absolute w-32 h-32 bg-blue-600/20 rounded-full animate-ping"></div>
                    <div className="absolute w-24 h-24 bg-blue-600/30 rounded-full animate-ping" style={{ animationDelay: '0.2s' }}></div>
                    <div className="absolute w-16 h-16 bg-blue-600/40 rounded-full animate-ping" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                  
                  <div className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-2xl ${
                    respondiendo ? 'bg-green-600' : 'bg-blue-600'
                  }`}>
                    {respondiendo ? (
                      <DimeRobotIcon className="w-10 h-10" />
                    ) : (
                      <Mic className="w-10 h-10 text-white" />
                    )}
                  </div>
                </div>

                {respondiendo ? (
                  <>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Respondiendo...</h2>
                    <p className="text-gray-600 text-sm">DIME está hablando</p>
                  </>
                ) : cargandoRespuesta ? (
                  <>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Procesando...</h2>
                    <p className="text-gray-600 text-sm">Pensando en tu pregunta</p>
                  </>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Escuchando...</h2>
                    <p className="text-gray-600 text-sm">Di tu pregunta ahora</p>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default App;