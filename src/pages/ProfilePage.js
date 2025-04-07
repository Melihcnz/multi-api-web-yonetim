import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    // Kullanıcı bilgilerini localStorage'dan al
    const loadUserInfo = () => {
      try {
        const userInfoString = localStorage.getItem('userInfo');
        if (!userInfoString) {
          setError('Kullanıcı bilgisi bulunamadı');
          navigate('/login');
          return;
        }

        const userInfo = JSON.parse(userInfoString);
        setUser(userInfo);
        setFormData({
          name: userInfo.name || '',
          email: userInfo.email || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } catch (error) {
        console.error('Kullanıcı bilgisi yüklenirken hata:', error);
        setError('Kullanıcı bilgisi yüklenemedi');
      } finally {
        setLoading(false);
      }
    };

    loadUserInfo();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setUpdating(true);

    // Şifre değişikliği yapılıyorsa kontrol et
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setError('Yeni şifreler eşleşmiyor');
      setUpdating(false);
      return;
    }

    try {
      // API'ye gönderilecek veriyi hazırla
      const updateData = {
        name: formData.name
      };

      // Şifre değişikliği yapılıyorsa
      if (formData.currentPassword && formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      // API çağrısı yap
      console.log('Profil güncelleme isteği:', updateData);
      const response = await authService.updateProfile(updateData);
      
      // API yanıtını işle
      console.log('Profil güncelleme yanıtı:', response.data);
      
      // Kullanıcı bilgilerini güncelle
      const updatedUser = {
        ...user,
        name: formData.name
      };
      
      // LocalStorage'ı güncelle
      localStorage.setItem('userInfo', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      // Şifre alanlarını temizle
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      
      setSuccess('Profil bilgileriniz başarıyla güncellendi');
    } catch (error) {
      console.error('Profil güncelleme hatası:', error);
      
      let errorMessage = 'Profil güncellenirken bir hata oluştu';
      
      if (error.response) {
        // Sunucudan hata yanıtı
        console.error('Hata yanıtı:', error.response.data);
        errorMessage = error.response.data.message || errorMessage;
      } else if (error.request) {
        // İstek gönderildi ama yanıt alınamadı
        console.error('İstek hatası:', error.request);
        errorMessage = 'Sunucuya ulaşılamadı, lütfen internet bağlantınızı kontrol edin';
      } else {
        // İstek oluşturulurken hata oluştu
        console.error('İstek hatası:', error.message);
        errorMessage = error.message || errorMessage;
      }
      
      setError(errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Yükleniyor...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container>
      <Row className="justify-content-md-center my-4">
        <Col md={8}>
          <Card className="shadow-sm">
            <Card.Header as="h2" className="text-center">Profil Bilgileri</Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}
              
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Ad Soyad</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Ad Soyad"
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>E-posta</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="E-posta"
                    disabled // E-posta değiştirilemez
                  />
                </Form.Group>
                
                <hr className="my-4" />
                <h4>Şifre Değiştir</h4>
                <p className="text-muted">Şifrenizi değiştirmek istemiyorsanız, bu alanları boş bırakın.</p>
                
                <Form.Group className="mb-3">
                  <Form.Label>Mevcut Şifre</Form.Label>
                  <Form.Control
                    type="password"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    placeholder="Mevcut şifreniz"
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Yeni Şifre</Form.Label>
                  <Form.Control
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    placeholder="Yeni şifreniz"
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Yeni Şifre (Tekrar)</Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Yeni şifrenizi tekrar girin"
                  />
                </Form.Group>
                
                <div className="d-grid mt-4">
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={updating}
                  >
                    {updating ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                        <span className="ms-2">Güncelleniyor...</span>
                      </>
                    ) : 'Profili Güncelle'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ProfilePage; 