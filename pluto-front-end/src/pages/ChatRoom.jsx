import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Client } from '@stomp/stompjs';
import { ChevronLeft, Send, Users, Paperclip, Copy } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

const HEADER_HEIGHT = 72;

const ChatRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [footerHeight, setFooterHeight] = useState(0);

  const footerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const stompRef = useRef(null);

  const username = localStorage.getItem('username');

  /* ================= VISUAL VIEWPORT FIX ================= */
  useEffect(() => {
    const setHeight = () => {
      const h = window.visualViewport
        ? window.visualViewport.height
        : window.innerHeight;

      document.documentElement.style.setProperty('--app-height', `${h}px`);
    };

    setHeight();
    window.visualViewport?.addEventListener('resize', setHeight);
    window.addEventListener('resize', setHeight);

    return () => {
      window.visualViewport?.removeEventListener('resize', setHeight);
      window.removeEventListener('resize', setHeight);
    };
  }, []);

  /* ================= FOOTER HEIGHT (SAFE AREA AWARE) ================= */
  useEffect(() => {
    if (!footerRef.current) return;

    const update = () => {
      const safeArea =
        parseFloat(
          getComputedStyle(document.documentElement)
            .getPropertyValue('env(safe-area-inset-bottom)')
        ) || 0;

      setFooterHeight(footerRef.current.offsetHeight + safeArea);
    };

    update();
    window.visualViewport?.addEventListener('resize', update);
    window.addEventListener('resize', update);

    return () => {
      window.visualViewport?.removeEventListener('resize', update);
      window.removeEventListener('resize', update);
    };
  }, []);

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
    if (!roomId || !username) return;

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
    stompRef.current = client;

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

    stompRef.current.publish({
      destination: `/app/chat/${roomId}`,
      body: JSON.stringify({
        sender: username,
        content: newMessage.trim(),
        timestamp: new Date().toISOString(),
      }),
    });

    setNewMessage('');
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
  };

  if (loading) {
    return (
      <div
        className="flex items-center justify-center bg-black text-purple-400"
        style={{ height: 'var(--app-height)' }}
      >
        Loading…
      </div>
    );
  }

  return (
    <div
      className="relative bg-[#050208] overflow-hidden"
      style={{ height: 'var(--app-height)' }}
    >
      {/* ================= HEADER ================= */}
      <header className="fixed top-0 left-0 right-0 z-30 h-[72px] px-4 flex items-center gap-3 bg-black/90 backdrop-blur-xl border-b border-white/10">
        <button onClick={() => navigate('/chats')}>
          <ChevronLeft className="text-white" />
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
          className="p-2 rounded-lg hover:bg-white/10"
        >
          <Copy className="w-4 h-4 text-purple-400" />
        </button>
      </header>

      {/* ================= MESSAGES ================= */}
      <main
        className="overflow-y-auto px-4 space-y-4"
        style={{
          paddingTop: HEADER_HEIGHT,
          paddingBottom: footerHeight,
          height: '100%',
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${
              m.sender === username ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                m.sender === username
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/10 text-white'
              }`}
            >
              {m.sender !== username && (
                <p className="text-[10px] text-purple-400 font-bold mb-1">
                  {m.sender}
                </p>
              )}
              <p>{m.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </main>

      {/* ================= FOOTER ================= */}
      <footer
        ref={footerRef}
        className="fixed bottom-0 left-0 right-0 z-30 bg-black/95 backdrop-blur-xl border-t border-white/10 px-4 pt-3"
        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)',
        }}
      >
        <form onSubmit={sendMessage} className="flex items-center gap-3">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message…"
            className="flex-1 rounded-full px-5 py-2 bg-white/5 border border-white/10 text-white outline-none"
            style={{ fontSize: '16px' }}
          />

          <label className="cursor-pointer">
            <Paperclip className="text-purple-400" />
            <input type="file" hidden />
          </label>

          <button type="submit" className="bg-purple-600 p-3 rounded-full">
            <Send className="text-white w-4 h-4" />
          </button>
        </form>
      </footer>
    </div>
  );
};

export default ChatRoom;
