// src/main.jsx
import React, { StrictMode } from 'react'; // ← ADD StrictMode here!
import { createRoot } from 'react-dom/client';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import Approutes from './config/routes.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode> 
    <BrowserRouter>
      <Approutes />
    </BrowserRouter>
  </StrictMode>
);