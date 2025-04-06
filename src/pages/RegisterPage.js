import React, { useState } from 'react';
import { Form, Button, Container, Card, Alert, Row, Col } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'employee', // Varsayılan rol
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form doğrulama
    if (!formData.name || !formData.email || !formData.password) {
      setError('Lütfen tüm zorunlu alanları doldurun');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Şifreler eşleşmiyor');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Şirket kaydı yapıyoruz çünkü API mimarisinde önce şirket sonra kullanıcı kaydı var
      const companyData = {
        name: `${formData.name}'in Şirketi`, // Örnek şirket ismi
        email: formData.email,
        password: formData.password,
      };
      
      const companyResponse = await authService.registerCompany(companyData);
      
      // Şirket kayıt işlemi başarılı ise, token alıp kullanıcı olarak giriş yapıyoruz
      if (companyResponse.data && companyResponse.data.token) {
        localStorage.setItem('token', companyResponse.data.token);
        localStorage.setItem('userInfo', JSON.stringify(companyResponse.data.company));
        
        navigate('/');
      }
    } catch (error) {
      setError(
        error.response?.data?.message || 
        'Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: "80vh" }}>
      <Card className="p-4 shadow" style={{ width: '500px' }}>
        <Card.Body>
          <h2 className="text-center mb-4">Kayıt Ol</h2>
          
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>İsim Soyisim</Form.Label>
              <Form.Control 
                type="text"
                name="name"
                placeholder="İsim Soyisim" 
                value={formData.name}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>E-posta</Form.Label>
              <Form.Control 
                type="email"
                name="email" 
                placeholder="E-posta adresinizi girin" 
                value={formData.email}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Row>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label>Şifre</Form.Label>
                  <Form.Control 
                    type="password"
                    name="password" 
                    placeholder="Şifrenizi girin" 
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label>Şifre Tekrar</Form.Label>
                  <Form.Control 
                    type="password"
                    name="confirmPassword" 
                    placeholder="Şifrenizi tekrar girin" 
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Rol</Form.Label>
              <Form.Select 
                name="role"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="admin">Yönetici</option>
                <option value="manager">Müdür</option>
                <option value="employee">Çalışan</option>
              </Form.Select>
            </Form.Group>

            <Button 
              variant="primary" 
              type="submit" 
              className="w-100 mt-3" 
              disabled={loading}
            >
              {loading ? 'Kayıt Yapılıyor...' : 'Kayıt Ol'}
            </Button>
            
            <div className="text-center mt-3">
              Zaten hesabınız var mı? <Link to="/login">Giriş Yap</Link>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default RegisterPage; 