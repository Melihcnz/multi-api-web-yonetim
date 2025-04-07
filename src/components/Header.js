import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Container, Dropdown } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  // Sayfa değiştiğinde token kontrolü
  useEffect(() => {
    checkAuth();
  }, [location.pathname]);

  const checkAuth = () => {
    try {
      // Token kontrolü
      const token = window.localStorage.getItem('token');
      const storedUserInfo = window.localStorage.getItem('userInfo');
      
      console.log('Header - Token kontrolü:', token ? 'Token var' : 'Token yok');
      
      setIsLoggedIn(!!token);
      if (storedUserInfo) {
        try {
          const parsedUserInfo = JSON.parse(storedUserInfo);
          setUserInfo(parsedUserInfo);
          console.log('Kullanıcı bilgisi yüklendi:', parsedUserInfo.name || parsedUserInfo.email);
        } catch (error) {
          console.error('Kullanıcı bilgisi çözümlenemedi:', error);
        }
      }
    } catch (error) {
      console.error('Token kontrolü sırasında hata:', error);
    }
  };

  const handleLogout = () => {
    try {
      console.log('Çıkış yapılıyor...');
      window.localStorage.removeItem('token');
      window.localStorage.removeItem('userInfo');
      setIsLoggedIn(false);
      setUserInfo(null);
      navigate('/login');
    } catch (error) {
      console.error('Çıkış sırasında hata:', error);
      window.location.href = '/login'; // Alternatif yönlendirme
    }
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
      <Container>
        <Navbar.Brand as={Link} to="/">İşletme Yönetim Sistemi</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {isLoggedIn && (
              <>
                <Nav.Link as={Link} to="/tables">Masalar</Nav.Link>
                <Nav.Link as={Link} to="/orders">Siparişler</Nav.Link>
                <Nav.Link as={Link} to="/products">Ürünler</Nav.Link>
                <Nav.Link as={Link} to="/invoices">Faturalar</Nav.Link>
                <Nav.Link as={Link} to="/payments">Ödemeler</Nav.Link>
              </>
            )}
          </Nav>
          
          <Nav>
            {isLoggedIn ? (
              <Dropdown align="end">
                <Dropdown.Toggle variant="outline-light" id="dropdown-user" className="d-flex align-items-center">
                  <i className="bi bi-person-circle me-2"></i>
                  <span>{userInfo?.name || userInfo?.email || 'Firma Adı'}</span>
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item as={Link} to="/profile">
                    <i className="bi bi-person me-2"></i> Profil
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right me-2"></i> Çıkış Yap
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            ) : (
              <>
                <Nav.Link as={Link} to="/login">Giriş</Nav.Link>
                <Nav.Link as={Link} to="/register">Kayıt Ol</Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header; 