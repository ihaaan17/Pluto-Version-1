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

  // Prevent zoom and handle dynamic viewport height
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

  // Handle input focus/blur for mobile and scroll to bottom
  useEffect(() => {
    const handleInputFocus = () => {
      // Small delay to allow keyboard to pop up before scrolling
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    };

    const input = document.querySelector('input[type="text"]');
    if (input) {
      input.addEventListener('focus', handleInputFocus);
    }

    return () => {
      if (input) {
        input.removeEventListener('focus', handleInputFocus);
      }
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
        setError('Failed to load room.');
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
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true);
        client.subscribe(`/topic/room/${roomId}`, (message) => {
          const received = JSON.parse(message.body);
          setMessages((prev) => {
            const exists = prev.some(m => 
              m.sender === received.sender && 
              m.content === received.content && 
              Math.abs(new Date(m.timestamp) - new Date(received.timestamp)) < 1000
            );
            return exists ? prev : [...prev, received];
          });
        });
      },
      onDisconnect: () => setConnected(false),
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      if (client.connected) client.deactivate();
    };
  }, [roomId, username]);

  // 3. Auto-scroll with specific behavior
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  // 4. Send Message
  const sendMessage = (e) => {
    e.preventDefault();
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

    const formData = new FormData();
    formData.append('file', file);
    formData.append('sender', username);

    try {
      setUploadLoading(true);
      await axios.post(API_ENDPOINTS.UPLOAD_PHOTO(roomId), formData);
    } catch (err) {
      alert('Upload failed.');
    } finally {
      setUploadLoading(false);
      e.target.value = '';
    }
  };

  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-purple-500">Loading...</div>;

  return (
    <div className="h-[100dvh] w-full flex flex-col overflow-hidden relative bg-[#050208]">
      <div className="nebula-bg absolute inset-0 z-0 opacity-40" />

      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-30 w-full py-3 px-3 border-b border-white/10 bg-black/90 backdrop-blur-xl flex justify-between items-center">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/chats')} className="p-2 hover:bg-white/10 rounded-full">
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <div>
            <h3 className="text-white font-bold text-sm truncate">{roomId}</h3>
            <span className="text-[10px] text-purple-400 uppercase font-bold">
              {connected ? 'Active' : 'Offline'}
            </span>
          </div>
        </div>
        <button onClick={copyRoomId} className="p-2 bg-white/5 border border-white/10 rounded-xl">
          <Paperclip className="w-4 h-4 text-purple-400 rotate-45" />
        </button>
      </header>

      {/* CHAT AREA */}
      <main className="flex-1 overflow-y-auto custom-scrollbar z-10 relative">
        {/* Increased bottom padding (pb-24) to create space above input bar */}
        <div className="max-w-4xl mx-auto px-4 space-y-4 pt-20 pb-24">
          {messages.map((msg, index) => (
            <div 
              key={`${msg.sender}-${index}`} 
              className={`flex ${msg.sender === username ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                msg.sender === username 
                  ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-tr-none' 
                  : 'bg-white/10 text-white rounded-tl-none border border-white/5'
              }`}>
                {msg.sender !== username && (
                  <p className="text-[10px] font-black text-purple-400 uppercase mb-1">{msg.sender}</p>
                )}
                <p className="break-words">{msg.content}</p>
                {msg.mediaUrl && <img src={msg.mediaUrl} alt="shared" className="mt-2 rounded-lg" />}
                <p className="text-[9px] opacity-40 mt-1 text-right">
                  {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                </p>
              </div>
            </div>
          ))}
          {/* Invisible spacer to ensure auto-scroll has room to move */}
          <div className="h-2" ref={messagesEndRef} />
        </div>
      </main>

      {/* FOOTER */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 py-3 px-4 bg-black/95 backdrop-blur-xl border-t border-white/10">
        <form onSubmit={sendMessage} className="max-w-4xl mx-auto flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Message #${roomId}...`}
            disabled={!connected}
            className="flex-1 bg-white/5 border border-white/10 rounded-full py-2.5 px-5 outline-none focus:border-purple-500/50 text-white text-[16px]"
          />
          
          <label className="cursor-pointer p-2 rounded-full hover:bg-white/10">
            <Paperclip className="w-5 h-5 text-purple-400" />
            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={!connected || uploadLoading} />
          </label>

          <button 
            type="submit" 
            disabled={!newMessage.trim() || !connected} 
            className="bg-purple-600 p-3 rounded-full active:scale-95 transition-all disabled:opacity-50"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </form>
      </footer>
    </div>
  );
};

export default ChatRoom;