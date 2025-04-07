import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Alert, Spinner, Modal, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { invoiceService, orderService } from '../services/api';

const InvoicesPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalError, setModalError] = useState('');
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newInvoice, setNewInvoice] = useState({
    orderId: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: ''
  });

  // Faturaları ve açık siparişleri getir
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Faturalar ve Siparişler getiriliyor...');
      
      // Faturaları getir
      const invoicesResponse = await invoiceService.getAllInvoices();
      console.log('Faturalar yanıtı:', invoicesResponse);
      
      const invoicesData = Array.isArray(invoicesResponse.data) ? invoicesResponse.data : 
                        (invoicesResponse.data && invoicesResponse.data.invoices ? invoicesResponse.data.invoices : []);
      
      console.log('İşlenen fatura verileri:', invoicesData);
      setInvoices(invoicesData);
      
      // Siparişleri getir (fatura oluşturma için kullanılacak)
      try {
        const ordersResponse = await orderService.getAllOrders();
        console.log('Siparişler yanıtı:', ordersResponse);
        
        const ordersData = Array.isArray(ordersResponse.data) ? ordersResponse.data : 
                           (ordersResponse.data && ordersResponse.data.orders ? ordersResponse.data.orders : []);
        
        // Faturası olmayan siparişleri filtrele
        const availableOrders = ordersData.filter(order => order.status === 'completed' && !order.isInvoiced);
        console.log('Fatura oluşturulabilecek siparişler:', availableOrders);
        
        setOrders(availableOrders);
      } catch (ordersError) {
        console.error('Sipariş bilgilerini getirme hatası:', ordersError);
      }
    } catch (error) {
      console.error('Veri getirme hatası:', error);
      setError('Verileri yüklerken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    
    if (!newInvoice.orderId) {
      setModalError('Sipariş seçimi zorunludur');
      return;
    }
    
    try {
      setModalError('');
      console.log('Fatura oluşturuluyor:', newInvoice);
      
      // API'ye gönderilecek veriyi hazırla
      const invoiceData = {
        orderId: newInvoice.orderId,
        invoiceDate: new Date(newInvoice.invoiceDate).toISOString(),
        dueDate: new Date(newInvoice.dueDate).toISOString(),
        notes: newInvoice.notes || ''
      };
      
      await invoiceService.createInvoice(invoiceData);
      
      // Modal'ı kapat ve formu sıfırla
      setShowCreateModal(false);
      setNewInvoice({
        orderId: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: ''
      });
      
      // Faturaları yeniden yükle
      fetchData();
    } catch (error) {
      console.error('Fatura oluşturma hatası:', error);
      setModalError('Fatura oluştururken bir hata oluştu: ' + (error.response?.data?.message || 'Bilinmeyen hata'));
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return <Badge bg="success">Ödendi</Badge>;
      case 'pending':
        return <Badge bg="warning">Beklemede</Badge>;
      case 'cancelled':
        return <Badge bg="danger">İptal Edildi</Badge>;
      default:
        return <Badge bg="secondary">Bilinmiyor</Badge>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Belirtilmemiş';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR');
  };

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '0,00 TL';
    return parseFloat(amount).toLocaleString('tr-TR', { 
      style: 'currency', 
      currency: 'TRY',
      minimumFractionDigits: 2
    });
  };

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Faturalar</h2>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          Yeni Fatura Oluştur
        </Button>
      </div>

      {error && (
        <Alert variant="danger" className="d-flex justify-content-between align-items-center">
          <div>{error}</div>
          <Button variant="outline-danger" size="sm" onClick={fetchData}>
            Tekrar Dene
          </Button>
        </Alert>
      )}

      {loading ? (
        <div className="text-center p-5">
          <Spinner animation="border" role="status" />
          <p className="mt-2">Faturalar yükleniyor...</p>
        </div>
      ) : invoices.length === 0 ? (
        <Alert variant="info">
          Henüz hiç fatura bulunmuyor. Yeni bir fatura oluşturmak için "Yeni Fatura Oluştur" butonunu kullanın.
        </Alert>
      ) : (
        <Card>
          <Card.Body>
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Fatura No</th>
                  <th>Tarih</th>
                  <th>Son Ödeme</th>
                  <th>Tutar</th>
                  <th>Durum</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice._id}>
                    <td>{invoice.invoiceNumber}</td>
                    <td>{formatDate(invoice.invoiceDate)}</td>
                    <td>{formatDate(invoice.dueDate)}</td>
                    <td>{formatCurrency(invoice.totalAmount)}</td>
                    <td>{getStatusBadge(invoice.paymentStatus)}</td>
                    <td>
                      <Button 
                        as={Link} 
                        to={`/payments?invoiceId=${invoice._id}`} 
                        variant="outline-success" 
                        size="sm"
                        className="me-2"
                      >
                        Ödeme Yap
                      </Button>
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        // TODO: Detay sayfası veya modal
                      >
                        Detay
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      {/* Yeni Fatura Oluşturma Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Yeni Fatura Oluştur</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalError && <Alert variant="danger">{modalError}</Alert>}
          
          {orders.length === 0 ? (
            <Alert variant="warning">
              Fatura oluşturulabilecek tamamlanmış sipariş bulunmuyor. Önce bir sipariş tamamlayın.
            </Alert>
          ) : (
            <Form onSubmit={handleCreateInvoice}>
              <Form.Group className="mb-3">
                <Form.Label>Sipariş</Form.Label>
                <Form.Select
                  value={newInvoice.orderId}
                  onChange={(e) => setNewInvoice({...newInvoice, orderId: e.target.value})}
                  required
                >
                  <option value="">Sipariş Seçin</option>
                  {orders.map((order) => (
                    <option key={order._id} value={order._id}>
                      {`Sipariş #${order._id.substr(-6)} - ${formatCurrency(order.totalAmount)}`}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Fatura Tarihi</Form.Label>
                <Form.Control
                  type="date"
                  value={newInvoice.invoiceDate}
                  onChange={(e) => setNewInvoice({...newInvoice, invoiceDate: e.target.value})}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Son Ödeme Tarihi</Form.Label>
                <Form.Control
                  type="date"
                  value={newInvoice.dueDate}
                  onChange={(e) => setNewInvoice({...newInvoice, dueDate: e.target.value})}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Notlar</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="Fatura için notlar girin (opsiyonel)"
                  value={newInvoice.notes}
                  onChange={(e) => setNewInvoice({...newInvoice, notes: e.target.value})}
                />
              </Form.Group>

              <div className="d-flex justify-content-end gap-2">
                <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
                  İptal
                </Button>
                <Button variant="primary" type="submit">
                  Fatura Oluştur
                </Button>
              </div>
            </Form>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default InvoicesPage; 