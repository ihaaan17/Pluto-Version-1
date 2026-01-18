import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, Sparkles, Terminal, Lock, User, Mail, Fingerprint } from 'lucide-react';
import axios from 'axios';
import API_BASE_URL, { API_ENDPOINTS } from '../config/api';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [statusIndex, setStatusIndex] = useState(0);
  const navigate = useNavigate();
  const containerRef = useRef(null);

  // The text still changes to reflect the mode, but the colors will stay purple
  const systemStatuses = isLogin 
    ? ["Establishing subspace link...", "Encrypting frequency...", "Awaiting identity signature..."]
    : ["Scanning star-charts...", "Allocating neural storage...", "Syncing galaxy-wide ID..."];

  useEffect(() => {
    const timer = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % systemStatuses.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [isLogin, systemStatuses.length]);

  // Handle input blur to reset zoom on mobile
  useEffect(() => {
    const handleInputBlur = () => {
      // Small delay to ensure keyboard is hidden
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = 0;
          window.scrollTo(0, 0);
        }
      }, 100);
    };

    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
      input.addEventListener('blur', handleInputBlur);
    });

    return () => {
      inputs.forEach(input => {
        input.removeEventListener('blur', handleInputBlur);
      });
    };
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed || !password || (!isLogin && !email)) {
      setError('Required data streams missing.');
      return;
    }
    
    // Blur all inputs to dismiss keyboard
    document.activeElement?.blur();
    
    setLoading(true);
    setError('');

    const url = isLogin ? API_ENDPOINTS.LOGIN : API_ENDPOINTS.REGISTER;

    try {
      const payload = isLogin ? { username: trimmed, password } : { username: trimmed, email, password };
      const response = await axios.post(url, payload);
      
      if (isLogin) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('username', response.data.username);
        localStorage.setItem('userId', response.data.userId);
        navigate('/chats');
      } else {
        setIsLogin(true);
        setError('Success! Profile forged. Please login.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Uplink failed. Retry?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
      className="fixed inset-0 w-full h-[100dvh] flex flex-col items-center justify-center p-4 overflow-hidden bg-[#050208] cursor-default touch-none"
    >
      {/* BACKGROUND EFFECTS - Always Purple */}
      <div 
        className="pointer-events-none absolute inset-0 z-10 opacity-30 transition-all duration-1000"
        style={{ 
          background: `radial-gradient(600px at ${mousePos.x}px ${mousePos.y}px, rgba(168, 85, 247, 0.15), transparent 80%)` 
        }}
      />
      <div className="absolute inset-[-100%] animate-drift opacity-10 z-0 pointer-events-none">
        <div className="w-full h-full bg-[radial-gradient(white_1px,transparent_1px)] bg-[length:100px_100px]" />
      </div>

      <div className="relative z-20 flex flex-col items-center w-full max-w-[400px] animate-in fade-in zoom-in duration-700">
        
        {/* Header - Always Purple Star */}
        <div className="text-center mb-6">
          <div className="flex justify-center items-center gap-2 mb-1">
            <h1 className="text-5xl font-black tracking-tighter text-white select-none">PLUTO</h1>
            <Sparkles 
              className="w-6 h-6 animate-pulse text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" 
            />
          </div>
          <div className="flex items-center justify-center gap-2 text-white/40 font-mono text-[8px] tracking-[0.3em] uppercase">
            <Terminal className="w-3 h-3" />
            <span>{systemStatuses[statusIndex]}</span>
          </div>
        </div>

        {/* Card Form */}
        <div className="w-full glass-card rounded-[40px] p-8 flex flex-col items-center border border-white/10 shadow-2xl backdrop-blur-3xl bg-white/5">
          
          <form className="w-full space-y-4" onSubmit={handleAuth}>
            
            {/* Username */}
            <div className="space-y-1">
              <label className="text-[9px] text-gray-500 uppercase tracking-widest font-black ml-1 select-none">Identity Signature</label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Enter handle..." 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  className="w-full bg-black/40 border border-white/5 rounded-xl py-3.5 px-11 outline-none focus:border-purple-500/40 text-sm text-white transition-all duration-300"
                />
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
              </div>
            </div>

            {/* Email - ONLY SHOWN DURING SIGN UP */}
            {!isLogin && (
              <div className="space-y-1 animate-in slide-in-from-top-2 duration-300">
                <label className="text-[9px] text-gray-500 uppercase tracking-widest font-black ml-1 select-none">Comms Link</label>
                <div className="relative">
                  <input 
                    type="email" 
                    placeholder="star@sector.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className="w-full bg-black/40 border border-white/5 rounded-xl py-3.5 px-11 outline-none focus:border-purple-500/40 text-sm text-white transition-all"
                  />
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Password */}
            <div className="space-y-1">
              <label className="text-[9px] text-gray-500 uppercase tracking-widest font-black ml-1 select-none">Access Key</label>
              <div className="relative">
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  className="w-full bg-black/40 border border-white/5 rounded-xl py-3.5 px-11 outline-none focus:border-purple-500/40 text-sm text-white transition-all duration-300"
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                <Rocket className={`absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-all duration-500 pointer-events-none ${password ? 'text-purple-500' : 'opacity-0'}`} />
              </div>
            </div>

            {error && (
              <p className={`text-[9px] text-center font-bold uppercase tracking-tight py-2 rounded-lg border ${error.includes('Success') ? 'text-green-400 bg-green-500/10 border-green-500/10' : 'text-red-400 bg-red-500/10 border-red-500/10'}`}>
                {error}
              </p>
            )}

            <button 
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-xl font-black text-[10px] tracking-[0.3em] transition-all relative overflow-hidden group
                ${loading 
                  ? 'bg-purple-900/40 text-purple-300/50 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-purple-600/20 to-indigo-600/20 text-purple-100 border border-purple-500/30 hover:border-purple-400/60 hover:from-purple-600/40 hover:to-indigo-600/40 active:scale-95'
                }`}
            >
              <span className="relative z-10 uppercase">
                {loading ? 'Transmitting...' : (isLogin ? 'Initiate Uplink' : 'Forge Identity')}
              </span>
            </button>
          </form>

          {/* THE TOGGLE BUTTON */}
          <button 
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="mt-6 flex items-center gap-2 text-gray-600 hover:text-white text-[8px] uppercase tracking-widest font-black transition-all group"
          >
            <Fingerprint className="w-3 h-3 group-hover:text-purple-400 transition-colors" />
            {isLogin ? "Need a cosmic handle? Sign Up" : "Already registered? Login"}
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 flex flex-col items-center gap-3 opacity-50">
          <p className="text-[8px] text-gray-700 tracking-[0.4em] uppercase font-bold select-none">©ishandesale-2026</p>
        </div>
      </div>
    </div>
  );
};

export default Login;