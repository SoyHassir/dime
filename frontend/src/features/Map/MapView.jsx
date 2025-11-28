import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { InfoCard } from '../../components/ui/InfoCard';

let defaultIconInstance = null;

const getDefaultIcon = () => {
  if (typeof window === 'undefined') {
    return L.Icon.Default.prototype;
  }
  
  if (defaultIconInstance) {
    return defaultIconInstance;
  }
  
  const baseUrl = window.location.origin;
  const iconUrl = `${baseUrl}/leaflet-icons/marker-icon.png`;
  const iconRetinaUrl = `${baseUrl}/leaflet-icons/marker-icon-2x.png`;
  const shadowUrl = `${baseUrl}/leaflet-icons/marker-shadow.png`;
  
  defaultIconInstance = L.icon({
    iconUrl: iconUrl,
    iconRetinaUrl: iconRetinaUrl,
    shadowUrl: shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
  });
  
  const preloadImages = [iconUrl, iconRetinaUrl, shadowUrl];
  
  preloadImages.forEach(url => {
    const img = new Image();
    img.onerror = () => {};
    img.src = url;
  });
  
  return defaultIconInstance;
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
  const [iconoListo, setIconoListo] = useState(false);
  const [iconoError, setIconoError] = useState(false);
  
  useEffect(() => {
    const initIcon = () => {
      try {
        const icon = getDefaultIcon();
        if (icon && icon.options && icon.options.iconUrl) {
          L.Marker.prototype.options.icon = icon;
          setIconoListo(true);
        } else {
          setIconoError(true);
        }
      } catch (error) {
        setIconoError(true);
      }
    };
    
    initIcon();
    
    const timeout = setTimeout(() => {
      if (!iconoListo) {
        initIcon();
      }
    }, 100);
    
    return () => clearTimeout(timeout);
  }, []);

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
            const icon = getDefaultIcon();
            const iconToUse = icon || L.Icon.Default.prototype;
            
            return (
              <Marker 
                key={lugar.id} 
                position={[lugar.ubicacion.lat, lugar.ubicacion.lng]}
                icon={iconToUse}
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