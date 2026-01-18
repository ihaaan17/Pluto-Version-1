import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Client } from '@stomp/stompjs';
import { ChevronLeft, Send, Users, Paperclip, Check, Info } from 'lucide-react';
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
    <div className="fixed inset-0 bg-black flex items-center justify-center">
       <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="fixed inset-0 flex flex-col bg-black overflow-hidden font-sans">
      <div className="nebula-bg absolute inset-0 opacity-20 pointer-events-none z-0" />

      {/* ================= REFINED INSTA-HEADER ================= */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-white/5 bg-black/80 backdrop-blur-2xl flex items-center justify-between px-2 md:px-6">
        <div className="flex items-center gap-1 md:gap-3 min-w-0">
          <button onClick={() => navigate('/chats')} className="p-2 text-white hover:bg-white/10 rounded-full transition-all">
            <ChevronLeft className="w-7 h-7" />
          </button>
          
          <div className="flex items-center gap-3 min-w-0 cursor-pointer" onClick={copyRoomId}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 via-pink-500 to-orange-400 p-[2px]">
                <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-lg">
                    🛰️
                </div>
            </div>
            <div className="min-w-0 flex flex-col">
              <h3 className="text-white font-semibold text-[15px] md:text-lg truncate leading-tight flex items-center gap-2">
                {roomId}
                {copied && <span className="text-[10px] text-green-400 font-normal">Copied!</span>}
              </h3>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-[11px] text-gray-400 font-medium">
                  {connected ? 'Active now' : 'Connecting...'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
            <button onClick={copyRoomId} className="p-2 text-white/80 hover:text-white">
                <Info className="w-6 h-6" />
            </button>
        </div>
      </header>

      {/* ================= INSTAGRAM-STYLE MESSAGES ================= */}
      <main className="flex-1 overflow-y-auto pt-20 pb-6 px-4 z-10 custom-scrollbar">
        <div className="max-w-2xl mx-auto flex flex-col">
          {messages.map((msg, i) => {
            const isMe = msg.sender === username;
            return (
              <div 
                key={i} 
                className={`flex w-full mb-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                {!isMe && (
                   <div className="w-7 h-7 rounded-full bg-white/10 flex-shrink-0 self-end mr-2 text-[10px] flex items-center justify-center text-white font-bold border border-white/5">
                      {msg.sender.charAt(0).toUpperCase()}
                   </div>
                )}
                
                <div className={`relative group max-w-[75%] md:max-w-[65%] px-4 py-2.5 shadow-sm transition-all ${
                  isMe 
                  ? 'bg-gradient-to-tr from-purple-600 to-blue-500 text-white rounded-[22px] rounded-br-[4px]' 
                  : 'bg-[#262626] text-white rounded-[22px] rounded-bl-[4px]'
                }`}>
                  {!isMe && (
                    <p className="text-[10px] text-white/50 font-semibold mb-0.5 ml-0.5">
                      {msg.sender}
                    </p>
                  )}
                  
                  <p className="text-[14px] md:text-[15px] leading-snug break-words">
                    {msg.content}
                  </p>

                  {msg.mediaUrl && (
                    <div className="mt-2 -mx-1 mb-1 rounded-xl overflow-hidden border border-white/10">
                      <img src={msg.mediaUrl} alt="Shared" className="w-full h-auto max-h-80 object-cover hover:opacity-90 transition-opacity" />
                    </div>
                  )}

                  {/* Timestamp visible on hover or tiny text */}
                  <div className={`text-[9px] mt-1 opacity-0 group-hover:opacity-60 transition-opacity text-right ${isMe ? 'text-white' : 'text-gray-400'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* ================= REFINED FOOTER ================= */}
      <footer className="relative z-40 p-3 md:p-5 bg-black border-t border-white/5 flex-shrink-0">
        <div className="max-w-2xl mx-auto flex items-center bg-[#121212] border border-white/10 rounded-full px-4 py-1.5 gap-2 focus-within:border-white/30 transition-all">
          
          <label className="p-2 text-white cursor-pointer hover:scale-110 active:scale-95 transition-transform">
            <Paperclip className="w-5 h-5" />
            <input type="file" accept="image/*" hidden onChange={handlePhotoUpload} />
          </label>

          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Message..."
            disabled={!connected}
            className="flex-1 bg-transparent py-2 text-white outline-none text-[15px] placeholder:text-gray-500"
            style={{ fontSize: '16px' }}
          />

          {newMessage.trim() ? (
            <button
              onClick={sendMessage}
              className="px-3 py-2 text-blue-500 font-bold text-[15px] hover:text-blue-400 transition-colors active:scale-95"
            >
              Send
            </button>
          ) : (
             <div className="w-10" /> // Spacer for layout balance
          )}
        </div>
      </footer>
    </div>
  );
};

export default ChatRoom;