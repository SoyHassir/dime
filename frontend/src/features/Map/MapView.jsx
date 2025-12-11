import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { InfoCard } from '../../components/ui/InfoCard';

// Mapeo de categorías a colores
const getColorPorCategoria = (categoria) => {
  if (!categoria) return '#6B7280'; // Gris por defecto
  
  const categoriaNormalizada = categoria.toUpperCase().trim();
  
  // Educación
  if (categoriaNormalizada.includes('EDUCACIÓN') || 
      categoriaNormalizada.includes('EDUCACION') ||
      categoriaNormalizada.includes('CENTRO DE DESARROLLO INFANTIL')) {
    return '#2563EB'; // Azul
  }
  
  // Salud
  if (categoriaNormalizada.includes('SALUD')) {
    return '#DC2626'; // Rojo
  }
  
  // Seguridad
  if (categoriaNormalizada.includes('SEGURIDAD') || 
      categoriaNormalizada.includes('GESTIÓN DEL RIESGO') ||
      categoriaNormalizada.includes('CONTROL Y VIGILANCIA')) {
    return '#F59E0B'; // Ámbar/Naranja
  }
  
  // Espacios públicos
  if (categoriaNormalizada.includes('ESPACIO PÚBLICO') || 
      categoriaNormalizada.includes('ESPACIO PUBLICO')) {
    return '#10B981'; // Verde
  }
  
  // Administración
  if (categoriaNormalizada.includes('ADMINISTRACIÓN') || 
      categoriaNormalizada.includes('ADMINISTRACION')) {
    return '#7C3AED'; // Morado
  }
  
  // Cultura
  if (categoriaNormalizada.includes('CULTURA')) {
    return '#9333EA'; // Púrpura
  }
  
  // Deportes
  if (categoriaNormalizada.includes('DEPORTIVO') || 
      categoriaNormalizada.includes('DEPORTE')) {
    return '#EA580C'; // Naranja
  }
  
  // Religioso
  if (categoriaNormalizada.includes('RELIGIOSO')) {
    return '#D97706'; // Dorado/Ámbar oscuro
  }
  
  // Bienestar social
  if (categoriaNormalizada.includes('BIENESTAR') || 
      categoriaNormalizada.includes('ATENCIÓN SOCIAL') ||
      categoriaNormalizada.includes('ATENCION SOCIAL') ||
      categoriaNormalizada.includes('DERECHOS HUMANOS')) {
    return '#EC4899'; // Rosa
  }
  
  // Transporte
  if (categoriaNormalizada.includes('TRANSPORTE') || 
      categoriaNormalizada.includes('MOVILIDAD') ||
      categoriaNormalizada.includes('VIAL')) {
    return '#0891B2'; // Cian
  }
  
  // Servicios públicos
  if (categoriaNormalizada.includes('SERVICIOS PÚBLICOS') || 
      categoriaNormalizada.includes('SERVICIOS PUBLICOS') ||
      categoriaNormalizada.includes('SANEAMIENTO')) {
    return '#059669'; // Verde esmeralda
  }
  
  // Comercio
  if (categoriaNormalizada.includes('COMERCIO')) {
    return '#6366F1'; // Índigo
  }
  
  // Funerario
  if (categoriaNormalizada.includes('FUNERARIO')) {
    return '#4B5563'; // Gris oscuro
  }
  
  // Medio ambiente
  if (categoriaNormalizada.includes('MEDIO AMBIENTE') || 
      categoriaNormalizada.includes('DESARROLLO RURAL')) {
    return '#16A34A'; // Verde
  }
  
  // Ciencia y tecnología
  if (categoriaNormalizada.includes('CIENCIA') || 
      categoriaNormalizada.includes('TECNOLOGÍA') ||
      categoriaNormalizada.includes('TECNOLOGIA') ||
      categoriaNormalizada.includes('INNOVACIÓN') ||
      categoriaNormalizada.includes('INNOVACION')) {
    return '#8B5CF6'; // Violeta
  }
  
  // Por defecto: gris
  return '#6B7280';
};

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

const getIconoPorCategoria = (categoria) => {
  const color = getColorPorCategoria(categoria);
  
  if (!iconosCache.has(color)) {
    iconosCache.set(color, crearIconoColoreado(color));
  }
  
  return iconosCache.get(color);
};

function FlyToLocation({ coords }) {
  const map = useMap();
  if (coords) {
    map.flyTo(coords, 16, { duration: 1.5 });
  }
  return null;
}

export const MapView = ({ lugares, lugarSeleccionado, onMarkerClick }) => {
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
            const iconoColoreado = getIconoPorCategoria(lugar.categoria);
            
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
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
              <p className="bg-white/90 px-4 py-2 rounded-lg text-sm text-gray-600">
                {lugares && lugares.length === 0 ? 'Cargando lugares...' : 'No hay lugares para mostrar'}
              </p>
            </div>
          )}
      </MapContainer>

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