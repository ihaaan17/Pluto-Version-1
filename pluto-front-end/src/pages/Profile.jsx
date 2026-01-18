import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  ChevronLeft, Mail, Calendar, Hash, Lock, 
  Trash2, X, Edit2, CheckCircle, Terminal, Rocket 
} from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

const Profile = () => {
  const navigate = useNavigate();
  const username = localStorage.getItem('username');

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeleting, setIsDeletingAccount] = useState(false);

  const [editForm, setEditForm] = useState({ username: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [deletePassword, setDeletePassword] = useState('');

  // --- SCROLL ANIMATION LOGIC ---
  const { scrollYProgress } = useScroll();
  
  // Rocket rises as you scroll (from 150px offset to 0px)
  const rocketY = useTransform(scrollYProgress, [0.3, 1], [150, -20]);
  // Smooth fade in for the whole section
  const footerOpacity = useTransform(scrollYProgress, [0.4, 0.7], [0, 1]);
  // Scale effect for the radar
  const radarScale = useTransform(scrollYProgress, [0.5, 1], [0.8, 1.2]);

  useEffect(() => {
    if (!username) { navigate('/'); return; }
    const fetchProfile = async () => {
      try {
        const response = await axios.get(API_ENDPOINTS.PROFILE(username));
        setProfile(response.data);
        setEditForm({ username: response.data.username, email: response.data.email });
      } catch (err) {
        setError('UPLINK ERROR: PROFILE DATA UNREACHABLE');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [username, navigate]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      const response = await axios.put(API_ENDPOINTS.UPDATE_PROFILE(username), editForm);
      setProfile(response.data);
      localStorage.setItem('username', response.data.username);
      setSuccess('BIOMETRICS UPDATED SUCCESSFULLY');
      setIsEditingProfile(false);
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'UPDATE FAILED');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('ENCRYPTION MISMATCH');
      return;
    }
    try {
      await axios.put(API_ENDPOINTS.CHANGE_PASSWORD(username), {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setSuccess('SECURITY KEY CHANGED');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setIsChangingPassword(false);
    } catch (err) {
      setError(err.response?.data?.error || 'SECURITY UPDATE FAILED');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await axios.delete(API_ENDPOINTS.DELETE_ACCOUNT(username), { data: { password: deletePassword } });
      localStorage.clear();
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'DELETE FAILED');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050208] flex flex-col items-center justify-center relative">
        <div className="nebula-bg" />
        <Terminal className="w-12 h-12 text-purple-500 animate-pulse mb-4 z-20" />
        <p className="text-purple-400 text-sm font-black tracking-[0.5em] animate-pulse z-20 uppercase">Syncing Profile...</p>
      </div>
    );
  }

  return (
    <div 
      onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
      className="relative min-h-screen w-full flex flex-col p-4 md:p-8 overflow-x-hidden bg-[#050208]"
    >
      <div className="nebula-bg absolute inset-0 z-0 pointer-events-none" />
      
      {/* MOUSE GLOW EFFECT */}
      <div 
        className="pointer-events-none fixed inset-0 z-10 opacity-30 transition-opacity duration-500"
        style={{ background: `radial-gradient(600px at ${mousePos.x}px ${mousePos.y}px, rgba(168, 85, 247, 0.15), transparent 80%)` }}
      />

      {/* HEADER */}
      <header className="relative z-20 flex items-center gap-6 mb-12 max-w-5xl mx-auto w-full">
        <button onClick={() => navigate('/chats')} className="w-12 h-12 premium-glass flex items-center justify-center rounded-2xl border-white/10 hover:border-purple-500/50 hover:scale-105 transition-all group">
          <ChevronLeft className="w-6 h-6 text-white group-hover:text-purple-400" />
        </button>
        <div>
          <p className="text-[9px] text-purple-500/60 font-black uppercase tracking-[0.4em]">Subspace Identity</p>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Commander Profile</h1>
        </div>
      </header>

      <main className="relative z-20 max-w-5xl mx-auto w-full space-y-6">
        
        {/* PRIMARY PROFILE CARD */}
        <section className="premium-glass p-8 md:p-10 rounded-[2.5rem] border-white/5">
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="relative">
              <div className="w-32 h-32 rounded-[2rem] bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-5xl font-black text-white shadow-[0_0_50px_rgba(147,51,234,0.3)]">
                {profile.username[0].toUpperCase()}
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#050208] border border-white/10 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-purple-400" />
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">{profile.username}</h2>
              <p className="text-purple-400/80 font-bold text-xs tracking-widest uppercase flex items-center justify-center md:justify-start gap-2">
                <Mail className="w-3 h-3" /> {profile.email}
              </p>
            </div>
          </div>
        </section>

        {/* GRID LAYOUT FOR SECTIONS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* IDENTITY UPDATE */}
          <section className="premium-glass p-8 rounded-[2rem] border-white/5">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-purple-500" /> Identity
                </h3>
                {!isEditingProfile && (
                  <button onClick={() => setIsEditingProfile(true)} className="text-purple-400 p-2 hover:bg-white/5 rounded-lg transition-all">
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
             </div>
             {isEditingProfile ? (
               <form onSubmit={handleUpdateProfile} className="space-y-4">
                 <input type="text" value={editForm.username} onChange={(e) => setEditForm({...editForm, username: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-purple-500/50 transition-all" />
                 <div className="flex gap-2">
                   <button type="submit" className="flex-1 bg-purple-600 text-white font-black py-3 rounded-xl text-[10px] uppercase">Update</button>
                   <button type="button" onClick={() => setIsEditingProfile(false)} className="px-4 bg-white/5 text-white rounded-xl text-[10px] uppercase">Cancel</button>
                 </div>
               </form>
             ) : (
               <div className="space-y-3">
                 <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-[10px] text-gray-500 font-black uppercase">Callsign</span>
                    <span className="text-sm text-white font-bold">{profile.username}</span>
                 </div>
               </div>
             )}
          </section>

          {/* SECURITY */}
          <section className="premium-glass p-8 rounded-[2rem] border-white/5">
            <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 mb-6">
              <Lock className="w-4 h-4 text-purple-500" /> Security
            </h3>
            {!isChangingPassword ? (
              <button onClick={() => setIsChangingPassword(true)} className="w-full py-3 bg-purple-600/10 border border-purple-500/20 text-purple-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-600/20 transition-all">
                Change Security Key
              </button>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-3">
                <input type="password" placeholder="NEW KEY" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none" required />
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 bg-purple-600 text-white font-black py-2 rounded-xl text-[10px]">SAVE</button>
                  <button type="button" onClick={() => setIsChangingPassword(false)} className="px-4 bg-white/5 text-white rounded-xl"><X className="w-4 h-4" /></button>
                </div>
              </form>
            )}
          </section>
        </div>

        {/* ⚠️ DANGER ZONE */}
        <section className="premium-glass p-8 rounded-[2rem] border-red-500/10">
            <h3 className="text-xs font-black text-red-500 uppercase tracking-widest flex items-center gap-2 mb-4">
              <Trash2 className="w-4 h-4" /> Critical: Decommission Account
            </h3>
            {!isDeleting ? (
              <button onClick={() => setIsDeletingAccount(true)} className="px-6 py-3 bg-red-600/10 border border-red-500/20 text-red-500 rounded-full text-[10px] font-black uppercase hover:bg-red-600/20 transition-all">
                Terminate Identity
              </button>
            ) : (
              <div className="flex gap-3">
                <input type="password" placeholder="PASSWORD" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} className="flex-1 bg-black/40 border border-red-500/20 rounded-xl px-4 text-white text-sm outline-none" />
                <button onClick={handleDeleteAccount} className="bg-red-600 text-white font-black px-6 py-3 rounded-xl text-[10px] uppercase">Confirm</button>
                <button onClick={() => setIsDeletingAccount(false)} className="bg-white/5 text-white px-4 rounded-xl font-black text-[10px] uppercase">Abort</button>
              </div>
            )}
        </section>

        {/* 🌠 DEEP SPACE ANIMATION SECTION */}
        <motion.section 
          style={{ opacity: footerOpacity }}
          className="relative h-[500px] w-full flex flex-col items-center justify-center overflow-hidden pointer-events-none"
        >
          {/* Radar Circles */}
          <motion.div 
            style={{ scale: radarScale }}
            className="absolute flex items-center justify-center"
          >
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="w-[400px] h-[400px] rounded-full border border-purple-500/10 border-dashed"
            />
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="absolute w-[300px] h-[300px] rounded-full border border-indigo-500/5 border-dotted"
            />
          </motion.div>

          {/* Floating Asset */}
          <motion.div 
            style={{ y: rocketY }}
            className="relative z-30 flex flex-col items-center"
          >
            <motion.div
              animate={{ 
                y: [0, -15, 0],
                rotate: [-47, -43, -47] 
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="w-20 h-20 text-purple-500 filter drop-shadow-[0_0_20px_rgba(168,85,247,0.4)] mb-8"
            >
              <Rocket className="w-full h-full" />
            </motion.div>
            
            <div className="text-center">
              <span className="block text-purple-400 font-black text-[11px] tracking-[0.7em] uppercase mb-4">
                Deep Space Navigation Active
              </span>
              <div className="flex gap-3 justify-center">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-ping" />
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-ping [animation-delay:0.3s]" />
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-ping [animation-delay:0.6s]" />
              </div>
            </div>
          </motion.div>
        </motion.section>

        {/* BOTTOM SPACER TO ENABLE SCROLLING */}
        <div className="h-32 w-full pointer-events-none" />

      </main>

      {/* SYSTEM TOASTS */}
      {(success || error) && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5">
           <div className={`px-8 py-4 rounded-2xl border font-black uppercase text-[10px] flex items-center gap-4 shadow-2xl ${
             success ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-red-500/10 border-red-500/50 text-red-400'
           }`}>
             {success ? <CheckCircle className="w-4 h-4" /> : <Terminal className="w-4 h-4" />}
             {success || error}
             <button onClick={() => {setSuccess(''); setError('');}} className="opacity-50 hover:opacity-100"><X className="w-3 h-3" /></button>
           </div>
        </div>
      )}
    </div>
  );
};

export default Profile;