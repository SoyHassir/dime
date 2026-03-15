/**
 * Pagina principal: mapa, chat y menu.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapView } from '../features/Map/MapView';
import { Mic, Send, User, MoreHorizontal, AlertTriangle, HelpCircle, X, Check, ChevronDown, Volume2, VolumeX } from 'lucide-react';
import { DimeRobotIcon } from '../components/ui/DimeRobotIcon';
import dimeIcon from '../assets/dime-icon.png';
import { enviarMensajeChat } from '../services/chatService';
import { trackMarkerClick, trackChatMessageSent, trackChatMessageReceived, trackVoiceInput, trackReportSubmitted } from '../services/analyticsService';

export function HomePage({ lugares }) {
  const [lugarSeleccionado, setLugarSeleccionado] = useState(null);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [modalReporte, setModalReporte] = useState(false);
  const [modalAyuda, setModalAyuda] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [textoReporte, setTextoReporte] = useState('');
  const [tipoError, setTipoError] = useState('');
  const [mensajeChat, setMensajeChat] = useState('');
  const [mensajesChat, setMensajesChat] = useState([{ tipo: 'bot', texto: 'Soy DIME-IA, ¿en qué te puedo ayudar?' }]);
  const [cargandoRespuesta, setCargandoRespuesta] = useState(false);
  const [chatMinimizado, setChatMinimizado] = useState(false);
  const [tecladoVisible, setTecladoVisible] = useState(false);
  const [posicionChat, setPosicionChat] = useState('1rem');
  const [vozActiva, setVozActiva] = useState(true);
  const [escuchando, setEscuchando] = useState(false);
  const [respondiendo, setRespondiendo] = useState(false);

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
    const vozEspanola = voces.find((v) => v.lang.startsWith('es'));
    if (vozEspanola) locucion.voice = vozEspanola;
    locucion.onstart = () => setRespondiendo(true);
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
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.15);
      osc.type = 'sine';
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch {}
  };

  const reproducirSonidoFin = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(300, ctx.currentTime + 0.12);
      osc.type = 'sine';
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.03);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.12);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
    } catch {}
  };

  const activarVozInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Tu navegador no soporta comandos de voz. Por favor usa el teclado.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-CO';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;
    trackVoiceInput();
    reproducirSonidoInicio();
    setEscuchando(true);
    recognition.start();
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      reproducirSonidoFin();
      if (transcript.trim()) enviarMensaje(transcript, true);
      else setEscuchando(false);
    };
    recognition.onerror = (e) => {
      setEscuchando(false);
      setRespondiendo(false);
      reproducirSonidoFin();
      if (e.error === 'not-allowed') alert('Permiso denegado. Permite el acceso al microfono en la configuracion.');
      else if (e.error === 'no-speech') alert('No se detecto voz. Intenta hablar mas fuerte.');
      else if (e.error !== 'aborted') alert(`Error: ${e.error}`);
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
    trackChatMessageSent();
    setMensajesChat((prev) => [...prev, { tipo: 'usuario', texto: mensaje.trim() }]);
    setMensajeChat('');
    setCargandoRespuesta(true);
    try {
      const data = await enviarMensajeChat(mensaje);
      const depth = mensajesChat.length + 2; // usuario + bot
      trackChatMessageReceived(depth);
      setMensajesChat((prev) => [...prev, { tipo: 'bot', texto: data.respuesta }]);
      if (desdeVoz) hablar(data.respuesta);
      setTimeout(() => {
        const el = document.getElementById('chat-messages');
        if (el) el.scrollTop = el.scrollHeight;
      }, 100);
    } catch (error) {
      const texto = `Lo siento, hubo un problema. ${error.apiMessage || error.message || 'Intenta de nuevo.'}`;
      setMensajesChat((prev) => [...prev, { tipo: 'bot', texto }]);
      if (desdeVoz) hablar(texto);
    } finally {
      setCargandoRespuesta(false);
    }
  };

  useEffect(() => {
    const handleViewportChange = () => {
      if (typeof window !== 'undefined' && window.visualViewport) {
        const diff = window.innerHeight - window.visualViewport.height;
        const visible = diff > 150;
        setTecladoVisible(visible);
        setPosicionChat(visible ? '8px' : '1rem');
      }
    };
    if (typeof window !== 'undefined') {
      window.visualViewport?.addEventListener('resize', handleViewportChange);
      window.visualViewport?.addEventListener('scroll', handleViewportChange);
      window.addEventListener('resize', handleViewportChange);
      handleViewportChange();
    }
    return () => {
      window.visualViewport?.removeEventListener('resize', handleViewportChange);
      window.visualViewport?.removeEventListener('scroll', handleViewportChange);
      window.removeEventListener('resize', handleViewportChange);
    };
  }, []);

  useEffect(() => {
    setChatMinimizado(!!lugarSeleccionado);
  }, [lugarSeleccionado]);

  const cerrarModalReporte = () => {
    setModalReporte(false);
    setEnviado(false);
    setTextoReporte('');
    setTipoError('');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="h-full w-full relative bg-gray-100 overflow-hidden flex flex-col font-sans"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        className="absolute top-4 left-4 right-4 z-[1000] flex justify-center pointer-events-none"
      >
        <div className="bg-white w-full px-5 py-3 rounded-2xl shadow-lg flex items-center justify-between pointer-events-auto border border-gray-100">
          <div className="flex items-center gap-1.5">
            <div className="bg-blue-50 p-2 rounded-full">
              <img src={dimeIcon} alt="DIME" className="w-5 h-5 object-contain" />
            </div>
            <h1 className="font-bold text-xl leading-none tracking-tight" style={{ color: '#1c528b' }}>D I M E</h1>
          </div>
          <div className="relative pointer-events-auto">
            <button onClick={() => setMenuAbierto(!menuAbierto)} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors active:scale-95">
              <MoreHorizontal className="text-blue-400 w-6 h-6" />
            </button>
            {menuAbierto && (
              <>
                <div className="fixed inset-0 z-[1001]" onClick={() => setMenuAbierto(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                  className="absolute top-14 right-0 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[1002] overflow-hidden origin-top-right"
                >
                  <button className="w-full text-left px-5 py-4 hover:bg-blue-50 text-gray-700 text-sm flex items-center gap-3 transition-colors border-b border-gray-50" onClick={() => { setModalReporte(true); setMenuAbierto(false); }}>
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    <span>Reportar error</span>
                  </button>
                  <button className="w-full text-left px-5 py-4 hover:bg-blue-50 text-gray-700 text-sm flex items-center gap-3 transition-colors" onClick={() => { setModalAyuda(true); setMenuAbierto(false); }}>
                    <HelpCircle className="w-4 h-4 text-blue-500" />
                    <span>Ayuda / Acerca de</span>
                  </button>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Mapa */}
      <motion.div
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
        className="absolute inset-0 z-0"
      >
        <MapView
          lugares={lugares}
          lugarSeleccionado={lugarSeleccionado}
          onMarkerClick={(lugar) => {
            trackMarkerClick(lugar.id, lugar.nombre);
            setLugarSeleccionado(lugar);
          }}
        />
      </motion.div>

      {/* Chat */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        className={`absolute left-4 right-4 flex flex-col justify-end pointer-events-none ${tecladoVisible ? 'z-[99999]' : 'z-[1000]'} ${modalReporte || modalAyuda ? 'hidden' : ''}`}
        style={{ bottom: posicionChat, paddingBottom: tecladoVisible ? '0' : 'max(1rem, env(safe-area-inset-bottom))', transition: 'bottom 0.3s ease-out, padding-bottom 0.3s ease-out' }}
      >
        {chatMinimizado ? (
          <button onClick={() => setChatMinimizado(false)} className="bg-white rounded-full p-2 shadow-2xl pointer-events-auto hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center border-2 border-gray-200" style={{ width: '56px', height: '56px' }}>
            <DimeRobotIcon className="w-10 h-10" />
          </button>
        ) : (
          <div className="bg-white rounded-[2rem] shadow-2xl pointer-events-auto border border-gray-100">
            <div className="flex justify-end items-center p-3 pb-0">
              <button onClick={() => setChatMinimizado(true)} className="text-gray-400 hover:text-gray-600 transition-colors active:scale-90 p-1" title="Minimizar chat">
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
            <div className="px-5 pb-5">
              <div id="chat-messages" className="max-h-64 overflow-y-auto mb-4 space-y-3 pr-2" style={{ scrollBehavior: 'smooth' }}>
                {mensajesChat.map((mensaje, index) => (
                  <div key={index} className={`flex items-start gap-3 ${mensaje.tipo === 'usuario' ? 'flex-row-reverse' : ''}`}>
                    {mensaje.tipo === 'bot' && <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0 shadow-md border-2 border-blue-600 p-1"><DimeRobotIcon className="w-8 h-8" /></div>}
                    {mensaje.tipo === 'usuario' && <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shrink-0 shadow-md"><User className="w-6 h-6 text-white" /></div>}
                    <div className={`px-4 py-2 rounded-2xl text-sm font-medium shadow-sm leading-relaxed ${mensaje.tipo === 'bot' ? 'bg-gray-100 text-gray-700 rounded-tl-none' : 'bg-blue-600 text-white rounded-tr-none'}`}>{mensaje.texto}</div>
                  </div>
                ))}
                {cargandoRespuesta && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0 shadow-md border-2 border-blue-600 p-1"><DimeRobotIcon className="w-8 h-8" /></div>
                    <div className="bg-gray-100 text-gray-700 px-4 py-2 rounded-2xl rounded-tl-none text-sm font-medium shadow-sm">
                      <span className="inline-flex items-center gap-1"><span className="animate-bounce">.</span><span className="animate-bounce" style={{ animationDelay: '0.1s' }}>.</span><span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span></span>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 mt-2 pl-1">
                <button onClick={() => { setVozActiva(!vozActiva); window.speechSynthesis?.cancel(); }} className="text-gray-400 hover:text-blue-600 transition-colors active:scale-90" title={vozActiva ? 'Silenciar voz' : 'Activar voz'}>
                  {vozActiva ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
                </button>
                <button onClick={activarVozInput} className={`transition-colors active:scale-90 ${escuchando || respondiendo ? 'text-blue-600' : 'text-gray-400 hover:text-blue-600'}`} title={escuchando || respondiendo ? 'Escuchando...' : 'Hablar'} disabled={escuchando || respondiendo}>
                  <Mic className="w-6 h-6" />
                </button>
                <div className="flex-1 h-10 bg-gray-50 rounded-full px-4 flex items-center border border-transparent focus-within:border-blue-200 transition-all">
                  <input type="text" value={mensajeChat} onChange={(e) => setMensajeChat(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && mensajeChat.trim() && !cargandoRespuesta) enviarMensaje(mensajeChat); }} placeholder="Escribe o habla..." className="w-full bg-transparent outline-none text-gray-600 text-sm placeholder-gray-400" />
                </div>
                <button onClick={() => mensajeChat.trim() && !cargandoRespuesta && enviarMensaje(mensajeChat)} disabled={!mensajeChat.trim() || cargandoRespuesta} className={`transition-all active:scale-90 ${mensajeChat.trim() ? 'text-blue-600 hover:text-blue-700' : 'text-gray-300 cursor-not-allowed'}`}>
                  <Send className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Modal Reporte */}
      {modalReporte && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={cerrarModalReporte}>
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }} onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative">
            <button onClick={cerrarModalReporte} className="absolute top-4 right-4 bg-gray-50 p-2 rounded-full text-gray-400 hover:text-red-500 transition-colors"><X className="w-5 h-5" /></button>
            {!enviado ? (
              <>
                <div className="bg-orange-50 w-12 h-12 rounded-full flex items-center justify-center mb-4"><AlertTriangle className="w-6 h-6 text-orange-500" /></div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Reportar inconsistencia</h2>
                <p className="text-gray-500 text-sm mb-4">¿Encontraste un dato erróneo? Ayuda a DIME a mejorar.</p>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de error</label>
                  <select value={tipoError} onChange={(e) => setTipoError(e.target.value)} className="w-full bg-gray-50 rounded-xl p-3 text-sm text-gray-700 border border-gray-200 focus:border-blue-500 outline-none appearance-none cursor-pointer">
                    <option value="">Selecciona...</option>
                    <option value="direccion-incorrecta">Dirección incorrecta</option>
                    <option value="nombre-incorrecto">Nombre incorrecto</option>
                    <option value="ubicacion-mapa-incorrecta">Ubicación incorrecta</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mensaje</label>
                  <textarea value={textoReporte} onChange={(e) => setTextoReporte(e.target.value)} className="w-full bg-gray-50 rounded-xl p-3 text-sm text-gray-700 border border-gray-200 focus:border-blue-500 outline-none h-24 resize-none" placeholder="Describe el error..." />
                </div>
                <button
                  onClick={() => {
                    if (tipoError && textoReporte.trim()) {
                      trackReportSubmitted(tipoError);
                      setEnviado(true);
                    }
                  }}
                  disabled={!tipoError || !textoReporte.trim()}
                  className={`w-full font-bold py-3 rounded-xl active:scale-95 transition-all ${tipoError && textoReporte.trim() ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                >
                  Enviar
                </button>
              </>
            ) : (
              <div className="text-center py-6">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><Check className="w-8 h-8 text-green-600" /></div>
                <h3 className="text-lg font-bold text-gray-800">¡Gracias!</h3>
                <p className="text-gray-500 text-sm">Tu reporte ayuda a conectar mejor a Tolú.</p>
                <button onClick={cerrarModalReporte} className="mt-6 text-blue-600 font-semibold text-sm hover:text-blue-700 transition-colors">Cerrar</button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}

      {/* Modal Ayuda */}
      {modalAyuda && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setModalAyuda(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }} onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative text-center">
            <button onClick={() => setModalAyuda(false)} className="absolute top-4 right-4 bg-gray-50 p-2 rounded-full text-gray-400 hover:text-red-500 transition-colors"><X className="w-5 h-5" /></button>
            <div className="bg-blue-50 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"><HelpCircle className="w-8 h-8 text-blue-600" /></div>
            <h2 className="text-2xl font-bold mb-1" style={{ color: '#1c528b' }}>DIME</h2>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-widest mb-6">Versión Prototipo 1.0</p>
            <div className="text-left space-y-4 mb-6">
              <div className="flex gap-3">
                <div className="bg-gray-100 p-2 rounded-lg h-min"><Mic className="w-4 h-4 text-gray-600" /></div>
                <div><h4 className="font-bold text-gray-800 text-sm">Asistente de voz</h4><p className="text-xs text-gray-500">Pregunta naturalmente para encontrar trámites.</p></div>
              </div>
              <div className="flex gap-3">
                <div className="bg-gray-100 p-2 rounded-lg h-min"><AlertTriangle className="w-4 h-4 text-gray-600" /></div>
                <div><h4 className="font-bold text-gray-800 text-sm">Ayúdanos a mejorar</h4><p className="text-xs text-gray-500">¿Encontraste un dato erróneo? Reportalo.</p></div>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-4"><p className="text-xs text-gray-400">Hecho con 💙 para guiar a Tolú.</p></div>
          </motion.div>
        </motion.div>
      )}

      {/* Overlay escuchando */}
      {escuchando && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="fixed inset-0 z-[3000] flex items-center justify-center bg-white/80 backdrop-blur-md">
          <button onClick={() => { window.currentRecognition?.stop(); window.speechSynthesis?.cancel(); setEscuchando(false); setRespondiendo(false); reproducirSonidoFin(); }} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-200/80 hover:bg-gray-300/80 flex items-center justify-center z-[3001]" title="Cerrar"><X className="w-6 h-6 text-gray-700" /></button>
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="flex flex-col items-center">
            <div className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-2xl ${respondiendo ? 'bg-green-600' : 'bg-blue-600'}`}>
              {respondiendo ? <DimeRobotIcon className="w-10 h-10" /> : <Mic className="w-10 h-10 text-white" />}
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mt-4">{respondiendo ? 'Respondiendo...' : cargandoRespuesta ? 'Procesando...' : 'Escuchando...'}</h2>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
