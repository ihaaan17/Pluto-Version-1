import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, LogOut, Plus, User, Rocket, MessageSquare, Radio, Terminal } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';


const ChatList = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();
  const username = localStorage.getItem('username');

  // ✅ ADD THIS HELPER FUNCTION
  const formatRoomName = (roomId) => {
    return roomId
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  useEffect(() => {
    const fetchRooms = async () => {
      if (!username) { navigate('/'); return; }
      try {
        const response = await axios.get(API_ENDPOINTS.USER_ROOMS(username));
        setRooms(response.data);
      } catch (err) {
        setError('Uplink Interrupted.');
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, [navigate, username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050208] flex flex-col items-center justify-center">
        <div className="nebula-bg" />
        <div className="stars-overlay animate-drift" />
        <Rocket className="w-12 h-12 text-purple-500 animate-bounce mb-4 relative z-20" />
        <p className="text-purple-400 text-xl font-bold tracking-widest animate-pulse relative z-20 uppercase">Scanning Sectors...</p>
      </div>
    );
  }

  return (
    <div 
      onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
      className="relative min-h-screen w-full flex flex-col items-center p-4 md:p-8 overflow-hidden bg-[#050208]"
    >
      {/* 🌌 BACKGROUND LAYERS */}
      <div className="nebula-bg" />
      <div className="absolute inset-[-100%] animate-drift opacity-25 z-0 pointer-events-none">
        <div className="w-full h-full bg-[radial-gradient(circle,white_1.2px,transparent_1.2px)] bg-[length:100px_100px]" />
      </div>

      {/* 🔦 DYNAMIC MOUSE GLOW */}
      <div 
        className="pointer-events-none absolute inset-0 z-10 opacity-30 transition-opacity duration-500"
        style={{ background: `radial-gradient(600px at ${mousePos.x}px ${mousePos.y}px, rgba(168, 85, 247, 0.15), transparent 80%)` }}
      />

      {/* 🖥️ MAIN CONTENT AREA */}
      <div className="relative z-20 w-full max-w-5xl flex flex-col h-full animate-in fade-in duration-700">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/profile')}
              className="w-12 h-12 rounded-2xl premium-glass flex items-center justify-center border-purple-500/30 hover:border-purple-500/50 transition-all cursor-pointer hover:scale-105"
            >
              <User className="w-6 h-6 text-purple-400" />
            </button>
            <div>
              <p className="text-[9px] text-purple-500/60 font-black uppercase tracking-[0.3em]">Commander</p>
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase">{username}</h2>
            </div>
          </div>
          <button 
            onClick={() => {localStorage.clear(); navigate('/');}} 
            className="p-3 hover:bg-red-500/10 rounded-xl transition-all group"
          >
            <LogOut className="w-6 h-6 text-gray-500 group-hover:text-red-400 transition-colors" />
          </button>
        </header>

        {/* SEARCH BAR SECTION */}
        <div className="relative mb-10 group max-w-3xl w-full">
          <div className="absolute left-6 top-1/2 -translate-y-1/2 z-30 pointer-events-none">
            <Search className="w-4 h-4 text-white/20 group-focus-within:text-purple-400 transition-colors duration-300" />
          </div>

          <input 
            type="text" 
            placeholder="FILTER FREQUENCIES..." 
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-5 pl-14 pr-6 outline-none 
                       focus:border-purple-500/50 focus:bg-purple-500/[0.02] transition-all duration-300
                       text-[10px] tracking-[0.3em] text-white placeholder:text-white/10 uppercase font-bold"
          />
        </div>

        {/* Room Grid */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {rooms.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-20">
              <div className="premium-glass p-12 rounded-[40px] text-center max-w-md border-dashed border-purple-500/20">
                <MessageSquare className="w-10 h-10 text-purple-400/50 mx-auto mb-6" />
                <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">No Transmissions</h2>
                <button 
                  onClick={() => navigate('/join')}
                  className="mt-6 px-8 py-3 bg-purple-600/20 border border-purple-500/40 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-purple-600/40 transition-all"
                >
                  Initialize Channel
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-2 custom-scrollbar pb-24">
              {rooms.map((room) => (
                <div 
                  key={room.id}
                  onClick={() => navigate(`/chat/${room.roomId}`)}
                  className="premium-glass p-6 rounded-2xl flex items-center gap-5 cursor-pointer hover:border-purple-500/50 hover:bg-purple-500/5 transition-all group border-white/5"
                >
                  <div className="w-14 h-14 rounded-xl bg-black/40 flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform">
                    <Radio className="w-6 h-6 text-purple-500/50" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {/* ✅ UPDATED: Use formatRoomName and remove uppercase class */}
                    <h4 className="text-white font-black tracking-tighter text-lg truncate">
                      {formatRoomName(room.roomId)}
                    </h4>
                    <p className="text-white/30 text-[9px] font-bold uppercase tracking-widest">
                      Signal Active • {room.members?.length || 0} Units
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* 🎯 FIXED PLUS BUTTON */}
      <button 
        onClick={() => navigate('/join')}
        className="fixed bottom-10 right-10 w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl 
                   flex items-center justify-center shadow-[0_0_40px_rgba(147,51,234,0.6)] 
                   hover:scale-110 active:scale-95 transition-all z-50 
                   hover:shadow-[0_0_60px_rgba(147,51,234,0.8)]"
      >
        <Plus className="w-8 h-8 text-white" />
      </button>
    </div>
  );
};

export default ChatList;