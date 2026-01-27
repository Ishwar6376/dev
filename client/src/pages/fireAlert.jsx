import React, { useState, useEffect } from 'react';
import { Flame, X, CheckCircle, Loader } from 'lucide-react'; 
import { ref, push, set } from "firebase/database";
import { db } from "./firebaseConfig";
import { useJsApiLoader } from '@react-google-maps/api';
import { fetchAddressFromCoords } from './../utils/geocoding';
import { useAuthStore } from '@/store/useAuthStore';
export const FireSOSButton = () => {
  const [status, setStatus] = useState('idle'); 
  const [timeLeft, setTimeLeft] = useState(10);
  const [locationData, setLocationData] = useState(null);
  const {isLoaded}=useJsApiLoader({
    id:'google-map-script',
    googleMapsApiKey:import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  })
  const getRealLocation =() => {
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by this browser.");
      return;
    }
    if(!isLoaded){
      console.warn("google maps api key is not loaded yet");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const address=await fetchAddressFromCoords(latitude,longitude);
        setLocationData({
          userEmail:user.email,
          userProfileUrl:user.picture,
          userId:user.id,
          lat: latitude,
          lng: longitude,
          accuracy: accuracy,
          address:address
        });
      },
      (error) => {
        console.error("Error fetching location:", error);
        setLocationData({ error: "Location permission denied" });
      },
      { enableHighAccuracy: true }
    );
  };

  const triggerFireSOS = () => {
    const alertsRef = ref(db, 'fireAlerts/');
    const newAlertRef = push(alertsRef);
    const finalLocation = locationData || "Fetching failed or pending";

    set(newAlertRef, {
      type: "FIRE_SOS",
      status: "CRITICAL",
      timestamp: Date.now(),
      location: finalLocation, // Sends the Object { lat, lng, accuracy }
      user_action: "SOS_BUTTON_PRESSED"
    }).then(() => {
      console.log("SOS Signal Sent to Firebase");
    });
  };

  // 2. The Logic to Handle Timer & Auto-Fire
  useEffect(() => {
    let timer;
    
    if (status === 'counting' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } 
    else if (status === 'counting' && timeLeft === 0) {
      triggerFireSOS(); 
      setStatus('sent'); 
    }

    return () => clearInterval(timer);
  }, [status, timeLeft]);

  // 3. The Click Handler
  const handleClick = () => {
    if (status === 'idle') {
      setStatus('counting');
      setTimeLeft(10);
      
      // START FETCHING LOCATION IMMEDIATELY ON CLICK
      // This ensures we have the data ready when the 10s timer ends
      getRealLocation(); 

    } else if (status === 'counting') {
      setStatus('idle');
      setTimeLeft(10);
      setLocationData(null); // Reset location data on cancel
    }
  };

  // Styles based on state
  const getButtonColor = () => {
    if (status === 'sent') return 'bg-gray-600 text-gray-300 cursor-not-allowed';
    if (status === 'counting') return 'bg-white text-red-600 animate-pulse border-2 border-red-600';
    return 'bg-red-600 text-white hover:bg-red-700 shadow-[0_0_15px_rgba(220,38,38,0.7)]';
  };

  return (
    <button
      onClick={handleClick}
      disabled={status === 'sent'}
      className={`relative flex items-center justify-center gap-2 px-6 py-2 rounded-full font-bold transition-all duration-300 ${getButtonColor()}`}
    >
      {status === 'idle' && (
        <>
          <Flame className="w-5 h-5 fill-current" />
          <span>SOS</span>
        </>
      )}

      {status === 'counting' && (
        <>
          <span className="absolute -top-3 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 border-2 border-white text-xs text-white font-bold">
            {timeLeft}
          </span>
          <X className="w-5 h-5" />
          <span>CANCEL</span>
        </>
      )}

      {status === 'sent' && (
        <>
          <CheckCircle className="w-5 h-5" />
          <span>SENT</span>
        </>
      )}
    </button>
  );
};