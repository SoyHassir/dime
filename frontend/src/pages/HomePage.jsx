/**
 * Pagina principal: mapa, chat y menu.
 */

import React, { useRef, useState, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
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

// Inyectado por Vite (vite.config.js -> define)
// eslint-disable-next-line no-undef
const BUILD_ID = typeof __DIME_BUILD_ID__ !== 'undefined' ? __DIME_BUILD_ID__ : 'dev';

export function HomePage({ lugares }) {
  const prefersReducedMotion = useReducedMotion();
  const chatInputRef = useRef(null);
  const chatEndRef = useRef(null);
  const menuButtonRef = useRef(null);
  /** Borde inferior del header cristal (el botón ⋮ queda más arriba que la barra). */
  const navGlassRef = useRef(null);
  const menuPanelRef = useRef(null);
  const [menuCoords, setMenuCoords] = useState({ top: 0, right: 0 });
  const keyboardOpenRef = useRef(false);
  const lastBottomStrRef = useRef('1rem');
  const viewportRafRef = useRef(null);
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
  const borrarChatDisabled = mensajesChat.length <= 1 && !mensajeChat.trim();
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

  // Autocierre del estado de éxito del reporte para mantener el flujo ágil
  useEffect(() => {
    if (!modalReporte) return;
    if (!enviado) return;
    if (prefersReducedMotion) return;
    const t = setTimeout(() => cerrarModalReporte(), 3000);
    return () => clearTimeout(t);
  }, [modalReporte, enviado, prefersReducedMotion]);

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

    // UX móvil: mantener el teclado abierto para seguir escribiendo
    if (!desdeVoz) {
      requestAnimationFrame(() => chatInputRef.current?.focus());
    }

    try {
      const data = await enviarMensajeChat(mensaje);
      const depth = mensajesChat.length + 2;
      trackChatMessageReceived(depth);
      setMensajesChat((prev) => [...prev, { tipo: 'bot', texto: data.respuesta }]);
      if (desdeVoz) hablar(data.respuesta);
      setTimeout(() => {
        const el = document.getElementById('chat-messages');
        if (el) el.scrollTop = el.scrollHeight;
        if (!desdeVoz) chatInputRef.current?.focus();
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
    refuerzoTecladoMovil();
  };

  const abrirChat = () => {
    setChatMinimizado(false);
    chatMinimizadoPorUsuarioRef.current = false;
  };

  const minimizarChat = () => {
    setChatMinimizado(true);
    chatMinimizadoPorUsuarioRef.current = true;
  };

  /** Re-enfoca el textarea; truco readOnly ayuda en WebKit/Android a no perder el teclado. */
  const refuerzoTecladoMovil = () => {
    const ta = chatInputRef.current;
    if (!ta) return;
    const f = () => ta.focus({ preventScroll: true });
    try {
      ta.readOnly = true;
      f();
      requestAnimationFrame(() => {
        ta.readOnly = false;
        f();
        requestAnimationFrame(f);
        setTimeout(f, 0);
        setTimeout(f, 80);
        setTimeout(f, 200);
      });
    } catch {
      f();
    }
  };

  useEffect(() => {
    // Mantener el textarea ajustado al contenido al re-render (ej. borrar conversación)
    const el = document.querySelector('textarea[aria-label="Mensaje para DIME-IA"]');
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 112)}px`;
  }, [mensajeChat]);

  // Mantener visible el final del chat; sin "smooth" para no competir con el teclado (parpadeo)
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ block: 'nearest', behavior: 'auto' });
  }, [mensajesChat.length, cargandoRespuesta]);

  useEffect(() => {
    const flushViewport = () => {
      viewportRafRef.current = null;
      if (typeof window === 'undefined' || !window.visualViewport) return;
      const vv = window.visualViewport;
      const ih = window.innerHeight;
      const insetBottom = Math.max(0, ih - (vv.offsetTop + vv.height));
      // Histéresis: evita parpadeo true/false entre eventos sucesivos del teclado
      let open = keyboardOpenRef.current;
      if (insetBottom > 135) open = true;
      else if (insetBottom < 90) open = false;
      keyboardOpenRef.current = open;
      setTecladoVisible(open);

      const maxInset = Math.round(ih * 0.52);
      const inset = Math.min(Math.round(insetBottom), maxInset);
      const nextBottom = open ? `${Math.max(8, inset + 8)}px` : '1rem';
      // No re-render si el cambio es mínimo (reduce saltos)
      if (nextBottom !== lastBottomStrRef.current) {
        lastBottomStrRef.current = nextBottom;
        setPosicionChat(nextBottom);
      }
    };

    const scheduleViewport = () => {
      if (viewportRafRef.current != null) return;
      viewportRafRef.current = requestAnimationFrame(flushViewport);
    };

    if (typeof window !== 'undefined') {
      window.visualViewport?.addEventListener('resize', scheduleViewport);
      window.visualViewport?.addEventListener('scroll', scheduleViewport);
      window.addEventListener('resize', scheduleViewport);
      scheduleViewport();
    }
    return () => {
      if (viewportRafRef.current != null) {
        cancelAnimationFrame(viewportRafRef.current);
        viewportRafRef.current = null;
      }
      window.visualViewport?.removeEventListener('resize', scheduleViewport);
      window.visualViewport?.removeEventListener('scroll', scheduleViewport);
      window.removeEventListener('resize', scheduleViewport);
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

  // Menú ⋮: overlay full-screen debe estar fuera del header con transform (fixed quedaría recortado)
  useLayoutEffect(() => {
    if (!menuAbierto) return;
    const update = () => {
      const btn = menuButtonRef.current;
      const glass = navGlassRef.current;
      if (!btn) return;
      const br = btn.getBoundingClientRect();
      const gr = glass?.getBoundingClientRect();
      // Debajo de toda la barra (no del solo botón), con hueco claro respecto al navbar
      const topBelowNav = (gr?.bottom ?? br.bottom) + 12;
      setMenuCoords({ top: topBelowNav, right: window.innerWidth - br.right });
    };
    update();
    window.addEventListener('resize', update);
    window.visualViewport?.addEventListener('resize', update);
    window.visualViewport?.addEventListener('scroll', update);
    return () => {
      window.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('scroll', update);
    };
  }, [menuAbierto]);

  // Cierre al tocar fuera: captura en document evita que Leaflet/Android se queden con el gesto antes que onClick en un overlay.
  useEffect(() => {
    if (!menuAbierto) return;
    const onPointerDownCapture = (e) => {
      const t = e.target;
      if (!(t instanceof Node)) return;
      if (menuButtonRef.current?.contains(t)) return;
      if (menuPanelRef.current?.contains(t)) return;
      setMenuAbierto(false);
    };
    document.addEventListener('pointerdown', onPointerDownCapture, true);
    return () => document.removeEventListener('pointerdown', onPointerDownCapture, true);
  }, [menuAbierto]);

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
        <div
          ref={navGlassRef}
          className="dime-glass pointer-events-auto flex w-full items-center justify-between px-4 py-3 sm:px-5"
        >
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-dime-50 p-2">
              <img src={dimeIcon} alt="" className="h-5 w-5 object-contain" />
            </div>
            <h1 className="text-xl font-bold leading-none tracking-tight text-dime-600">D I M E</h1>
          </div>
          <div className="relative pointer-events-auto">
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setMenuAbierto(!menuAbierto)}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-surface-muted transition-colors hover:bg-dime-50 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dime-200 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              aria-expanded={menuAbierto}
              aria-label="Menú"
              aria-haspopup="menu"
            >
              <MoreHorizontal className="h-6 w-6 text-dime-500" />
            </button>
            {menuAbierto &&
              createPortal(
                <Motion.div
                  ref={menuPanelRef}
                  role="menu"
                  aria-label="Menú de la aplicación"
                  initial={{ opacity: 0, scale: 0.96, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.22, ease: EASE }}
                  className="fixed z-[5001] w-52 origin-top-right overflow-hidden rounded-dime-xl border border-border bg-surface shadow-dime-lg"
                  style={{ top: menuCoords.top, right: menuCoords.right }}
                >
                    <button
                      type="button"
                      role="menuitem"
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
                      role="menuitem"
                      className="flex w-full items-center gap-3 px-5 py-4 text-left text-sm text-fg transition-colors hover:bg-dime-50"
                      onClick={() => {
                        setModalAyuda(true);
                        setMenuAbierto(false);
                      }}
                    >
                      <HelpCircle className="h-4 w-4 text-dime-600" />
                      <span>Ayuda / Acerca de</span>
                    </button>
                  </Motion.div>,
                document.body
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
          // Con teclado visible: sin transición (evita saltos). Al cerrar teclado: suave.
          transition:
            prefersReducedMotion || tecladoVisible
              ? 'none'
              : 'bottom 0.28s cubic-bezier(0.33, 1, 0.68, 1), padding-bottom 0.28s ease-out',
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
          <div className="dime-glass-chat pointer-events-auto flex h-[clamp(14rem,32vh,20rem)] flex-col overflow-hidden sm:h-[clamp(16rem,34vh,22rem)]">
            <div className="flex shrink-0 items-center justify-end gap-2 p-3 pb-0">
              <div
                className="flex items-center gap-2"
                onTouchStartCapture={() => {
                  if (tecladoVisible) chatInputRef.current?.focus({ preventScroll: true });
                }}
                onPointerDownCapture={() => {
                  if (tecladoVisible) chatInputRef.current?.focus({ preventScroll: true });
                }}
              >
                <span
                  role="button"
                  tabIndex={borrarChatDisabled ? -1 : 0}
                  aria-disabled={borrarChatDisabled}
                  title="Borrar conversación"
                  aria-label="Borrar conversación"
                  className={`touch-manipulation select-none inline-flex rounded-dime-md p-1 text-fg-subtle transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dime-200 focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
                    borrarChatDisabled
                      ? 'cursor-not-allowed opacity-50'
                      : 'cursor-pointer hover:text-dime-600 active:scale-90'
                  }`}
                  onClick={() => {
                    if (borrarChatDisabled) return;
                    borrarConversacion();
                  }}
                  onKeyDown={(e) => {
                    if (borrarChatDisabled) return;
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      borrarConversacion();
                    }
                  }}
                >
                  <Trash2 className="h-5 w-5" aria-hidden />
                </span>

                <span
                  role="button"
                  tabIndex={0}
                  className="touch-manipulation select-none inline-flex cursor-pointer rounded-dime-md p-1 text-fg-subtle transition-colors hover:text-dime-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dime-200 focus-visible:ring-offset-2 focus-visible:ring-offset-surface active:scale-90"
                  aria-label={vozActiva ? 'Silenciar voz' : 'Activar voz'}
                  title={vozActiva ? 'Voz activada (tocar para silenciar)' : 'Voz silenciada (tocar para activar)'}
                  onClick={() => {
                    setVozActiva(!vozActiva);
                    window.speechSynthesis?.cancel();
                    refuerzoTecladoMovil();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setVozActiva(!vozActiva);
                      window.speechSynthesis?.cancel();
                      refuerzoTecladoMovil();
                    }
                  }}
                >
                  {vozActiva ? <Volume2 className="h-5 w-5" aria-hidden /> : <VolumeX className="h-5 w-5" aria-hidden />}
                </span>
              </div>
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
                className="mb-3 min-h-0 flex-1 space-y-3 overflow-y-auto overflow-x-hidden pr-2 pb-3 scroll-pb-4 sm:scroll-pb-5"
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
                <div ref={chatEndRef} aria-hidden />
              </div>
              <div className="mt-2 flex shrink-0 items-end gap-3 pl-1 sm:gap-4">
                <div className="flex min-h-10 flex-1 items-end gap-2 rounded-dime-2xl border border-transparent bg-surface-muted px-3 py-2 transition-[box-shadow,border-color] focus-within:border-dime-200 focus-within:ring-2 focus-within:ring-dime-100">
                  <textarea
                    ref={chatInputRef}
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
                    className="max-h-28 w-full resize-none bg-transparent text-base text-fg outline-none placeholder:text-fg-subtle sm:text-sm"
                    aria-label="Mensaje para DIME-IA"
                  />
                </div>

                {/* Acción estilo WhatsApp/Telegram: mic si vacío, enviar si hay texto */}
                <button
                  type="button"
                  onMouseDown={(e) => {
                    // Mantener el foco en el textarea (evita que el teclado "parpadee" en móvil)
                    e.preventDefault();
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                  }}
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
            {!enviado ? (
              <>
                <button
                  type="button"
                  onClick={cerrarModalReporte}
                  className="absolute right-4 top-4 rounded-full bg-surface-muted p-2 text-fg-subtle transition-colors hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dime-200 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                  aria-label="Cerrar"
                >
                  <X className="h-5 w-5" />
                </button>
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
            <p className="mb-6 text-[11px] font-semibold tracking-wide text-fg-subtle">
              Build: <span className="font-mono">{BUILD_ID}</span>
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
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-dime-600 shadow-dime-lg">
              {/* Aros de interacción (solo cuando no hay reduced motion) */}
              {!prefersReducedMotion && !respondiendo && !cargandoRespuesta && (
                <>
                  <span
                    className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-dime-200/70"
                    aria-hidden
                  />
                  <span
                    className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-dime-200/45 animate-ping"
                    style={{ animationDuration: '1.4s' }}
                    aria-hidden
                  />
                  <span
                    className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-dime-200/25 animate-ping"
                    style={{ animationDuration: '2.1s' }}
                    aria-hidden
                  />
                </>
              )}

              {/* Aros de interacción en “Respondiendo” (mismo comportamiento que “Escuchando”) */}
              {!prefersReducedMotion && respondiendo && (
                <>
                  <span
                    className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-dime-200/70"
                    aria-hidden
                  />
                  <span
                    className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-dime-200/45 animate-ping"
                    style={{ animationDuration: '1.4s' }}
                    aria-hidden
                  />
                  <span
                    className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-dime-200/25 animate-ping"
                    style={{ animationDuration: '2.1s' }}
                    aria-hidden
                  />
                </>
              )}

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
