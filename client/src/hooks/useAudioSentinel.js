import { useEffect, useRef, useState } from 'react';
import { useAuth0 } from "@auth0/auth0-react";

// KEEP YOUR EXISTING URL
const SOCKET_URL = "wss://audio-safety-service-959468711582.asia-south2.run.app/ws/audio"; 

export const useAudioSentinel = (userId, isEnabled) => {
    const { getAccessTokenSilently } = useAuth0();
    const [status, setStatus] = useState("disconnected");
    
    // Refs
    const socketRef = useRef(null);
    const audioContextRef = useRef(null);
    const processorRef = useRef(null);
    const streamRef = useRef(null);

    useEffect(() => {
        if (isEnabled && userId) {
            startStream();
        } else {
            stopStream();
        }
        return () => stopStream();
    }, [isEnabled, userId]);

    const startStream = async () => {
        try {
            if (!userId) return;
            setStatus("connecting");

            const token = await getAccessTokenSilently({
                audience: import.meta.env.VITE_AUTH0_AUDIENCE,
            });

            // 1. Initialize WebSocket
            socketRef.current = new WebSocket(`${SOCKET_URL}/${userId}?token=${token}`);

            socketRef.current.onopen = async () => {
                setStatus("connected");
                console.log("✅ WebSocket Connected. Starting Mic...");
                // Only start audio once socket is actually open to prevent buffering issues
                await initAudio(); 
            };

            socketRef.current.onclose = (event) => {
                console.log("WebSocket Closed:", event.code, event.reason);
                setStatus("disconnected");
                cleanupAudio(); // Stop mic if socket drops
            };
            
            socketRef.current.onerror = (error) => {
                console.error("WebSocket Error:", error);
            };

        } catch (error) {
            console.error("Auth/Connection Error:", error);
            setStatus("error");
        }
    };

    const initAudio = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            // 2. CRITICAL FIX: Ensure Sample Rate matches Backend (16000)
            const audioContext = new (window.AudioContext || window.webkitAudioContext)({ 
                sampleRate: 16000,
                latencyHint: 'interactive'
            });
            audioContextRef.current = audioContext;

            // 3. CRITICAL FIX: Resume AudioContext if suspended (Browser Policy)
            if (audioContext.state === 'suspended') {
                await audioContext.resume();
                console.log("🔊 AudioContext Resumed");
            }

            const source = audioContext.createMediaStreamSource(stream);
            // Buffer size 4096 is good.
            const processor = audioContext.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (e) => {
                if (socketRef.current?.readyState === WebSocket.OPEN) {
                    const inputData = e.inputBuffer.getChannelData(0);

                    // 4. DEBUGGING: Check if mic is sending actual sound or just zeros
                    // Calculate rough volume (Root Mean Square)
                    let sum = 0;
                    for (let i = 0; i < inputData.length; i++) {
                        sum += inputData[i] * inputData[i];
                    }
                    const rms = Math.sqrt(sum / inputData.length);
                    
                    // Log if completely silent (likely permission/device issue)
                    if (rms === 0) {
                        console.warn("⚠️ Mic is sending pure silence (Digital Zero). Check Input Device.");
                    } else if (rms > 0.01) {
                        // Uncomment to see visual "heartbeat" in console when you speak
                        // console.log("🎤 Audio Level:", rms.toFixed(4)); 
                    }

                    const buffer = convertFloat32ToInt16(inputData);
                    socketRef.current.send(buffer);
                }
            };

            source.connect(processor);
            processor.connect(audioContext.destination);

        } catch (err) {
            console.error("Mic Error:", err);
            setStatus("error");
        }
    };

    const cleanupAudio = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
    };

    const stopStream = () => {
        cleanupAudio();
        if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
        }
        setStatus("disconnected");
    };

    const convertFloat32ToInt16 = (buffer) => {
        let l = buffer.length;
        const buf = new Int16Array(l);
        while (l--) {
            // Clamp value between -1 and 1 before converting
            let s = Math.max(-1, Math.min(1, buffer[l]));
            buf[l] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        return buf.buffer;
    };

    return { status };
};