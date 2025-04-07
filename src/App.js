import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Components
import Header from './components/Header';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import TablesPage from './pages/TablesPage';
import TableDetailPage from './pages/TableDetailPage';
import OrdersPage from './pages/OrdersPage';
import ProductsPage from './pages/ProductsPage';
import InvoicesPage from './pages/InvoicesPage';
import PaymentsPage from './pages/PaymentsPage';
import ProfilePage from './pages/ProfilePage';

function PrivateRoute({ children }) {
  const isAuthenticated = localStorage.getItem('token');
  
  console.log('PrivateRoute - Token kontrolü:', isAuthenticated ? 'Token var' : 'Token yok');
  
  if (!isAuthenticated) {
    console.log('Kimlik doğrulama başarısız, giriş sayfasına yönlendiriliyor...');
    return <Navigate to="/login" />;
  }
  
  return children;
}

function App() {
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  
  useEffect(() => {
    // Uygulama başlatıldığında token kontrolü
    const token = localStorage.getItem('token');
    console.log('App başlatılıyor - Token kontrolü:', token ? 'Token var' : 'Token yok');
    setIsAuthChecked(true);
  }, []);
  
  if (!isAuthChecked) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <Router>
      <div className="App">
        <Header />
        <Container className="py-3">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            <Route path="/" element={
              <PrivateRoute>
                <HomePage />
              </PrivateRoute>
            } />
            
            <Route path="/tables" element={
              <PrivateRoute>
                <TablesPage />
              </PrivateRoute>
            } />
            
            <Route path="/tables/:id" element={
              <PrivateRoute>
                <TableDetailPage />
              </PrivateRoute>
            } />

            <Route path="/orders" element={
              <PrivateRoute>
                <OrdersPage />
              </PrivateRoute>
            } />
            
            <Route path="/products" element={
              <PrivateRoute>
                <ProductsPage />
              </PrivateRoute>
            } />
            
            <Route path="/invoices" element={
              <PrivateRoute>
                <InvoicesPage />
              </PrivateRoute>
            } />
            
            <Route path="/payments" element={
              <PrivateRoute>
                <PaymentsPage />
              </PrivateRoute>
            } />
            
            <Route path="/profile" element={
              <PrivateRoute>
                <ProfilePage />
              </PrivateRoute>
            } />
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Container>
      </div>
    </Router>
  );
}

export default App;
