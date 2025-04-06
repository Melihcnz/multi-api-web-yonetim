import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Badge, Button, Modal, Form, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { tableService } from '../services/api';

const TablesPage = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalError, setModalError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newTable, setNewTable] = useState({
    name: '',
    capacity: 4,
    status: 'available'
  });
  const navigate = useNavigate();

  // useCallback ile fetchTables fonksiyonunu sarmalayarak
  // useEffect içinde güvenle kullanabiliyoruz
  const fetchTables = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Masalar getiriliyor...');
      
      // Token kontrolü
      const token = window.localStorage.getItem('token');
      if (!token) {
        console.error('Token bulunamadı');
        setError('Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
        navigate('/login');
        return;
      }
      
      const response = await tableService.getAllTables();
      
      if (response.data) {
        console.log('Masalar başarıyla getirildi:', response.data);
        
        // Veri kontrolü - yanıt array değilse boş array kullan
        const tablesData = Array.isArray(response.data) ? response.data 
                         : response.data.tables ? response.data.tables 
                         : [];
                         
        console.log('İşlenmiş masa verileri:', tablesData);
        setTables(tablesData);
        setError('');
      } else {
        throw new Error('Veri alınamadı');
      }
    } catch (error) {
      console.error('Masaları getirme hatası:', error);
      if (error.response?.status === 401) {
        setError('Oturum süreniz doldu. Lütfen tekrar giriş yapın.');
        // Kimlik doğrulama hatası - token geçersiz olabilir
        window.localStorage.removeItem('token');
        window.localStorage.removeItem('userInfo');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError('Masaları yüklerken bir hata oluştu: ' + (error.message || 'Bilinmeyen hata'));
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    // Sayfa yüklendiğinde masaları getir
    fetchTables();
  }, [fetchTables]); // fetchTables dependency olarak eklenmeli

  const handleCreateTable = async (e) => {
    e.preventDefault();
    if (!newTable.name) {
      setModalError('Masa adı zorunludur');
      return;
    }
    
    try {
      setModalError('');
      console.log('Masa oluşturuluyor:', newTable);
      
      // Masa adını ve diğer bilgileri içeren masa verisini oluştur
      const tableData = {
        tableNumber: newTable.name, // tableNumber kullanarak isimlendirme
        name: newTable.name,        // name alanını da ekleyelim
        capacity: newTable.capacity,
        status: newTable.status
      };
      
      const response = await tableService.createTable(tableData);
      console.log('Masa oluşturma yanıtı:', response);
      
      // Modal'ı kapat ve formu sıfırla
      setShowModal(false);
      setNewTable({
        name: '',
        capacity: 4,
        status: 'available'
      });
      
      // Masaları yeniden yükle
      fetchTables();
    } catch (error) {
      console.error('Masa oluştururken hata:', error);
      setModalError('Masa oluştururken bir hata oluştu: ' + (error.response?.data?.message || error.message || 'Bilinmeyen hata'));
    }
  };

  const handleTableClick = (tableId) => {
    navigate(`/tables/${tableId}`);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'available':
        return <Badge bg="success">Müsait</Badge>;
      case 'occupied':
        return <Badge bg="danger">Dolu</Badge>;
      case 'reserved':
        return <Badge bg="warning">Rezerve</Badge>;
      default:
        return <Badge bg="secondary">Bilinmiyor</Badge>;
    }
  };

  // Durum değerini Türkçeye çeviren yardımcı fonksiyon
  const getStatusName = (status) => {
    switch (status) {
      case 'available':
        return 'Müsait';
      case 'occupied':
        return 'Dolu';
      case 'reserved':
        return 'Rezerve';
      default:
        return 'Bilinmiyor';
    }
  };
  
  const handleRetry = () => {
    fetchTables();
  };

  const openCreateModal = () => {
    setModalError('');
    setShowModal(true);
  };

  // Masa durumunu değiştiren fonksiyon
  const updateTableStatus = async (tableId, newStatus) => {
    try {
      await tableService.updateTableStatus(tableId, newStatus);
      fetchTables(); // Masaları yeniden yükle
    } catch (error) {
      console.error('Masa durumu güncellenirken hata:', error);
      setError('Masa durumu güncellenirken bir hata oluştu');
    }
  };

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Masalar</h2>
        <Button variant="primary" onClick={openCreateModal}>
          Yeni Masa Ekle
        </Button>
      </div>

      {error && (
        <Alert variant="danger" className="d-flex justify-content-between align-items-center">
          <div>{error}</div>
          <Button variant="outline-danger" size="sm" onClick={handleRetry}>
            Tekrar Dene
          </Button>
        </Alert>
      )}

      {loading ? (
        <p>Yükleniyor...</p>
      ) : (
        <Row>
          {tables.length === 0 ? (
            <Col>
              <Alert variant="info">
                Henüz hiç masa eklenmemiş. Yeni bir masa eklemek için "Yeni Masa Ekle" butonunu kullanın.
              </Alert>
            </Col>
          ) : (
            tables.map((table) => (
              <Col key={table._id} xs={12} md={6} lg={4} className="mb-4">
                <Card 
                  className="h-100 shadow-sm"
                  style={{ cursor: 'pointer' }}
                >
                  <Card.Body>
                    <Card.Title onClick={() => handleTableClick(table._id)}>
                      {table.name || table.tableNumber || `Masa #${table._id.substring(table._id.length - 4)}`}
                    </Card.Title>
                    <Card.Text>
                      Kapasite: {table.capacity} kişi<br />
                      Durum: {getStatusBadge(table.status)}
                    </Card.Text>
                    
                    {/* Durum değiştirme seçenekleri */}
                    <div className="mt-3">
                      <div className="d-flex gap-2">
                        <Button 
                          size="sm" 
                          variant={table.status === 'available' ? 'success' : 'outline-success'}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateTableStatus(table._id, 'available');
                          }}
                        >
                          Müsait
                        </Button>
                        <Button 
                          size="sm" 
                          variant={table.status === 'occupied' ? 'danger' : 'outline-danger'}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateTableStatus(table._id, 'occupied');
                          }}
                        >
                          Dolu
                        </Button>
                        <Button 
                          size="sm" 
                          variant={table.status === 'reserved' ? 'warning' : 'outline-warning'}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateTableStatus(table._id, 'reserved');
                          }}
                        >
                          Rezerve
                        </Button>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))
          )}
        </Row>
      )}

      {/* Yeni Masa Ekleme Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Yeni Masa Ekle</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalError && <Alert variant="danger">{modalError}</Alert>}
          <Form onSubmit={handleCreateTable}>
            <Form.Group className="mb-3">
              <Form.Label>Masa Adı</Form.Label>
              <Form.Control
                type="text"
                placeholder="Örn: Masa 1"
                value={newTable.name}
                onChange={(e) => setNewTable({...newTable, name: e.target.value})}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Kapasite</Form.Label>
              <Form.Control
                type="number"
                min="1"
                max="20"
                value={newTable.capacity}
                onChange={(e) => setNewTable({...newTable, capacity: Number(e.target.value)})}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Durum</Form.Label>
              <Form.Select
                value={newTable.status}
                onChange={(e) => setNewTable({...newTable, status: e.target.value})}
              >
                <option value="available">Müsait</option>
                <option value="occupied">Dolu</option>
                <option value="reserved">Rezerve</option>
              </Form.Select>
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                İptal
              </Button>
              <Button variant="primary" type="submit">
                Ekle
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default TablesPage; 