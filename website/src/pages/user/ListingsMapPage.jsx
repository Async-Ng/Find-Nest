import React, { useState } from 'react';
import MapComponent from '../../components/MapComponent';

const ListingsMapPage = () => {
  const [selectedLocation, setSelectedLocation] = useState(null);

  const handleLocationSelect = (location) => {
    console.log('Selected location:', location);
    setSelectedLocation(location);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Title now in Navbar - removed header */}
      
      {/* Main Content - Full Map with proper height calculation */}
      {/* Height accounts for: viewport (100vh) - navbar (85px) = remaining space */}
      <div className="h-[calc(112vh-85px)]">
        <MapComponent
          onLocationSelect={handleLocationSelect}
          center={[105.8047, 21.0285]}
          zoom={13}
        />
      </div>
    </div>
  );
};

export default ListingsMapPage;
