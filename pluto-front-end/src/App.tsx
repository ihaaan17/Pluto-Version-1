import React from 'react';
import { Rocket } from 'lucide-react'; // Optional: npm install lucide-react

function App() {
  return (
    <div className="min-h-screen w-full bg-space-dark text-white flex flex-col items-center justify-center relative overflow-hidden font-sans">
      
      {/* Background Glow Effect */}
      <div className="absolute w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] -z-10" />
      
      {/* Star/Grid Overlay (Simplified version) */}
      <div className="absolute inset-0 opacity-20 -z-20" 
           style={{ backgroundImage: `radial-gradient(circle, #fff 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">
          Pluto Chat <span className="text-purple-400">✨</span>
        </h1>
        <p className="text-gray-400 mt-2 text-sm tracking-widest uppercase">Your gateway to the stars</p>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-[40px] p-10 shadow-2xl flex flex-col items-center">
        
        {/* Profile/Galaxy Icon */}
        <div className="w-24 h-24 rounded-full border-2 border-purple-500/30 p-1 mb-8 shadow-[0_0_20px_rgba(123,66,245,0.3)]">
          <img 
            src="https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&q=80&w=200" 
            alt="Galaxy" 
            className="w-full h-full rounded-full object-cover"
          />
        </div>

        {/* Input Field */}
        <div className="w-full space-y-2 mb-8">
          <label className="text-xs text-gray-400 ml-1">Username</label>
          <div className="relative group">
            <input 
              type="text" 
              placeholder="Enter your cosmic handle" 
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all text-sm"
            />
            <Rocket className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-500/60 group-focus-within:text-purple-400" />
          </div>
        </div>

        {/* Join Button */}
        <button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 py-4 rounded-2xl font-semibold shadow-[0_0_20px_rgba(123,66,245,0.4)] transition-all active:scale-[0.98]">
          Join Chat
        </button>

        {/* Guest Link */}
        <button className="mt-6 text-gray-500 hover:text-gray-300 text-xs transition-colors tracking-wide">
          Continue as guest
        </button>
      </div>

      {/* Footer Navigation (The dots) */}
      <div className="mt-auto pb-10 flex flex-col items-center gap-4">
        <p className="text-[10px] text-gray-500 tracking-[0.3em] uppercase">Chat across the universe</p>
        <div className="flex gap-2">
          <div className="w-6 h-1 bg-purple-600 rounded-full" />
          <div className="w-1.5 h-1 bg-gray-700 rounded-full" />
          <div className="w-1.5 h-1 bg-gray-700 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default App;