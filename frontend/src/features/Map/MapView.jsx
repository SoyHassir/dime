import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { InfoCard } from '../../components/ui/InfoCard';

// Fix para los iconos de Leaflet (problema común en React)
// Crear icono singleton que se reutiliza
let defaultIconInstance = null;

const getDefaultIcon = () => {
  // Asegurar que window esté disponible
  if (typeof window === 'undefined') {
    console.warn('⚠️ window no está disponible, usando icono por defecto de Leaflet');
    return L.Icon.Default.prototype;
  }
  
  // Si ya existe, retornarlo
  if (defaultIconInstance) {
    return defaultIconInstance;
  }
  
  // Crear nuevo icono
  const baseUrl = window.location.origin;
  
  // Construir URLs absolutas para los iconos
  const iconUrl = `${baseUrl}/leaflet-icons/marker-icon.png`;
  const iconRetinaUrl = `${baseUrl}/leaflet-icons/marker-icon-2x.png`;
  const shadowUrl = `${baseUrl}/leaflet-icons/marker-shadow.png`;
  
  console.log('🔧 Creando icono con URLs:', { iconUrl, iconRetinaUrl, shadowUrl });
  
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
  
  // Pre-cargar las imágenes para asegurar que estén disponibles
  const preloadImages = [iconUrl, iconRetinaUrl, shadowUrl];
  
  preloadImages.forEach(url => {
    const img = new Image();
    img.onerror = () => {
      console.error('❌ Error al cargar icono:', url);
    };
    img.onload = () => {
      console.log('✅ Icono cargado exitosamente:', url);
    };
    img.src = url;
  });
  
  return defaultIconInstance;
};

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
  const [iconoListo, setIconoListo] = useState(false);
  const [iconoError, setIconoError] = useState(false);
  
  // Asegurar que los iconos se inicialicen cuando el componente se monte
  useEffect(() => {
    // Esperar un momento para asegurar que window.location esté disponible
    const initIcon = () => {
      try {
        const icon = getDefaultIcon();
        if (icon && icon.options && icon.options.iconUrl) {
          L.Marker.prototype.options.icon = icon;
          setIconoListo(true);
          console.log('✅ Icono inicializado y asignado a L.Marker.prototype');
          console.log('📍 URL del icono:', icon.options.iconUrl);
        } else {
          console.error('❌ No se pudo crear el icono - icon inválido');
          setIconoError(true);
        }
      } catch (error) {
        console.error('❌ Error al inicializar icono:', error);
        setIconoError(true);
      }
    };
    
    // Intentar inmediatamente
    initIcon();
    
    // Si falla, intentar después de un pequeño delay
    const timeout = setTimeout(() => {
      if (!iconoListo) {
        console.log('🔄 Reintentando inicialización de icono...');
        initIcon();
      }
    }, 100);
    
    return () => clearTimeout(timeout);
  }, []);

  // Filtrar y validar lugares
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

  // Debug: Log temporal para verificar datos
  useEffect(() => {
    console.log('🔍 Estado de MapView:', {
      lugaresTotal: lugares?.length || 0,
      lugaresValidos: lugaresValidos.length,
      iconoListo,
      iconoError,
      primerLugar: lugaresValidos[0] || null
    });
    
    if (lugares && lugares.length > 0) {
      console.log('📍 Lugares cargados:', lugares.length);
      console.log('✅ Lugares válidos:', lugaresValidos.length);
      if (lugaresValidos.length > 0) {
        console.log('📍 Primer lugar válido:', lugaresValidos[0]);
        console.log('📍 Coordenadas del primer lugar:', lugaresValidos[0].ubicacion);
      } else {
        console.warn('⚠️ Hay lugares pero ninguno es válido');
        if (lugares.length > 0) {
          console.log('📍 Primer lugar (inválido):', lugares[0]);
        }
      }
    } else {
      console.warn('⚠️ No hay lugares cargados');
    }
  }, [lugares, lugaresValidos, iconoListo, iconoError]);

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

        {lugaresValidos.length > 0 ? lugaresValidos.map((lugar) => {
            // Siempre obtener el icono, incluso si iconoListo es false
            // Esto asegura que los marcadores se rendericen
            const icon = getDefaultIcon();
            
            // Si no hay icono válido, usar el por defecto de Leaflet
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
                 {/* Opcional: Popup nativo de Leaflet, o usamos nuestra Card flotante */}
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