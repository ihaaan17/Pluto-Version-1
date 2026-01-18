import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Client } from '@stomp/stompjs';
import { ChevronLeft, Send, Users, Paperclip, Check } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

const ChatRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [copied, setCopied] = useState(false);

  const messagesEndRef = useRef(null);
  const stompClientRef = useRef(null);
  const username = localStorage.getItem('username');

  /* ================= FETCH ROOM ================= */
  useEffect(() => {
    if (!username) {
      navigate('/');
      return;
    }

    axios
      .get(API_ENDPOINTS.GET_ROOM(roomId))
      .then((res) => {
        setRoom(res.data);
        setMessages(res.data.messages || []);
      })
      .catch(err => console.error("Error fetching room:", err))
      .finally(() => setLoading(false));
  }, [roomId, username, navigate]);

  /* ================= WEBSOCKET ================= */
  useEffect(() => {
    if (!username || !roomId) return;

    const client = new Client({
      brokerURL: API_ENDPOINTS.WS_URL,
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true);
        client.subscribe(`/topic/room/${roomId}`, (msg) => {
          const receivedMsg = JSON.parse(msg.body);
          setMessages((prev) => {
            // Prevent duplicate messages if the backend sends one immediately after HTTP post
            const isDuplicate = prev.some(m => m.timestamp === receivedMsg.timestamp && m.sender === receivedMsg.sender);
            return isDuplicate ? prev : [...prev, receivedMsg];
          });
        });
      },
      onDisconnect: () => setConnected(false),
    });

    client.activate();
    stompClientRef.current = client;

    return () => client.deactivate();
  }, [roomId, username]);

  /* ================= AUTOSCROLL ================= */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  /* ================= ACTIONS ================= */
  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !connected) return;

    stompClientRef.current.publish({
      destination: `/app/chat/${roomId}`,
      body: JSON.stringify({
        sender: username,
        content: newMessage.trim(),
        timestamp: new Date().toISOString(),
        type: 'TEXT'
      }),
    });

    setNewMessage('');
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('sender', username);

    try {
      setUploadLoading(true);
      // Ensure the endpoint matches your backend requirement
      await axios.post(API_ENDPOINTS.UPLOAD_PHOTO(roomId), formData);
    } catch (err) {
      console.error("Upload failed", err);
      alert("Failed to upload image.");
    } finally {
      setUploadLoading(false);
      e.target.value = '';
    }
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (loading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center text-purple-400 font-bold tracking-widest animate-pulse">
        CONNECTING TO SECTOR...
      </div>
    );
  }

  return (
    <div className="h-[100svh] w-full flex flex-col overflow-hidden bg-[#050208] relative">
      <div className="nebula-bg absolute inset-0 opacity-30 pointer-events-none" />

      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-30 w-full p-3 md:p-4 border-b border-white/10 bg-black/80 backdrop-blur-xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => navigate('/chats')} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <div className="min-w-0">
            <p className="text-white font-bold truncate text-sm md:text-base">{roomId}</p>
            <div className="flex items-center gap-2 text-[10px] md:text-xs text-purple-400">
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
              {connected ? 'Active' : 'Offline'}
              <span className="flex items-center gap-1 ml-2 text-white/40">
                <Users className="w-3 h-3" />
                {room?.members?.length || 0}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={copyRoomId}
          className="flex items-center gap-2 p-2 px-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all active:scale-95"
        >
          <span className="text-[10px] text-gray-400 hidden sm:block">Copy ID</span>
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Paperclip className="w-4 h-4 text-purple-400 rotate-45" />}
        </button>
      </header>

      {/* ================= MESSAGES ================= */}
      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4 z-10 custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.sender === username ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
              <div className={`max-w-[85%] md:max-w-[60%] px-4 py-3 rounded-2xl text-sm shadow-xl ${
                msg.sender === username ? 'bg-purple-600 text-white rounded-tr-none' : 'bg-white/10 text-white rounded-tl-none border border-white/5 backdrop-blur-md'
              }`}>
                {msg.sender !== username && (
                  <p className="text-[10px] text-purple-400 font-black uppercase mb-1">{msg.sender}</p>
                )}
                
                {/* Content Rendering */}
                {msg.content && <p className="break-words leading-relaxed">{msg.content}</p>}
                
                {/* FIXED: Photo Rendering Logic */}
                {msg.mediaUrl && (
                  <div className="mt-2 rounded-lg overflow-hidden border border-white/10">
                    <img 
                      src={msg.mediaUrl} 
                      alt="Shared attachment" 
                      className="w-full h-auto max-h-80 object-cover"
                      onClick={() => window.open(msg.mediaUrl, '_blank')}
                    />
                  </div>
                )}
                
                <p className="text-[9px] opacity-40 mt-1.5 text-right font-mono">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="relative z-30 p-4 bg-black/80 backdrop-blur-xl border-t border-white/10">
        <form onSubmit={sendMessage} className="max-w-4xl mx-auto flex items-center gap-2 md:gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Transmit message..."
              disabled={!connected}
              className="w-full bg-white/5 border border-white/10 rounded-full px-5 py-3 text-white outline-none focus:border-purple-500/50 transition-all placeholder:text-white/20"
              style={{ fontSize: '16px' }} // Prevents iOS zoom on focus
            />
          </div>

          <label className={`cursor-pointer p-3 rounded-full transition-all ${uploadLoading ? 'animate-pulse opacity-50' : 'hover:bg-white/10'}`}>
            <Paperclip className="w-5 h-5 text-purple-400" />
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={handlePhotoUpload}
              disabled={!connected || uploadLoading}
            />
          </label>

          <button
            type="submit"
            disabled={!newMessage.trim() || !connected}
            className="bg-purple-600 p-3 rounded-full disabled:opacity-30 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-purple-500/20"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </form>
      </footer>
    </div>
  );
};

export default ChatRoom;