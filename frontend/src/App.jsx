import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import PublicPage from './pages/PublicPage';
import PrivatePage from './pages/PrivatePage';
import AdminPage from './pages/AdminPage';
import AdminActivityPage from './pages/AdminActivityPage';
import WrappedPage from './pages/WrappedPage';
import PrivateWrappedPage from './pages/PrivateWrappedPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Routes without header */}
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/activity" element={<AdminActivityPage />} />
        <Route path="/wrapped" element={<WrappedPage />} />
        <Route path="/wrapped-intern" element={<PrivateWrappedPage />} />

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
