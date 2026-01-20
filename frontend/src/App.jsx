import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import PublicPage from './pages/PublicPage';
import PrivatePage from './pages/PrivatePage';
import AdminPage from './pages/AdminPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Admin route without header */}
        <Route path="/admin" element={<AdminPage />} />

        {/* Regular routes with header */}
        <Route
          path="/*"
          element={
            <div className="min-h-screen">
              <Header />
              <Routes>
                <Route path="/" element={<PublicPage />} />
                <Route path="/private" element={<PrivatePage />} />
              </Routes>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
