// src/config/routes.jsx
import { Routes, Route } from 'react-router-dom';

import Login from '../pages/Login';
import ChatList from '../pages/ChatList';
import ChatRoom from '../pages/ChatRoom';
import JoinRoom from '../pages/JoinRoom';
import Profile from '../pages/Profile';
import ProtectedRoute from '../pages/ProtectedRoute';

export default function Approutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Login />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/chats" element={<ChatList />} />
        <Route path="/join" element={<JoinRoom />} />
        <Route path="/chat/:roomId" element={<ChatRoom />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* 404 Page */}
      <Route path="*" element={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="nebula-bg" />
          <div className="text-center z-10">
            <h1 className="text-6xl font-bold text-purple-500 mb-4">404</h1>
            <p className="text-xl text-gray-400 mb-8">Cosmic signal lost</p>
            <a 
              href="/" 
              className="btn-gradient px-8 py-3 rounded-full inline-block hover:scale-105 transition-transform"
            >
              Return to Base
            </a>
          </div>
        </div>
      } />
    </Routes>
  );
}