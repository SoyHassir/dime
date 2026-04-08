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

export const MapView = ({ lugares, lugarSeleccionado, onMarkerClick, showExploreHint = true }) => {
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
    <div className="h-full w-full z-0">
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
              <p className="rounded-dime-lg border border-border bg-surface/95 px-4 py-2 text-sm font-medium text-fg-muted shadow-dime-sm backdrop-blur-sm">
                {lugares && lugares.length === 0 ? 'Cargando lugares...' : 'No hay lugares para mostrar'}
              </p>
            </div>
          )}
      </MapContainer>

      {showExploreHint && lugaresValidos.length > 0 && !lugarSeleccionado && (
        <div className="pointer-events-none absolute bottom-[10.5rem] left-0 right-0 z-[400] flex justify-center px-4 sm:bottom-[11rem]">
          <p className="max-w-md rounded-dime-xl border border-border bg-surface/95 px-4 py-2.5 text-center text-sm font-semibold text-dime-700 shadow-dime-md backdrop-blur-sm">
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