
import React, { useState, useRef, useEffect } from 'react';
import { IconMic, IconClose } from './Icons';
import { transcribeAudio } from '../services/gemini';

interface VoiceInputProps {
    onTextReceived: (text: string) => void;
    className?: string;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ onTextReceived, className = '' }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
    const [showDeviceSelector, setShowDeviceSelector] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    useEffect(() => {
        const storedId = localStorage.getItem('selectedMicDeviceId');
        if (storedId) {
            setSelectedDeviceId(storedId);
        }
    }, []);

    const getDevices = async () => {
        try {
            // Need to ask permission first to get labels
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // Close the stream immediately as we only needed permission to enumerate devices with labels
            stream.getTracks().forEach(track => track.stop());
            
            const devs = await navigator.mediaDevices.enumerateDevices();
            const audioInputs = devs.filter(d => d.kind === 'audioinput');
            setDevices(audioInputs);
            if (audioInputs.length > 0 && !selectedDeviceId) {
                // Default to first if not set
                // Don't set automatically to storage unless user picks, but use it.
            }
        } catch (err) {
            console.error("Error enumerating devices", err);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : true 
            });
            
            // If we haven't fetched devices yet (first time), do it now to populate list for future
            if (devices.length === 0) {
                 getDevices();
            }

            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error starting recording", err);
            // This usually means permission denied
        }
    };

    const stopAndTranscribe = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.onstop = async () => {
                setIsRecording(false);
                setIsTranscribing(true);
                
                // Stop all tracks to release mic
                mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());

                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = async () => {
                    const base64data = reader.result as string;
                    // base64data looks like "data:audio/webm;base64,GkXfo59ChoEBQveBAUL..."
                    const base64Content = base64data.split(',')[1];
                    const mimeType = base64data.split(',')[0].split(':')[1].split(';')[0];

                    try {
                        const text = await transcribeAudio(base64Content, mimeType);
                        if (text) {
                            onTextReceived(text);
                        }
                    } catch (e) {
                        console.error("Transcription failed", e);
                    } finally {
                        setIsTranscribing(false);
                    }
                };
            };
        }
    };

    const toggleRecording = () => {
        if (isRecording) {
            stopAndTranscribe();
        } else {
            startRecording();
        }
    };

    const handleDeviceSelect = (deviceId: string) => {
        setSelectedDeviceId(deviceId);
        localStorage.setItem('selectedMicDeviceId', deviceId);
        setShowDeviceSelector(false);
    };

    return (
        <div className={`relative flex items-center ${className}`}>
            <button
                type="button"
                onClick={toggleRecording}
                disabled={isTranscribing}
                className={`p-2 rounded-lg transition-colors flex items-center justify-center ${
                    isRecording 
                    ? 'bg-red-50 text-red-600 animate-pulse border border-red-200' 
                    : isTranscribing 
                        ? 'bg-slate-100 text-slate-400 cursor-wait'
                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                }`}
                title="Dictate with AI"
            >
                {isTranscribing ? (
                     <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" />
                ) : (
                    <IconMic className="w-5 h-5" />
                )}
            </button>
            
            {/* Device Selector Toggle (Tiny arrow) */}
            {!isRecording && !isTranscribing && (
                <button 
                    type="button"
                    onClick={async (e) => {
                        e.stopPropagation();
                        if (devices.length === 0) await getDevices();
                        setShowDeviceSelector(!showDeviceSelector);
                    }}
                    className="absolute -bottom-1 -right-1 bg-white border border-slate-200 rounded-full p-0.5 text-slate-400 hover:text-indigo-600 shadow-sm"
                    title="Select Microphone"
                >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </button>
            )}

            {/* Device Selector Dropdown */}
            {showDeviceSelector && (
                <>
                <div className="fixed inset-0 z-40" onClick={() => setShowDeviceSelector(false)}></div>
                <div className="absolute bottom-full right-0 mb-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-200 origin-bottom-right">
                    <div className="flex justify-between items-center mb-2 px-2">
                        <span className="text-xs font-bold text-slate-500 uppercase">Select Microphone</span>
                        <button onClick={() => setShowDeviceSelector(false)}><IconClose className="w-3 h-3 text-slate-400" /></button>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        {devices.length > 0 ? devices.map(d => (
                            <button
                                key={d.deviceId}
                                onClick={() => handleDeviceSelect(d.deviceId)}
                                className={`w-full text-left px-3 py-2 text-xs rounded-lg truncate transition-colors ${selectedDeviceId === d.deviceId ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                                {d.label || `Microphone ${d.deviceId.slice(0, 5)}...`}
                            </button>
                        )) : (
                            <div className="px-3 py-2 text-xs text-slate-400 italic">No microphones found. Try clicking the mic icon first to grant permission.</div>
                        )}
                    </div>
                </div>
                </>
            )}
        </div>
    );
}
