/**
 * Pagina principal: mapa, chat y menu.
 */

import React, { useRef, useState, useEffect } from 'react';
import { motion as Motion, useReducedMotion } from 'framer-motion';
import { MapView } from '../features/Map/MapView';
import {
  Mic,
  Send,
  User,
  MoreHorizontal,
  AlertTriangle,
  HelpCircle,
  X,
  Check,
  ChevronDown,
  Volume2,
  VolumeX,
  Trash2,
} from 'lucide-react';
import { DimeRobotIcon } from '../components/ui/DimeRobotIcon';
import { Toast } from '../components/ui/Toast';
import dimeIcon from '../assets/dime-icon.png';
import { enviarMensajeChat } from '../services/chatService';
import {
  trackMarkerClick,
  trackChatMessageSent,
  trackChatMessageReceived,
  trackVoiceInput,
  trackReportSubmitted,
} from '../services/analyticsService';
import { getUserName } from '../services/userService';

const EASE = [0.33, 1, 0.68, 1];

export function HomePage({ lugares }) {
  const prefersReducedMotion = useReducedMotion();
  const userName = getUserName();
  const initialBotMessage = userName
    ? `Hola, ${userName}. Soy DIME-IA, ¿en qué te puedo ayudar?`
    : 'Soy DIME-IA, ¿en qué te puedo ayudar?';
  const [lugarSeleccionado, setLugarSeleccionado] = useState(null);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [modalReporte, setModalReporte] = useState(false);
  const [modalAyuda, setModalAyuda] = useState(false);
  const [toast, setToast] = useState({ open: false, variant: 'info', message: '' });
  const [enviado, setEnviado] = useState(false);
  const [textoReporte, setTextoReporte] = useState('');
  const [tipoError, setTipoError] = useState('');
  const [mensajeChat, setMensajeChat] = useState('');
  const [mensajesChat, setMensajesChat] = useState([
    {
      tipo: 'bot',
      texto: initialBotMessage,
    },
  ]);
  const [cargandoRespuesta, setCargandoRespuesta] = useState(false);
  const [chatMinimizado, setChatMinimizado] = useState(false);
  const chatMinimizadoPorUsuarioRef = useRef(false);
  const [tecladoVisible, setTecladoVisible] = useState(false);
  const [posicionChat, setPosicionChat] = useState('1rem');
  const [vozActiva, setVozActiva] = useState(true);
  const [escuchando, setEscuchando] = useState(false);
  const [respondiendo, setRespondiendo] = useState(false);
  const hasText = !!mensajeChat.trim();
  const [minHintShown, setMinHintShown] = useState(false);

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
    } catch {
      /* audio opcional */
    }
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
    } catch {
      /* audio opcional */
    }
  };

  const mostrarToast = (variant, message) => {
    setToast({ open: true, variant, message });
  };

  const cerrarTodo = () => {
    setMenuAbierto(false);
    setModalAyuda(false);
    setModalReporte(false);
    setToast((t) => ({ ...t, open: false }));
    if (escuchando) {
      window.currentRecognition?.stop();
      window.speechSynthesis?.cancel();
      setEscuchando(false);
      setRespondiendo(false);
      reproducirSonidoFin();
    }
  };

  const activarVozInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      mostrarToast('warning', 'Tu navegador no soporta comandos de voz. Usa el teclado.');
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
      if (e.error === 'not-allowed') {
        mostrarToast(
          'error',
          'Permiso denegado. Permite el acceso al micrófono en la configuración del navegador.'
        );
      } else if (e.error === 'no-speech') {
        mostrarToast('warning', 'No se detectó voz. Intenta hablar un poco más fuerte.');
      } else if (e.error !== 'aborted') {
        mostrarToast('error', `Error de voz: ${e.error}`);
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
    trackChatMessageSent();
    setMensajesChat((prev) => [...prev, { tipo: 'usuario', texto: mensaje.trim() }]);
    setMensajeChat('');
    setCargandoRespuesta(true);
    try {
      const data = await enviarMensajeChat(mensaje);
      const depth = mensajesChat.length + 2;
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
      mostrarToast('error', 'No se pudo enviar el mensaje. Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      setCargandoRespuesta(false);
    }
  };

  const borrarConversacion = () => {
    setMensajesChat([{ tipo: 'bot', texto: initialBotMessage }]);
    setMensajeChat('');
    window.speechSynthesis?.cancel();
    mostrarToast('info', 'Conversación borrada.');
  };

  const abrirChat = () => {
    setChatMinimizado(false);
    chatMinimizadoPorUsuarioRef.current = false;
  };

  const minimizarChat = () => {
    setChatMinimizado(true);
    chatMinimizadoPorUsuarioRef.current = true;
  };

  useEffect(() => {
    // Mantener el textarea ajustado al contenido al re-render (ej. borrar conversación)
    const el = document.querySelector('textarea[aria-label="Mensaje para DIME-IA"]');
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 112)}px`;
  }, [mensajeChat]);

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
    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      cerrarTodo();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [escuchando]);

  useEffect(() => {
    if (!chatMinimizado) return;
    if (minHintShown) return;
    try {
      const key = 'dime_chat_min_hint_seen';
      const seen = localStorage.getItem(key) === 'true';
      if (!seen) {
        mostrarToast('info', 'Tip: toca un pin para ver detalles. Abre DIME‑IA para buscar o preguntar.');
        localStorage.setItem(key, 'true');
      }
    } catch {
      // Si localStorage falla, mostramos el tip una vez por sesión.
      mostrarToast('info', 'Tip: toca un pin para ver detalles. Abre DIME‑IA para buscar o preguntar.');
    } finally {
      setMinHintShown(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatMinimizado]);

  const cerrarModalReporte = () => {
    setModalReporte(false);
    setEnviado(false);
    setTextoReporte('');
    setTipoError('');
  };

  return (
    <Motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={prefersReducedMotion ? { duration: 0.15 } : { duration: 0.45, ease: EASE }}
      className="relative flex h-full w-full flex-col overflow-hidden bg-surface-muted font-sans"
    >
      <Toast
        open={toast.open}
        variant={toast.variant}
        message={toast.message}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />
      {/* Header */}
      <Motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5, delay: 0.1, ease: EASE }}
        className="pointer-events-none absolute left-4 right-4 top-4 z-[1000] flex justify-center"
      >
        <div className="dime-glass pointer-events-auto flex w-full items-center justify-between px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-dime-50 p-2">
              <img src={dimeIcon} alt="" className="h-5 w-5 object-contain" />
            </div>
            <h1 className="text-xl font-bold leading-none tracking-tight text-dime-600">D I M E</h1>
          </div>
          <div className="relative pointer-events-auto">
            <button
              type="button"
              onClick={() => setMenuAbierto(!menuAbierto)}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-surface-muted transition-colors hover:bg-dime-50 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dime-200 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              aria-expanded={menuAbierto}
              aria-label="Menú"
            >
              <MoreHorizontal className="h-6 w-6 text-dime-500" />
            </button>
            {menuAbierto && (
              <>
                <div
                  className="fixed inset-0 z-[1001]"
                  onClick={() => setMenuAbierto(false)}
                  aria-hidden
                />
                <Motion.div
                  initial={{ opacity: 0, scale: 0.96, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.22, ease: EASE }}
                  className="absolute right-0 top-14 z-[1002] w-52 origin-top-right overflow-hidden rounded-dime-xl border border-border bg-surface shadow-dime-lg"
                >
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 border-b border-border px-5 py-4 text-left text-sm text-fg transition-colors hover:bg-dime-50"
                    onClick={() => {
                      setModalReporte(true);
                      setMenuAbierto(false);
                    }}
                  >
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <span>Reportar error</span>
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-5 py-4 text-left text-sm text-fg transition-colors hover:bg-dime-50"
                    onClick={() => {
                      setModalAyuda(true);
                      setMenuAbierto(false);
                    }}
                  >
                    <HelpCircle className="h-4 w-4 text-dime-600" />
                    <span>Ayuda / Acerca de</span>
                  </button>
                </Motion.div>
              </>
            )}
          </div>
        </div>
      </Motion.div>

      {/* Mapa */}
      <Motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, scale: 1.02 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.55, delay: 0.05, ease: EASE }}
        className="absolute inset-0 z-0"
      >
        <MapView
          lugares={lugares}
          lugarSeleccionado={lugarSeleccionado}
          showExploreHint={!chatMinimizado && !tecladoVisible && !modalReporte && !modalAyuda}
          onMarkerClick={(lugar) => {
            if (!lugar) {
              setLugarSeleccionado(null);
              setChatMinimizado(chatMinimizadoPorUsuarioRef.current);
              return;
            }
            trackMarkerClick(lugar.id, lugar.nombre);
            setLugarSeleccionado(lugar);
            setChatMinimizado(true);
          }}
        />
      </Motion.div>

      {/* Chat */}
      <Motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.4, delay: 0.15, ease: EASE }}
        className={`pointer-events-none absolute left-4 right-4 flex flex-col justify-end ${
          tecladoVisible ? 'z-[99999]' : 'z-[1000]'
        } ${modalReporte || modalAyuda ? 'hidden' : ''}`}
        style={{
          bottom: posicionChat,
          paddingBottom: tecladoVisible ? '0' : 'max(1rem, env(safe-area-inset-bottom))',
          transition: 'bottom 0.3s ease-out, padding-bottom 0.3s ease-out',
        }}
      >
        {chatMinimizado ? (
          <div className="pointer-events-auto flex items-center gap-2">
            <button
              type="button"
              onClick={abrirChat}
              className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-border bg-surface shadow-dime-lg transition-all hover:bg-surface-muted active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dime-200 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              aria-label="Abrir asistente DIME-IA"
            >
              <DimeRobotIcon className="h-10 w-10" />
            </button>

            {!tecladoVisible && !modalReporte && !modalAyuda && (
              <button
                type="button"
                onClick={abrirChat}
                className="dime-glass-chip flex max-w-[72vw] items-center px-3 py-2 text-left text-sm font-semibold text-dime-700 transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dime-200 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                aria-label="Abrir asistente y ver sugerencias"
                title="Abrir asistente"
              >
                Toca un pin o pregúntale a DIME‑IA
              </button>
            )}
          </div>
        ) : (
          <div className="dime-glass-chat pointer-events-auto flex max-h-[72vh] min-h-[14rem] flex-col overflow-hidden">
            <div className="flex shrink-0 items-center justify-end gap-2 p-3 pb-0">
              <button
                type="button"
                onClick={borrarConversacion}
                className="p-1 text-fg-subtle transition-colors hover:text-dime-600 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dime-200 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50"
                title="Borrar conversación"
                aria-label="Borrar conversación"
                disabled={mensajesChat.length <= 1 && !mensajeChat.trim()}
              >
                <Trash2 className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setVozActiva(!vozActiva);
                  window.speechSynthesis?.cancel();
                }}
                className="p-1 text-fg-subtle transition-colors hover:text-dime-700 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dime-200 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                aria-label={vozActiva ? 'Silenciar voz' : 'Activar voz'}
                title={vozActiva ? 'Voz activada (tocar para silenciar)' : 'Voz silenciada (tocar para activar)'}
              >
                {vozActiva ? <Volume2 className="h-5 w-5" aria-hidden /> : <VolumeX className="h-5 w-5" aria-hidden />}
              </button>
              <button
                type="button"
                onClick={minimizarChat}
                className="p-1 text-fg-subtle transition-colors hover:text-fg-muted active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dime-200 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                title="Minimizar chat"
                aria-label="Minimizar chat"
              >
                <ChevronDown className="h-5 w-5" />
              </button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 pb-5">
              <div
                id="chat-messages"
                className="mb-3 min-h-0 flex-1 space-y-3 overflow-y-auto overflow-x-hidden pr-2"
                style={{ scrollBehavior: 'smooth' }}
              >
                {mensajesChat.map((mensaje, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-3 ${mensaje.tipo === 'usuario' ? 'flex-row-reverse' : ''}`}
                  >
                    {mensaje.tipo === 'bot' && (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-dime-600 bg-surface p-1 shadow-dime-sm">
                        <DimeRobotIcon className="h-8 w-8" />
                      </div>
                    )}
                    {mensaje.tipo === 'usuario' && (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-dime-600 shadow-dime-sm">
                        <User className="h-6 w-6 text-fg-on-dime" />
                      </div>
                    )}
                    <div
                      className={`rounded-dime-xl px-4 py-2 text-sm font-medium leading-relaxed shadow-dime-xs ${
                        mensaje.tipo === 'bot'
                          ? 'rounded-tl-none bg-surface-muted text-fg'
                          : 'rounded-tr-none bg-dime-600 text-fg-on-dime'
                      }`}
                    >
                      {mensaje.texto}
                    </div>
                  </div>
                ))}
                {cargandoRespuesta && (
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-dime-600 bg-surface p-1 shadow-dime-sm">
                      <DimeRobotIcon className="h-8 w-8" />
                    </div>
                    <div className="rounded-dime-xl rounded-tl-none bg-surface-muted px-4 py-2 text-sm font-medium text-fg shadow-dime-xs">
                      {prefersReducedMotion ? (
                        <span aria-label="Cargando">…</span>
                      ) : (
                        <span className="inline-flex items-center gap-1" aria-label="Cargando">
                          <span className="animate-bounce">.</span>
                          <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>
                            .
                          </span>
                          <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>
                            .
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-2 flex shrink-0 items-end gap-3 pl-1 sm:gap-4">
                <div className="flex min-h-10 flex-1 items-end gap-2 rounded-dime-2xl border border-transparent bg-surface-muted px-3 py-2 transition-[box-shadow,border-color] focus-within:border-dime-200 focus-within:ring-2 focus-within:ring-dime-100">
                  <textarea
                    value={mensajeChat}
                    onChange={(e) => {
                      setMensajeChat(e.target.value);
                      // Auto-grow: ajusta altura al contenido (hasta max-h)
                      e.currentTarget.style.height = 'auto';
                      e.currentTarget.style.height = `${Math.min(e.currentTarget.scrollHeight, 112)}px`;
                    }}
                    onKeyDown={(e) => {
                      // WhatsApp-like:
                      // - Enter envía
                      // - Shift+Enter inserta salto de línea
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (mensajeChat.trim() && !cargandoRespuesta) enviarMensaje(mensajeChat);
                      }
                    }}
                    placeholder="Escribe o habla..."
                    rows={1}
                    className="max-h-28 w-full resize-none bg-transparent text-sm text-fg outline-none placeholder:text-fg-subtle"
                    aria-label="Mensaje para DIME-IA"
                  />
                </div>

                {/* Acción estilo WhatsApp/Telegram: mic si vacío, enviar si hay texto */}
                <button
                  type="button"
                  onClick={() => {
                    if (hasText) enviarMensaje(mensajeChat);
                    else activarVozInput();
                  }}
                  disabled={cargandoRespuesta || escuchando || respondiendo || (!hasText && !vozActiva)}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-dime-600 text-fg-on-dime shadow-dime-md transition-[transform,background-color,opacity] hover:bg-dime-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                  title={
                    hasText
                      ? 'Enviar'
                      : !vozActiva
                        ? 'Voz desactivada'
                        : escuchando || respondiendo
                          ? 'Escuchando...'
                          : 'Hablar'
                  }
                  aria-label={hasText ? 'Enviar mensaje' : 'Hablar'}
                >
                  {hasText ? (
                    <Send className="h-5 w-5" aria-hidden />
                  ) : (
                    <Mic className="h-5 w-5" aria-hidden />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </Motion.div>

      {/* Modal Reporte */}
      {modalReporte && (
        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-fg/35 p-4 backdrop-blur-sm"
          onClick={cerrarModalReporte}
        >
          <Motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.35, ease: EASE }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-dime-2xl border border-border bg-surface p-6 shadow-dime-lg"
            role="dialog"
            aria-modal="true"
            aria-label="Reportar inconsistencia"
          >
            <button
              type="button"
              onClick={cerrarModalReporte}
              className="absolute right-4 top-4 rounded-full bg-surface-muted p-2 text-fg-subtle transition-colors hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dime-200 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
            {!enviado ? (
              <>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-warning-muted">
                  <AlertTriangle className="h-6 w-6 text-warning" />
                </div>
                <h2 className="mb-2 text-xl font-bold text-fg">Reportar inconsistencia</h2>
                <p className="mb-4 text-sm text-fg-muted">
                  ¿Encontraste un dato erróneo? Ayuda a DIME a mejorar.
                </p>
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-fg">Tipo de error</label>
                  <select
                    value={tipoError}
                    onChange={(e) => setTipoError(e.target.value)}
                    className="w-full cursor-pointer appearance-none rounded-dime-xl border border-border bg-surface-muted p-3 text-sm text-fg outline-none focus:border-dime-500 focus:ring-2 focus:ring-dime-100"
                  >
                    <option value="">Selecciona...</option>
                    <option value="direccion-incorrecta">Dirección incorrecta</option>
                    <option value="nombre-incorrecto">Nombre incorrecto</option>
                    <option value="ubicacion-mapa-incorrecta">Ubicación incorrecta</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-fg">Mensaje</label>
                  <textarea
                    value={textoReporte}
                    onChange={(e) => setTextoReporte(e.target.value)}
                    className="h-24 w-full resize-none rounded-dime-xl border border-border bg-surface-muted p-3 text-sm text-fg outline-none focus:border-dime-500 focus:ring-2 focus:ring-dime-100"
                    placeholder="Describe el error..."
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (tipoError && textoReporte.trim()) {
                      trackReportSubmitted(tipoError);
                      setEnviado(true);
                    }
                  }}
                  disabled={!tipoError || !textoReporte.trim()}
                  className={`w-full rounded-dime-xl py-3 font-bold transition-all active:scale-[0.99] ${
                    tipoError && textoReporte.trim()
                      ? 'bg-fg text-fg-on-dime hover:opacity-90'
                      : 'cursor-not-allowed bg-border text-fg-subtle'
                  }`}
                >
                  Enviar
                </button>
              </>
            ) : (
              <div className="py-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-muted">
                  <Check className="h-8 w-8 text-success" />
                </div>
                <h3 className="text-lg font-bold text-fg">¡Gracias!</h3>
                <p className="text-sm text-fg-muted">Tu reporte ayuda a conectar mejor a Tolú.</p>
                <button
                  type="button"
                  onClick={cerrarModalReporte}
                  className="mt-6 text-sm font-semibold text-dime-600 transition-colors hover:text-dime-700"
                >
                  Cerrar
                </button>
              </div>
            )}
          </Motion.div>
        </Motion.div>
      )}

      {/* Modal Ayuda */}
      {modalAyuda && (
        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-fg/35 p-4 backdrop-blur-sm"
          onClick={() => setModalAyuda(false)}
        >
          <Motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.35, ease: EASE }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-dime-2xl border border-border bg-surface p-6 text-center shadow-dime-lg"
            role="dialog"
            aria-modal="true"
            aria-label="Ayuda y acerca de"
          >
            <button
              type="button"
              onClick={() => setModalAyuda(false)}
              className="absolute right-4 top-4 rounded-full bg-surface-muted p-2 text-fg-subtle transition-colors hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dime-200 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-dime-100">
              <HelpCircle className="h-8 w-8 text-dime-600" />
            </div>
            <h2 className="mb-1 text-2xl font-bold text-dime-600">DIME</h2>
            <p className="mb-6 text-xs font-medium uppercase tracking-widest text-fg-subtle">
              Versión Prototipo 1.0
            </p>
            <div className="mb-6 space-y-4 text-left">
              <div className="flex gap-3">
                <div className="h-min rounded-dime-lg bg-surface-muted p-2">
                  <Mic className="h-4 w-4 text-dime-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-fg">Asistente de voz</h4>
                  <p className="text-xs text-fg-muted">Pregunta naturalmente para encontrar trámites.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="h-min rounded-dime-lg bg-surface-muted p-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-fg">Ayúdanos a mejorar</h4>
                  <p className="text-xs text-fg-muted">¿Encontraste un dato erróneo? Reportalo.</p>
                </div>
              </div>
            </div>
            <div className="border-t border-border pt-4">
              <p className="text-xs text-fg-subtle">Hecho con 💙 para guiar a Tolú.</p>
            </div>
          </Motion.div>
        </Motion.div>
      )}

      {/* Overlay escuchando */}
      {escuchando && (
        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[3000] flex items-center justify-center bg-surface/85 backdrop-blur-md"
        >
          <button
            type="button"
            onClick={() => {
              window.currentRecognition?.stop();
              window.speechSynthesis?.cancel();
              setEscuchando(false);
              setRespondiendo(false);
              reproducirSonidoFin();
            }}
            className="absolute right-4 top-4 z-[3001] flex h-10 w-10 items-center justify-center rounded-full bg-surface-muted transition-colors hover:bg-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dime-200 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            title="Cerrar"
            aria-label="Cerrar escucha"
          >
            <X className="h-6 w-6 text-fg" />
          </button>
          <Motion.div
            initial={prefersReducedMotion ? false : { scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.94, opacity: 0 }}
            className="flex flex-col items-center"
          >
            <div
              className="relative flex h-20 w-20 items-center justify-center rounded-full bg-dime-600 shadow-dime-lg"
            >
              {respondiendo ? (
                <DimeRobotIcon className="h-10 w-10" />
              ) : (
                <Mic className="h-10 w-10 text-fg-on-dime" />
              )}
            </div>
            <h2 className="mt-4 text-2xl font-bold text-fg">
              {respondiendo ? 'Respondiendo...' : cargandoRespuesta ? 'Procesando...' : 'Escuchando...'}
            </h2>
          </Motion.div>
        </Motion.div>
      )}
    </Motion.div>
  );
}
