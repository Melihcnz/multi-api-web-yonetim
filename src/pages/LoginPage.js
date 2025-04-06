import React, { useState } from 'react';
import { Form, Button, Container, Card, Alert, Tabs, Tab } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState('company'); // 'user' veya 'company'
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Lütfen tüm alanları doldurun');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      console.log('Giriş denemesi:', { email, loginType });
      
      // localStorage temizleyelim
      window.localStorage.removeItem('token');
      window.localStorage.removeItem('userInfo');
      
      if (loginType === 'user') {
        try {
          // Kullanıcı girişi
          const response = await authService.login(email, password);
          
          console.log('API yanıtı (user):', response.data);
          
          if (response.data && response.data.token) {
            // Token ve kullanıcı bilgilerini kaydedelim
            window.localStorage.setItem('token', response.data.token);
            window.localStorage.setItem('userInfo', JSON.stringify(response.data.user || {}));
            
            // localStorage'a kaydedildiğinden emin olalım
            const savedToken = window.localStorage.getItem('token');
            console.log('Kaydedilen token (user):', savedToken);
            
            // Sayfayı yönlendirelim
            navigate('/tables');
          } else {
            throw new Error('Sunucudan geçerli bir token alınamadı');
          }
        } catch (userError) {
          console.error('Kullanıcı girişi hatası:', userError);
          throw userError; // Ana catch bloğuna yönlendir
        }
      } else {
        // Şirket girişi
        const response = await authService.companyLogin(email, password);
        
        console.log('API yanıtı (company):', response.data);
        console.log('Şirket token kontrolü:', response.data?.company?.token);
        
        // Şirket yanıtında token doğrudan company nesnesi içinde
        if (response.data && response.data.company && response.data.company.token) {
          const token = response.data.company.token;
          
          // Token ve şirket bilgilerini kaydedelim
          window.localStorage.setItem('token', token);
          window.localStorage.setItem('userInfo', JSON.stringify(response.data.company || {}));
          
          // localStorage'a kaydedildiğinden emin olalım
          const savedToken = window.localStorage.getItem('token');
          console.log('Kaydedilen token (company):', savedToken);
          
          // Sayfayı yönlendirelim - küçük bir gecikme ekleyelim
          setTimeout(() => {
            navigate('/tables');
          }, 200);
        } else {
          throw new Error('Sunucudan geçerli bir token alınamadı');
        }
      }
    } catch (error) {
      console.error('Giriş hatası:', error);
      setError(
        error.response?.data?.message || error.message || 
        'Giriş sırasında bir hata oluştu. Lütfen e-posta ve şifrenizi kontrol edin.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: "80vh" }}>
      <Card className="p-4 shadow" style={{ width: '400px' }}>
        <Card.Body>
          <h2 className="text-center mb-4">Giriş</h2>
          
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Tabs 
            activeKey={loginType}
            onSelect={(k) => setLoginType(k)}
            className="mb-3"
          >
            <Tab eventKey="user" title="Kullanıcı Girişi">
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>E-posta</Form.Label>
                  <Form.Control 
                    type="email" 
                    placeholder="E-posta adresinizi girin" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Şifre</Form.Label>
                  <Form.Control 
                    type="password" 
                    placeholder="Şifrenizi girin" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </Form.Group>

                <Button 
                  variant="primary" 
                  type="submit" 
                  className="w-100 mt-3" 
                  disabled={loading}
                >
                  {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                </Button>
              </Form>
            </Tab>
            <Tab eventKey="company" title="Şirket Girişi">
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>E-posta</Form.Label>
                  <Form.Control 
                    type="email" 
                    placeholder="Şirket e-postanızı girin" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Şifre</Form.Label>
                  <Form.Control 
                    type="password" 
                    placeholder="Şirket şifrenizi girin" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </Form.Group>

                <Button 
                  variant="success" 
                  type="submit" 
                  className="w-100 mt-3" 
                  disabled={loading}
                >
                  {loading ? 'Giriş Yapılıyor...' : 'Şirket Girişi Yap'}
                </Button>
              </Form>
            </Tab>
          </Tabs>
          
          <div className="text-center mt-3">
            Hesabınız yok mu? <Link to="/register">Kayıt Ol</Link>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default LoginPage; 