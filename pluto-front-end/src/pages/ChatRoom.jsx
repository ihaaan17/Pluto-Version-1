import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Client } from '@stomp/stompjs';
import { ChevronLeft, Send, Users, Paperclip } from 'lucide-react';
import API_BASE_URL, { API_ENDPOINTS } from '../config/api';

const ChatRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const stompClientRef = useRef(null);

  const username = localStorage.getItem('username');

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    alert('Room ID copied to clipboard!');
  };

  // Prevent zoom on mobile
  useEffect(() => {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }

    return () => {
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
      }
    };
  }, []);

  // Handle input focus/blur for mobile
  useEffect(() => {
    const handleInputFocus = (e) => {
      e.target.style.fontSize = '16px';
    };

    const handleInputBlur = () => {
      setTimeout(() => {
        window.scrollTo(0, 0);
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
      }, 300);
    };

    const inputs = document.querySelectorAll('input[type="text"]');
    inputs.forEach(input => {
      input.addEventListener('focus', handleInputFocus);
      input.addEventListener('blur', handleInputBlur);
    });

    return () => {
      inputs.forEach(input => {
        input.removeEventListener('focus', handleInputFocus);
        input.removeEventListener('blur', handleInputBlur);
      });
    };
  }, []);

  // 1. Fetch Room Data
  useEffect(() => {
    if (!username) {
      navigate('/');
      return;
    }

    const fetchRoomData = async () => {
      try {
        const response = await axios.get(API_ENDPOINTS.GET_ROOM(roomId));
        setRoom(response.data);
        setMessages(response.data.messages || []);
        setError('');
      } catch (err) {
        setError('Failed to load room. It may not exist.');
        console.error('Fetch room error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRoomData();
  }, [roomId, username, navigate]);

  // 2. WebSocket + STOMP connection
  useEffect(() => {
    if (!username || !roomId) return;

    const client = new Client({
      brokerURL: API_ENDPOINTS.WS_URL,
      debug: (str) => console.log('[STOMP DEBUG]', str),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      
      onConnect: (frame) => {
        setConnected(true);
        setError('');

        client.subscribe(`/topic/room/${roomId}`, (message) => {
          try {
            const received = JSON.parse(message.body);
            setMessages((prev) => {
              const exists = prev.some(m => 
                m.sender === received.sender && 
                m.content === received.content && 
                Math.abs(new Date(m.timestamp) - new Date(received.timestamp)) < 1000
              );
              if (exists) return prev;
              return [...prev, received];
            });
          } catch (err) {
            console.error('❌ Error parsing message:', err);
          }
        });
      },
      onStompError: (frame) => {
        setError('Connection to chat server lost');
        setConnected(false);
      },
      onWebSocketError: (error) => {
        setError('WebSocket connection failed');
        setConnected(false);
      },
      onDisconnect: () => setConnected(false),
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      if (client.connected) {
        client.deactivate();
      }
    };
  }, [roomId, username]);

  // 3. Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 4. Send Message
  const sendMessage = (e) => {
    e.preventDefault();
    document.activeElement?.blur(); // Dismiss keyboard
    
    const trimmedContent = newMessage.trim();
    if (!trimmedContent || !stompClientRef.current?.connected) return;

    try {
      const payload = {
        sender: username,
        content: trimmedContent,
        timestamp: new Date().toISOString(),
      };

      stompClientRef.current.publish({
        destination: `/app/chat/${roomId}`,
        body: JSON.stringify(payload),
      });

      setNewMessage('');
    } catch (err) {
      setError('Failed to send message');
    }
  };

  // 5. Photo Upload
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('sender', username);

    try {
      setUploadLoading(true);
      await axios.post(API_ENDPOINTS.UPLOAD_PHOTO(roomId), formData);
      alert('Photo uploaded!');
    } catch (err) {
      alert('Failed to upload photo.');
    } finally {
      setUploadLoading(false);
      e.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="nebula-bg" />
        <div className="text-center z-10">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-purple-400 text-xl font-bold tracking-widest animate-pulse uppercase">Entering Sector...</p>
        </div>
      </div>
    );
  }

  return (
    // Fixed: h-[100dvh] uses dynamic viewport height that adjusts to mobile browser bars
    <div className="h-[100dvh] w-full flex flex-col overflow-hidden relative bg-[#050208]">
      <div className="nebula-bg absolute inset-0 z-0 opacity-40" />
      <div className="stars-overlay absolute inset-0 z-0 opacity-20" />

      {/* HEADER: Fixed at the top, always visible */}
      <header className="fixed top-0 left-0 right-0 z-30 w-full py-3 px-3 md:p-6 border-b border-white/10 bg-black/90 backdrop-blur-xl flex justify-between items-center gap-2 flex-shrink-0">
        <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
          <button 
            onClick={() => navigate('/chats')} 
            className="p-2 hover:bg-white/10 rounded-full transition-colors flex-shrink-0"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-lg flex-shrink-0 shadow-lg shadow-purple-500/20">
              🛰️
            </div>
            <div className="min-w-0 flex flex-col">
              <h3 className="text-white font-bold text-sm md:text-base truncate leading-tight">
                {roomId}
              </h3>
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                <span className="text-[10px] text-purple-400 uppercase tracking-widest font-bold">
                  {connected ? 'Active' : 'Offline'}
                </span>
                {room && (
                  <div className="hidden xs:flex items-center gap-1 text-[10px] text-white/30 ml-1 border-l border-white/10 pl-2">
                    <Users className="w-2.5 h-2.5" />
                    {room.members?.length || 0}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <button 
          onClick={copyRoomId} 
          className="p-2 md:px-3 md:py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all flex-shrink-0 active:scale-95"
        >
          <Paperclip className="w-4 h-4 text-purple-400 rotate-45" />
        </button>
      </header>

      {/* CHAT AREA: Custom padding for desktop + top padding for fixed header */}
      <main className="flex-1 overflow-y-auto custom-scrollbar z-10 relative">
        <div className="max-w-4xl mx-auto px-4 md:px-6 space-y-4 pt-[68px] md:pt-[96px] pb-[70px] md:pb-[96px]">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-500 text-sm italic">
              No transmissions in this sector yet...
            </div>
          ) : (
            messages.map((msg, index) => (
              <div 
                key={`${msg.sender}-${index}`} 
                className={`flex ${msg.sender === username ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}
              >
                <div className={`max-w-[85%] md:max-w-[65%] p-3 md:p-4 rounded-2xl text-sm ${
                  msg.sender === username 
                    ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-tr-none shadow-lg shadow-purple-500/10' 
                    : 'bg-white/10 text-white rounded-tl-none border border-white/5 backdrop-blur-md'
                }`}>
                  {msg.sender !== username && (
                    <p className="text-[10px] font-black text-purple-400 uppercase mb-1 tracking-tighter">{msg.sender}</p>
                  )}
                  <p className="break-words leading-relaxed">{msg.content}</p>
                  {msg.mediaUrl && (
                    <img 
                      src={msg.mediaUrl} 
                      alt="shared" 
                      className="mt-2 rounded-lg max-h-60 w-full object-cover border border-white/10" 
                    />
                  )}
                  <p className="text-[9px] opacity-40 mt-1 text-right">
                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* FOOTER: Fixed at the bottom */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 py-2 px-4 md:p-4 bg-black/95 backdrop-blur-xl border-t border-white/10 flex-shrink-0">
        <form onSubmit={sendMessage} className="max-w-4xl mx-auto flex items-center gap-2 md:gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={connected ? `Message #${roomId}...` : "Connecting..."}
              disabled={!connected}
              style={{ fontSize: '16px' }}
              className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 px-5 md:px-8 outline-none focus:border-purple-500/50 text-white transition-all"
            />
          </div>
          
          <label className={`cursor-pointer p-2 md:p-3 rounded-full transition-colors flex-shrink-0 ${uploadLoading ? 'animate-pulse opacity-50' : 'hover:bg-white/10'}`}>
            <Paperclip className="w-5 h-5 text-purple-400" />
            <input 
              type="file" 
              accept="image/*" 
              onChange={handlePhotoUpload} 
              className="hidden" 
              disabled={!connected || uploadLoading}
            />
          </label>

          <button 
            type="submit" 
            disabled={!newMessage.trim() || !connected} 
            className="bg-purple-600 p-2.5 md:p-4 rounded-full hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-purple-500/20"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </form>
      </footer>
    </div>
  );
};

export default ChatRoom;