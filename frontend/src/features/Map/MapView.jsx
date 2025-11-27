import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { InfoCard } from '../../components/ui/InfoCard';

// Fix para los iconos de Leaflet (problema común en React)
// Usar rutas absolutas desde public para que funcionen en producción
const DefaultIcon = L.icon({
  iconUrl: '/leaflet-icons/marker-icon.png',
  iconRetinaUrl: '/leaflet-icons/marker-icon-2x.png',
  shadowUrl: '/leaflet-icons/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Componente interno para mover la cámara (Zoom)
function FlyToLocation({ coords }) {
  const map = useMap();
  if (coords) {
    map.flyTo(coords, 16, { duration: 1.5 });
  }
  return null;
}

export const MapView = ({ lugares, lugarSeleccionado, onMarkerClick }) => {
  const centroTolu = [9.524189, -75.582492];

  return (
    <div className="h-full w-full z-0">
      {/* CAMBIO: zoomControl={false} elimina los botones de la esquina */}
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
        
        {/* Efecto de vuelo si hay selección */}
        {lugarSeleccionado && (
           <FlyToLocation coords={[lugarSeleccionado.ubicacion.lat, lugarSeleccionado.ubicacion.lng]} />
        )}

        {lugares && lugares.length > 0 ? lugares
          .filter(lugar => {
            // Validación adicional antes de renderizar
            const esValido = lugar && 
                   lugar.ubicacion && 
                   typeof lugar.ubicacion.lat === 'number' && 
                   typeof lugar.ubicacion.lng === 'number' &&
                   !isNaN(lugar.ubicacion.lat) && 
                   !isNaN(lugar.ubicacion.lng) &&
                   lugar.ubicacion.lat !== 0 && 
                   lugar.ubicacion.lng !== 0;
            
            return esValido;
          })
          .map((lugar) => {
            return (
              <Marker 
                key={lugar.id} 
                position={[lugar.ubicacion.lat, lugar.ubicacion.lng]}
                eventHandlers={{
                  click: () => onMarkerClick(lugar),
                }}
              >
                 {/* Opcional: Popup nativo de Leaflet, o usamos nuestra Card flotante */}
              </Marker>
            );
          }) : (
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
              <p className="bg-white/90 px-4 py-2 rounded-lg text-sm text-gray-600">
                No hay lugares para mostrar
              </p>
            </div>
          )}
      </MapContainer>

      {/* Aquí inyectamos nuestra Card flotante sobre el mapa */}
      <AnimatePresence>
        {lugarSeleccionado && (
          <div className="absolute inset-0 z-[1100] flex items-center justify-center p-6 pointer-events-none">
            
            {/* Wrapper para capturar clicks (pointer-events-auto) y limitar ancho */}
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