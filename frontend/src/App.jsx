import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import PrivateButton from './components/PrivateButton';
import PublicPage from './pages/PublicPage';
import PrivatePage from './pages/PrivatePage';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <Header />
        <PrivateButton />
        <Routes>
          <Route path="/" element={<PublicPage />} />
          <Route path="/private" element={<PrivatePage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
