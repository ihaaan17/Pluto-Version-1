import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Client } from '@stomp/stompjs';
import { ChevronLeft, Send, Users, Paperclip, Check, Copy } from 'lucide-react';
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

  useEffect(() => {
    if (!username) { navigate('/'); return; }
    axios.get(API_ENDPOINTS.GET_ROOM(roomId))
      .then((res) => {
        setRoom(res.data);
        setMessages(res.data.messages || []);
      })
      .finally(() => setLoading(false));
  }, [roomId, username, navigate]);

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
            const isDup = prev.some(m => m.timestamp === receivedMsg.timestamp && m.sender === receivedMsg.sender);
            return isDup ? prev : [...prev, receivedMsg];
          });
        });
      },
      onDisconnect: () => setConnected(false),
    });
    client.activate();
    stompClientRef.current = client;
    return () => client.deactivate();
  }, [roomId, username]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
      await axios.post(API_ENDPOINTS.UPLOAD_PHOTO(roomId), formData);
    } catch (err) {
      alert("Upload failed");
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

  if (loading) return (
    <div className="fixed inset-0 bg-[#0a0510] flex items-center justify-center">
       <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="fixed inset-0 flex flex-col bg-[#0a0510] overflow-hidden font-sans">
      {/* BACKGROUND ELEMENTS */}
      <div className="nebula-bg absolute inset-0 opacity-40 pointer-events-none z-0 scale-110" />
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 via-transparent to-black pointer-events-none z-0" />

      {/* ================= HEADER ================= */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-white/10 bg-black/60 backdrop-blur-2xl flex items-center justify-between px-2 md:px-6 shadow-2xl">
        <div className="flex items-center gap-1 md:gap-3 min-w-0">
          <button onClick={() => navigate('/chats')} className="p-2 text-white hover:bg-white/10 rounded-full transition-all">
            <ChevronLeft className="w-7 h-7" />
          </button>
          
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 p-[2px] shadow-lg shadow-purple-500/20">
                <div className="w-full h-full rounded-full bg-[#1a1a1a] flex items-center justify-center text-lg">
                    🛰️
                </div>
            </div>
            <div className="min-w-0 flex flex-col">
              <h3 className="text-white font-bold text-[15px] md:text-lg truncate leading-tight">
                {roomId}
              </h3>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'} shadow-[0_0_8px_rgba(34,197,94,0.6)]`} />
                <span className="text-[11px] text-purple-300/80 font-medium tracking-wide">
                  {connected ? 'Active now' : 'Connecting...'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={copyRoomId} 
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all active:scale-90 ${
            copied ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
          }`}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span className="text-xs font-bold hidden sm:block">{copied ? 'Copied' : 'Copy ID'}</span>
        </button>
      </header>

      {/* ================= MESSAGES ================= */}
      <main className="flex-1 overflow-y-auto pt-20 pb-6 px-4 z-10 custom-scrollbar">
        <div className="max-w-2xl mx-auto flex flex-col">
          {messages.map((msg, i) => {
            const isMe = msg.sender === username;
            return (
              <div 
                key={i} 
                className={`flex w-full mb-2 ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                {!isMe && (
                   <div className="w-8 h-8 rounded-full bg-purple-900/30 flex-shrink-0 self-end mr-2 text-[11px] flex items-center justify-center text-purple-300 font-bold border border-purple-500/20 shadow-inner">
                      {msg.sender.charAt(0).toUpperCase()}
                   </div>
                )}
                
                <div className={`relative group max-w-[80%] md:max-w-[70%] px-4 py-2.5 shadow-lg ${
                  isMe 
                  ? 'bg-gradient-to-br from-purple-600 to-indigo-700 text-white rounded-[20px] rounded-br-[4px] shadow-purple-900/20' 
                  : 'bg-[#1f1a29]/90 backdrop-blur-md text-white rounded-[20px] rounded-bl-[4px] border border-white/5'
                }`}>
                  {!isMe && (
                    <p className="text-[10px] text-purple-400 font-bold mb-0.5 tracking-tight">
                      {msg.sender}
                    </p>
                  )}
                  
                  <p className="text-[14px] md:text-[15px] leading-relaxed break-words">
                    {msg.content}
                  </p>

                  {msg.mediaUrl && (
                    <div className="mt-2 -mx-1 mb-1 rounded-xl overflow-hidden border border-white/10 shadow-inner">
                      <img src={msg.mediaUrl} alt="Shared" className="w-full h-auto max-h-80 object-cover" />
                    </div>
                  )}

                  <div className={`text-[9px] mt-1 opacity-40 font-mono text-right ${isMe ? 'text-white' : 'text-gray-400'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="relative z-40 p-4 bg-black/40 backdrop-blur-xl border-t border-white/10 flex-shrink-0">
        <div className="max-w-2xl mx-auto flex items-center bg-[#1a1625] border border-white/10 rounded-2xl px-3 py-1.5 gap-2 transition-all shadow-xl">
          
          <label className="p-2 text-purple-400 cursor-pointer hover:bg-white/5 rounded-full transition-colors">
            <Paperclip className="w-5 h-5" />
            <input type="file" accept="image/*" hidden onChange={handlePhotoUpload} />
          </label>

          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Message..."
            disabled={!connected}
            // TO REMOVE PURPLE SQUARE: Added focus:ring-0, focus:border-transparent, and ring-offset-0
            className="flex-1 bg-transparent py-2 text-white outline-none focus:outline-none focus:ring-0 focus:ring-offset-0 focus:border-transparent text-[15px] placeholder:text-gray-500 border-none ring-0"
            style={{ fontSize: '16px', boxShadow: 'none' }}
          />

          {(newMessage.trim() || uploadLoading) && (
            <button
              onClick={sendMessage}
              className="p-2 mr-1 text-purple-400 hover:text-purple-300 transition-all active:scale-90 animate-in zoom-in duration-300 fade-in"
            >
              {uploadLoading ? (
                <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-6 h-6 rotate-[0deg] fill-purple-600/20" /> 
              )}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
};

export default ChatRoom;