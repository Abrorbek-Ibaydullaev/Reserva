import React from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const BusinessMap = ({ latitude, longitude, name, address, height = 300 }) => {
  const lat = Number(latitude);
  const lng = Number(longitude);
  const hasLocation = Number.isFinite(lat) && Number.isFinite(lng);

  if (!hasLocation) {
    return (
      <div className={`flex h-[${height}px] items-center justify-center bg-slate-100 text-sm font-medium text-slate-500`}>
        Location not available
      </div>
    );
  }

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={15}
      scrollWheelZoom={false}
      zoomControl={false}
      className="w-full"
      style={{ height, width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lng]}>
        <Popup>
          <div className="max-w-[220px]">
            <p className="font-semibold">{name || 'Business'}</p>
            {address ? <p className="mt-1 text-sm">{address}</p> : null}
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  );
};

export default BusinessMap;
