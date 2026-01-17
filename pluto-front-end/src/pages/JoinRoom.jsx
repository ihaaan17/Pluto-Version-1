import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Sparkles, Rocket, Lock, Terminal, Radio } from 'lucide-react';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';


const JoinRoom = () => {
  const navigate = useNavigate();
  const username = localStorage.getItem('username');
  const [roomType, setRoomType] = useState('group'); // 'group' or 'join'
  const [roomName, setRoomName] = useState('');
  const [roomIdToJoin, setRoomIdToJoin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!username) navigate('/');
  }, [username, navigate]);

  // ✅ UPDATED: Separate logic for create vs join
  const handleCreateRoom = async (e) => {
    e.preventDefault();
    const id = roomName.trim();
    if (!id) {
      setError('IDENTIFICATION REQUIRED');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = { roomId: id, username: username };
      // Use /create endpoint
      const response = await axios.post(API_ENDPOINTS.CREATE_ROOM, payload);
      navigate(`/chat/${response.data.roomId}`);
    } catch (err) {
      // Handle specific error for existing room
      if (err.response?.status === 409) {
        setError('ROOM NAME ALREADY EXISTS. CHOOSE ANOTHER.');
      } else {
        setError(err.response?.data?.error || 'UPLINK ERROR: SIGNAL LOST');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    const id = roomIdToJoin.trim();
    if (!id) {
      setError('IDENTIFICATION REQUIRED');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = { roomId: id, username: username };
      // Use /join endpoint
      const response = await axios.post(API_ENDPOINTS.JOIN_ROOM, payload);
      navigate(`/chat/${response.data.roomId}`);
    } catch (err) {
      // Handle specific error for non-existent room
      if (err.response?.status === 404) {
        setError('ROOM NOT FOUND. CHECK THE CODE.');
      } else {
        setError(err.response?.data?.error || 'UPLINK ERROR: SIGNAL LOST');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
      className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden bg-[#050208]"
    >
      {/* 🌌 CONSISTENT BACKGROUND STACK */}
      <div className="nebula-bg" />
      <div className="absolute inset-[-100%] animate-drift opacity-15 z-0 pointer-events-none">
        <div className="w-full h-full bg-[radial-gradient(circle,white_1.2px,transparent_1.2px)] bg-[length:100px_100px]" />
      </div>

      {/* 🔦 DYNAMIC MOUSE GLOW */}
      <div 
        className="pointer-events-none absolute inset-0 z-10 opacity-30 transition-opacity duration-500"
        style={{ background: `radial-gradient(600px at ${mousePos.x}px ${mousePos.y}px, rgba(168, 85, 247, 0.15), transparent 80%)` }}
      />

      {/* 🖥️ MODAL CARD */}
      <div className="relative z-20 w-full max-w-[460px] premium-glass p-8 md:p-10 rounded-[2.5rem] border-white/5 animate-in fade-in zoom-in duration-500">
        
        {/* Close Button */}
        <button 
          onClick={() => navigate('/chats')}
          className="absolute right-8 top-8 p-2 text-white/20 hover:text-white/60 hover:bg-white/5 rounded-xl transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
             <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/20">
                <Radio className="w-6 h-6 text-purple-400 animate-pulse" />
             </div>
          </div>
          <p className="text-[9px] text-purple-500/60 font-black uppercase tracking-[0.4em] mb-1">Subspace Frequency</p>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Initialize Channel</h2>
        </div>

        {/* Toggle - Terminal Style */}
        <div className="flex p-1.5 bg-black/40 rounded-2xl mb-10 border border-white/5">
          <button 
            onClick={() => { setRoomType('group'); setError(''); setRoomName(''); }}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
              roomType === 'group' ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Create
          </button>
          <button 
            onClick={() => { setRoomType('join'); setError(''); setRoomIdToJoin(''); }}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
              roomType === 'join' ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Join
          </button>
        </div>

        {/* Dynamic Form - ✅ UPDATED: Different handlers for create vs join */}
        <form onSubmit={roomType === 'group' ? handleCreateRoom : handleJoinRoom} className="space-y-8">
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-[9px] text-gray-500 uppercase tracking-[0.3em] font-black ml-1">
              <Terminal className="w-3 h-3" />
              {roomType === 'group' ? 'Galaxy Designation' : 'Frequency Code'}
            </label>
            <div className="relative group">
              <input 
                type="text" 
                value={roomType === 'group' ? roomName : roomIdToJoin}
                onChange={(e) => {
                  const val = e.target.value;
                  if (roomType === 'group') {
                    setRoomName(val);
                  } else {
                    setRoomIdToJoin(val);
                  }
                }}
                placeholder={roomType === 'group' ? "e.g. Andromeda Station" : "Enter room code..."} 
                className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 px-6 outline-none focus:border-purple-500/50 text-[11px] font-bold text-white transition-all placeholder:text-gray-700 tracking-wide"
                required
              />              
              {roomType === 'group' ? 
                <Sparkles className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500/30" /> : 
                <Lock className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500/30" />
              }
            </div>
            <p className="text-[9px] text-gray-600 ml-1">
              {roomType === 'group' 
                ? 'Room names are case-insensitive. Use hyphens for spaces.' 
                : 'Room codes are case-insensitive'}
            </p>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="auth-button w-full group py-5"
          >
            {loading ? (
              <span className="flex items-center gap-3">
                <Terminal className="w-4 h-4 animate-spin" />
                Processing...
              </span>
            ) : (
              <span className="flex items-center gap-3">
                {roomType === 'group' ? 'CREATE ROOM' : 'JOIN ROOM'}
                <Rocket className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform text-purple-400" />
              </span>
            )}
          </button>
        </form>

        {/* Error Overlay */}
        {error && (
          <div className="mt-8 p-4 bg-red-500/5 border border-red-500/20 rounded-2xl animate-in slide-in-from-bottom-2 duration-300">
            <p className="text-red-400 text-[10px] font-bold tracking-widest text-center uppercase">{error}</p>
          </div>
        )}
      </div>

      {/* Footer Decoration */}
      <div className="fixed bottom-8 opacity-10 flex gap-10 pointer-events-none">
        <p className="text-[8px] font-black tracking-[1em] text-white">SYSTEM_STATUS_NOMINAL</p>
      </div>
    </div>
  );
};

export default JoinRoom;