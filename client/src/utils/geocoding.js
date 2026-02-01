export const fetchAddressFromCoords = async (lat, lng) => {
  if (!window.google || !window.google.maps) {
    console.error("Google Maps API not loaded");
    return "Map API not ready"; 
  }

  const geocoder = new window.google.maps.Geocoder();

  try {
    const response = await geocoder.geocode({ location: { lat, lng } });
    if (response.results[0]) {
      return response.results[0].formatted_address;
    } else {
      return "Address not found";
    }
  } catch (error) {
    console.error("Geocoding error:", error);
    return "Error fetching address";
  }
};