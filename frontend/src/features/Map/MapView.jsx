import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { InfoCard } from '../../components/ui/InfoCard';

// Mapeo de categorías a colores - Paleta basada en DIME (#1c528b)
// Colores muy tenues y sutiles que armonizan con la marca
const getColorPorCategoria = (categoria) => {
  if (!categoria) return '#94A3B8'; // Gris tenue por defecto
  
  const categoriaNormalizada = categoria.toUpperCase().trim();
  
  // Educación - Variación clara del azul DIME
  if (categoriaNormalizada.includes('EDUCACIÓN') || 
      categoriaNormalizada.includes('EDUCACION') ||
      categoriaNormalizada.includes('CENTRO DE DESARROLLO INFANTIL')) {
    return '#7C9BC4'; // Azul DIME muy claro y tenue
  }
  
  // Salud - Complementario sutil
  if (categoriaNormalizada.includes('SALUD')) {
    return '#C4A5A5'; // Rosa salmón muy tenue
  }
  
  // Seguridad - Variación cálida sutil
  if (categoriaNormalizada.includes('SEGURIDAD') || 
      categoriaNormalizada.includes('GESTIÓN DEL RIESGO') ||
      categoriaNormalizada.includes('CONTROL Y VIGILANCIA')) {
    return '#B8A57C'; // Beige cálido muy tenue
  }
  
  // Espacios públicos - Verde complementario muy sutil
  if (categoriaNormalizada.includes('ESPACIO PÚBLICO') || 
      categoriaNormalizada.includes('ESPACIO PUBLICO')) {
    return '#9BC4A5'; // Verde menta muy tenue
  }
  
  // Administración - Variación azul DIME
  if (categoriaNormalizada.includes('ADMINISTRACIÓN') || 
      categoriaNormalizada.includes('ADMINISTRACION')) {
    return '#8BA5C4'; // Azul DIME claro
  }
  
  // Cultura - Variación púrpura muy sutil
  if (categoriaNormalizada.includes('CULTURA')) {
    return '#A59BC4'; // Lavanda muy tenue
  }
  
  // Deportes - Naranja muy sutil
  if (categoriaNormalizada.includes('DEPORTIVO') || 
      categoriaNormalizada.includes('DEPORTE')) {
    return '#C4A58B'; // Naranja beige muy tenue
  }
  
  // Religioso - Dorado muy sutil
  if (categoriaNormalizada.includes('RELIGIOSO')) {
    return '#C4B88B'; // Dorado beige muy tenue
  }
  
  // Bienestar social - Rosa muy sutil
  if (categoriaNormalizada.includes('BIENESTAR') || 
      categoriaNormalizada.includes('ATENCIÓN SOCIAL') ||
      categoriaNormalizada.includes('ATENCION SOCIAL') ||
      categoriaNormalizada.includes('DERECHOS HUMANOS')) {
    return '#C4A5B8'; // Rosa pálido muy tenue
  }
  
  // Transporte - Cian muy sutil
  if (categoriaNormalizada.includes('TRANSPORTE') || 
      categoriaNormalizada.includes('MOVILIDAD') ||
      categoriaNormalizada.includes('VIAL')) {
    return '#8BC4B8'; // Cian menta muy tenue
  }
  
  // Servicios públicos - Verde muy sutil
  if (categoriaNormalizada.includes('SERVICIOS PÚBLICOS') || 
      categoriaNormalizada.includes('SERVICIOS PUBLICOS') ||
      categoriaNormalizada.includes('SANEAMIENTO')) {
    return '#9BC4A5'; // Verde menta muy tenue
  }
  
  // Comercio - Variación azul DIME
  if (categoriaNormalizada.includes('COMERCIO')) {
    return '#7C9BC4'; // Azul DIME claro
  }
  
  // Funerario - Gris neutro
  if (categoriaNormalizada.includes('FUNERARIO')) {
    return '#94A3B8'; // Gris azulado tenue
  }
  
  // Medio ambiente - Verde muy sutil
  if (categoriaNormalizada.includes('MEDIO AMBIENTE') || 
      categoriaNormalizada.includes('DESARROLLO RURAL')) {
    return '#9BC4A5'; // Verde menta muy tenue
  }
  
  // Ciencia y tecnología - Variación azul DIME
  if (categoriaNormalizada.includes('CIENCIA') || 
      categoriaNormalizada.includes('TECNOLOGÍA') ||
      categoriaNormalizada.includes('TECNOLOGIA') ||
      categoriaNormalizada.includes('INNOVACIÓN') ||
      categoriaNormalizada.includes('INNOVACION')) {
    return '#8BA5C4'; // Azul DIME claro
  }
  
  // Por defecto: gris tenue
  return '#94A3B8';
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