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
    // Robust copy for mobile
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(roomId).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = roomId;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Fallback copy failed', err);
      }
      document.body.removeChild(textArea);
    }
  };

  if (loading) return (
    <div className="h-screen bg-black flex items-center justify-center text-purple-500 font-bold">
      INITIALIZING...
    </div>
  );

  return (
    <div className="fixed inset-0 flex flex-col bg-[#050208] overflow-hidden">
      <div className="nebula-bg absolute inset-0 opacity-30 pointer-events-none z-0" />

      {/* FIXED HEADER: Now using fixed positioning to prevent it from being pushed up */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-white/10 bg-black/90 backdrop-blur-xl flex items-center justify-between px-4">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => navigate('/chats')} className="p-2 -ml-2 text-white">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="min-w-0">
            <p className="text-white font-bold truncate text-sm">{roomId}</p>
            <div className="flex items-center gap-2 text-[10px]">
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
              <span className="text-purple-400 uppercase font-bold tracking-tighter">
                {connected ? 'Connected' : 'Reconnecting...'}
              </span>
              <span className="flex items-center gap-1 text-white/30 ml-2">
                <Users className="w-3 h-3" />
                {room?.members?.length || 0}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={copyRoomId}
          className="p-2 px-3 bg-white/5 border border-white/10 rounded-xl flex items-center gap-2"
        >
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Paperclip className="w-4 h-4 text-purple-400" />}
        </button>
      </header>

      {/* MESSAGES: Added pt-20 to make room for fixed header */}
      <main className="flex-1 overflow-y-auto pt-20 pb-4 px-4 z-10 custom-scrollbar">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.sender === username ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm ${
                msg.sender === username 
                ? 'bg-purple-600 text-white rounded-tr-none shadow-lg' 
                : 'bg-white/10 text-white rounded-tl-none border border-white/5 backdrop-blur-md'
              }`}>
                {msg.sender !== username && <p className="text-[10px] text-purple-400 font-bold mb-1">{msg.sender}</p>}
                
                {msg.content && <p className="break-words leading-relaxed">{msg.content}</p>}
                
                {msg.mediaUrl && (
                  <div className="mt-2 rounded-lg overflow-hidden">
                    <img src={msg.mediaUrl} alt="Shared" className="w-full h-auto max-h-72 object-cover" />
                  </div>
                )}
                
                <p className="text-[9px] opacity-40 mt-1.5 text-right">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* FOOTER */}
      <footer className="relative z-40 p-4 bg-black/90 backdrop-blur-xl border-t border-white/10 flex-shrink-0">
        <form onSubmit={sendMessage} className="max-w-3xl mx-auto flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Transmit..."
            disabled={!connected}
            className="flex-1 bg-white/5 border border-white/10 rounded-full px-5 py-3 text-white outline-none focus:border-purple-500 text-sm"
            style={{ fontSize: '16px' }}
          />
          <label className="p-3 text-purple-400 cursor-pointer">
            <Paperclip className="w-5 h-5" />
            <input type="file" accept="image/*" hidden onChange={handlePhotoUpload} />
          </label>
          <button
            type="submit"
            disabled={!newMessage.trim() || !connected}
            className="bg-purple-600 p-3 rounded-full shadow-lg"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </form>
      </footer>
    </div>
  );
};

export default ChatRoom;