import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Client } from '@stomp/stompjs';
import { ChevronLeft, Send, Users, Paperclip } from 'lucide-react';
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
          setMessages((prev) => [...prev, JSON.parse(msg.body)]);
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
    messagesEndRef.current?.scrollIntoView({ block: 'end' });
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
    } finally {
      setUploadLoading(false);
      e.target.value = '';
    }
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
  };

  if (loading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center text-purple-400">
        Loading…
      </div>
    );
  }

  return (
    <div className="h-[100svh] w-full flex flex-col overflow-hidden bg-[#050208]">

      {/* ================= HEADER (STICKY) ================= */}
      <header className="sticky top-0 z-30 w-full p-3 border-b border-white/10 bg-black/80 backdrop-blur-xl flex items-center gap-3">
        <button
          onClick={() => navigate('/chats')}
          className="p-2 hover:bg-white/10 rounded-full"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-white font-bold truncate">{roomId}</p>
          <div className="flex items-center gap-2 text-xs text-purple-400">
            <span
              className={`w-2 h-2 rounded-full ${
                connected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            Active
            <Users className="w-3 h-3 ml-2" />
            {room?.members?.length || 0}
          </div>
        </div>

        <button
          onClick={copyRoomId}
          className="p-2 bg-white/5 border border-white/10 rounded-xl"
        >
          <Paperclip className="w-4 h-4 text-purple-400 rotate-45" />
        </button>
      </header>

      {/* ================= MESSAGES ================= */}
      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${
              msg.sender === username ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                msg.sender === username
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/10 text-white'
              }`}
            >
              {msg.sender !== username && (
                <p className="text-[10px] text-purple-400 font-bold mb-1">
                  {msg.sender}
                </p>
              )}
              <p>{msg.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </main>

      {/* ================= FOOTER (NORMAL FLOW) ================= */}
      <footer className="relative z-30 p-4 bg-black/80 backdrop-blur-xl border-t border-white/10">
        <form onSubmit={sendMessage} className="flex items-center gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message…"
            disabled={!connected}
            className="flex-1 bg-white/5 border border-white/10 rounded-full px-5 py-3 text-white outline-none"
            style={{ fontSize: '16px' }}
          />

          <label className="cursor-pointer p-3 rounded-full hover:bg-white/10">
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
            className="bg-purple-600 p-3 rounded-full disabled:opacity-50"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </form>
      </footer>
    </div>
  );
};

export default ChatRoom;
