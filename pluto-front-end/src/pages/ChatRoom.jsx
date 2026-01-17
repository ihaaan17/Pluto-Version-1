import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Client } from '@stomp/stompjs';
import { ChevronLeft, MoreVertical, Send, Users, Paperclip } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';


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

  const username = localStorage.getItem('username');
  const stompClientRef = useRef(null);
  const copyRoomId = () => {
  navigator.clipboard.writeText(roomId);
  // Optional: You could add a temporary 'Copied!' state here
  alert('Room ID copied to clipboard!'); 
};
  // Fetch initial room data and messages
  useEffect(() => {
    if (!username) {
      navigate('/');
      return;
    }

    const fetchRoomData = async () => {
      try {
        const response = await axios.get(API_ENDPOINTS.GET_ROOM(roomId));
        console.log('📦 Room data:', response.data);
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

  // WebSocket + STOMP connection
  useEffect(() => {
    if (!username || !roomId) return;

    console.log('🔌 Connecting to WebSocket for room:', roomId);

    const client = new Client({
      brokerURL: API_ENDPOINTS.WS_URL,
      debug: (str) => console.log('[STOMP DEBUG]', str),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      
      onConnect: (frame) => {
        console.log('✅ WebSocket Connected!', frame);
        setConnected(true);
        setError('');

        client.subscribe(`/topic/room/${roomId}`, (message) => {
          console.log('📩 Raw message received:', message);
          
          try {
            const received = JSON.parse(message.body);
            console.log('📩 Parsed message:', received);
            
            setMessages((prev) => {
              const exists = prev.some(m => 
                m.sender === received.sender && 
                m.content === received.content && 
                Math.abs(new Date(m.timestamp) - new Date(received.timestamp)) < 1000
              );
              
              if (exists) {
                console.log('⚠️ Duplicate message detected, skipping');
                return prev;
              }
              
              console.log('✅ Adding new message to state');
              return [...prev, received];
            });
          } catch (err) {
            console.error('❌ Error parsing message:', err);
          }
        });

        console.log('✅ Subscribed to /topic/room/' + roomId);
      },

      onStompError: (frame) => {
        console.error('❌ STOMP error:', frame);
        setError('Connection to chat server lost');
        setConnected(false);
      },

      onWebSocketError: (error) => {
        console.error('❌ WebSocket error:', error);
        setError('WebSocket connection failed');
        setConnected(false);
      },

      onDisconnect: () => {
        console.log('🔌 Disconnected from WebSocket');
        setConnected(false);
      },
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      console.log('🧹 Cleaning up WebSocket connection');
      if (client.connected) {
        client.deactivate();
      }
    };
  }, [roomId, username]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send text message
  const sendMessage = (e) => {
    e.preventDefault();
    const trimmedContent = newMessage.trim();
    if (!trimmedContent) return;

    if (!stompClientRef.current?.connected) {
      setError('Not connected to chat server. Please refresh.');
      return;
    }

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
      console.error('Send error:', err);
      setError('Failed to send message');
    }
  };

  // Photo upload handler
  // ... inside ChatRoom component ...

// Photo upload handler (defined as async function)
const handlePhotoUpload = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    alert('Please select an image file');
    return;
  }

  if (file.size > 10 * 1024 * 1024) { // 10MB limit
    alert('File too large (max 10MB)');
    return;
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('sender', username);

  try {
    setUploadLoading(true);
    const response = await axios.post(API_ENDPOINTS.UPLOAD_PHOTO(roomId), formData);
    
    console.log('Photo uploaded successfully:', response.data);
    alert('Photo uploaded! It will appear in chat shortly.');
  } catch (err) {
    console.error('Photo upload error:', err);
    if (err.response?.status === 413) {
      alert('File too large! Try a smaller image (max 10MB).');
    } else if (err.response?.status === 404) {
      alert('Room not found or upload endpoint error. Check room ID.');
    } else {
      alert('Failed to upload photo. Please try again.');
    }
  } finally {
    setUploadLoading(false);
    e.target.value = ''; // Reset input for next upload
  }
};

// Fetch effect (no need for async here, since fetchRoomData is async)
useEffect(() => {
  if (!username) {
    navigate('/');
    return;
  }

  const fetchRoomData = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.GET_ROOM(roomId));
      console.log('📦 Room data:', response.data);
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

// ... rest of your code (WebSocket, sendMessage, etc.) ...

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="nebula-bg" />
        <div className="text-center z-10">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-purple-400 text-xl font-bold tracking-widest animate-pulse">
            ENTERING SECTOR...
          </p>
        </div>
      </div>
    );
  }

  if (error && !room) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <div className="nebula-bg" />
        <div className="z-10 text-center">
          <p className="text-red-400 text-2xl mb-4">{error}</p>
          <button 
            onClick={() => navigate('/chats')} 
            className="btn-gradient px-8 py-3 rounded-full hover:scale-105 transition-transform"
          >
            Back to Transmissions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden relative">
      <div className="nebula-bg absolute inset-0 z-0" />
      <div className="stars-overlay absolute inset-0 z-0" />

      <header className="relative z-10 p-4 md:p-6 border-b border-white/10 bg-black/30 backdrop-blur-md flex justify-between items-center">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <button 
            onClick={() => navigate('/chats')} 
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-xl flex-shrink-0">
              🛰️
            </div>
            <div className="min-w-0">
              <h3 className="text-white font-bold truncate text-sm">{roomId}</h3>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                <p className="text-[10px] text-purple-400 uppercase tracking-wider">
                  {connected ? 'Connected' : 'Disconnected'}
                </p>
                {room && (
                  <div className="flex items-center gap-1 text-[10px] text-gray-400">
                    <Users className="w-3 h-3" />
                    {room.members?.length || 0}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Replace the MoreVertical button with this */}
<div className="flex items-center gap-2">
  <button 
    onClick={copyRoomId}
    className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all group"
    title="Copy Room ID"
  >
    <span className="text-[10px] text-gray-400 font-mono uppercase tracking-tighter hidden sm:block">
      ID: {roomId}
    </span>
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="16" 
      height="16" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className="text-purple-400 group-hover:text-purple-300"
    >
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
    </svg>
  </button>
</div>
      </header>

      {error && room && (
        <div className="relative z-10 bg-red-500/10 border-b border-red-500/30 px-4 py-2">
          <p className="text-red-400 text-xs text-center">{error}</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar z-10">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <p className="text-sm mb-2">No messages yet</p>
              <p className="text-xs">Start the conversation! 🚀</p>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={`${msg.sender}-${msg.timestamp}-${index}`}
              className={`flex ${msg.sender === username ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div
                className={`max-w-[70%] p-4 rounded-2xl text-sm shadow-lg ${
                  msg.sender === username
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-tr-none'
                    : 'bg-white/10 text-white rounded-tl-none border border-white/10 backdrop-blur-sm'
                }`}
              >
                {msg.sender !== username && (
                  <div className="font-bold text-xs mb-1 text-purple-300">
                    {msg.sender}
                  </div>
                )}
                <p className="break-words">{msg.content}</p>

                {/* Photo display */}
                {msg.mediaUrl && msg.type === 'IMAGE' && (
                  <img
                    src={msg.mediaUrl}
                    alt={`Shared by ${msg.sender}`}
                    className="max-w-full rounded-lg mt-2 object-contain"
                    loading="lazy"
                    onError={(e) => console.error('Image failed to load:', msg.mediaUrl)}
                  />
                )}

                <div className="text-[10px] opacity-60 mt-2 text-right">
                  {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  }) : 'Just now'}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <footer className="relative z-10 p-4 md:p-6 bg-black/40 backdrop-blur-md border-t border-white/10">
        <form onSubmit={sendMessage} className="flex items-center gap-3 max-w-4xl mx-auto">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={connected ? `Message #${roomId}...` : 'Connecting...'}
            disabled={!connected}
            className="flex-1 bg-white/5 border border-white/10 rounded-full py-3 px-6 outline-none focus:border-purple-500/50 text-white placeholder-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />

          {/* Photo Upload Button */}
          <label 
            htmlFor="photo-upload" 
            className={`cursor-pointer p-3 rounded-full transition-colors ${!connected || uploadLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'}`}
          >
            <Paperclip className="w-5 h-5 text-purple-400" />
          </label>
          <input
            id="photo-upload"
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            disabled={!connected || uploadLoading}
            className="hidden"
          />

          <button
            type="submit"
            disabled={!newMessage.trim() || !connected}
            className="btn-gradient p-4 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 active:scale-95 transition-transform"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </form>
      </footer>
    </div>
  );
};

export default ChatRoom;