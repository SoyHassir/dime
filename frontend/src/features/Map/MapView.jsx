import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { InfoCard } from '../../components/ui/InfoCard';

// Enfoque: “ver todo a la vez”
// - Pins uniformes para reducir ruido visual
// - El pin seleccionado se destaca ligeramente
const COLOR_PIN_DEFAULT = '#1c528b'; // DIME
const COLOR_PIN_SELECTED = '#153a5f'; // DIME más oscuro

// Crear icono personalizado con color
const crearIconoColoreado = (color) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        position: relative;
      ">
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(45deg);
          width: 8px;
          height: 8px;
          background-color: white;
          border-radius: 50%;
        "></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  });
};

// Cache de iconos por color
const iconosCache = new Map();

const getIconoPorColor = (color) => {
  if (!iconosCache.has(color)) iconosCache.set(color, crearIconoColoreado(color));
  return iconosCache.get(color);
};

function FlyToLocation({ coords }) {
  const map = useMap();
  if (coords) {
    map.flyTo(coords, 16, { duration: 1.5 });
  }
  return null;
}

/** Offset vertical del hint: con toast visible hace falta más espacio para no quedar pegado al aviso. */
const HINT_TOP_DEFAULT =
  'top-[max(6.25rem,calc(env(safe-area-inset-top,0px)+5rem))]';
const HINT_TOP_WITH_TOAST =
  'top-[max(8.75rem,calc(env(safe-area-inset-top,0px)+7rem))]';

export const MapView = ({
  lugares,
  lugarSeleccionado,
  onMarkerClick,
  showExploreHint = true,
  toastOpen = false,
  /** Oculta el pill "Explora…" (p. ej. modo solo chat con teclado). */
  keyboardOpen = false,
  /** Mapa invisible: no capturar toques (p. ej. teclado + chat expandido). */
  mapObscured = false,
}) => {
  const centroTolu = [9.524189, -75.582492];

  const lugaresValidos = useMemo(() => {
    if (!lugares || !Array.isArray(lugares) || lugares.length === 0) {
      return [];
    }
    
    const validos = lugares.filter(lugar => {
      const esValido = lugar && 
             lugar.ubicacion && 
             typeof lugar.ubicacion.lat === 'number' && 
             typeof lugar.ubicacion.lng === 'number' &&
             !isNaN(lugar.ubicacion.lat) && 
             !isNaN(lugar.ubicacion.lng) &&
             lugar.ubicacion.lat !== 0 && 
             lugar.ubicacion.lng !== 0;
      
      return esValido;
    });
    
    return validos;
  }, [lugares]);


  return (
    <div className={`h-full w-full z-0 ${mapObscured ? 'pointer-events-none' : ''}`}>
      <MapContainer 
        center={centroTolu} 
        zoom={15} 
        className="h-full w-full"
        zoomControl={false} 
      >
        <TileLayer 
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
            attribution='&copy; OpenStreetMap contributors'
        />
        
        {lugarSeleccionado && (
           <FlyToLocation coords={[lugarSeleccionado.ubicacion.lat, lugarSeleccionado.ubicacion.lng]} />
        )}

        {lugaresValidos.length > 0 ? lugaresValidos.map((lugar) => {
            const isSelected = lugarSeleccionado?.id === lugar.id;
            const iconoColoreado = getIconoPorColor(isSelected ? COLOR_PIN_SELECTED : COLOR_PIN_DEFAULT);
            
            return (
              <Marker 
                key={lugar.id} 
                position={[lugar.ubicacion.lat, lugar.ubicacion.lng]}
                icon={iconoColoreado}
                eventHandlers={{
                  click: () => onMarkerClick(lugar),
                }}
              >
              </Marker>
            );
          }) : (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
              <p className="dime-glass-map-hint rounded-dime-lg px-4 py-2 text-sm font-medium text-fg-muted">
                {lugares && lugares.length === 0 ? 'Cargando lugares...' : 'No hay lugares para mostrar'}
              </p>
            </div>
          )}
      </MapContainer>

      {lugaresValidos.length > 0 && !lugarSeleccionado && (
        <div
          className={`pointer-events-none absolute left-0 right-0 z-[400] flex justify-center px-4 transition-[opacity,top] duration-300 ease-out motion-reduce:transition-none ${
            toastOpen ? HINT_TOP_WITH_TOAST : HINT_TOP_DEFAULT
          } ${
            showExploreHint && !keyboardOpen ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden={!showExploreHint || keyboardOpen}
        >
          <p className="dime-glass-map-hint max-w-md rounded-dime-xl px-4 py-2.5 text-center text-sm font-semibold text-dime-700">
            Explora las entidades públicas
          </p>
        </div>
      )}

      <AnimatePresence>
        {lugarSeleccionado && (
          <div className="absolute inset-0 z-[1100] flex items-center justify-center p-6 pointer-events-none">
            <div className="w-full max-w-sm pointer-events-auto">
               <InfoCard 
                  key={lugarSeleccionado.id}
                  titulo={lugarSeleccionado.nombre}
                  categoria={lugarSeleccionado.categoria}
                  direccion={lugarSeleccionado.direccion}
                  onClose={() => onMarkerClick(null)} 
               />
            </div>
            
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};