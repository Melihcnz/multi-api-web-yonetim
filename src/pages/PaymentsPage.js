import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Alert, Spinner, Modal, Form } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import { paymentService, invoiceService } from '../services/api';

const PaymentsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [currentInvoice, setCurrentInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalError, setModalError] = useState('');
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPayment, setNewPayment] = useState({
    invoiceId: '',
    amount: 0,
    paymentMethod: 'cash',
    notes: ''
  });
  
  // URL'den invoiceId almak için
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const invoiceId = params.get('invoiceId');
    
    if (invoiceId) {
      setNewPayment(prev => ({ ...prev, invoiceId }));
      fetchInvoiceDetails(invoiceId);
    }
  }, [location.search]);

  // Belirli bir faturanın detaylarını getir
  const fetchInvoiceDetails = async (invoiceId) => {
    try {
      const response = await invoiceService.getInvoiceById(invoiceId);
      
      const invoiceData = response.data.invoice || response.data;
      setCurrentInvoice(invoiceData);
      
      // Fatura tutarını yeni ödemeye ayarla
      if (invoiceData && invoiceData.totalAmount) {
        setNewPayment(prev => ({ 
          ...prev, 
          invoiceId,
          amount: invoiceData.totalAmount
        }));
      }
      
      // Otomatik olarak ödeme modalını aç
      setShowCreateModal(true);
    } catch (error) {
      console.error('Fatura detayı getirme hatası:', error);
      setError('Fatura bilgisi yüklenirken bir hata oluştu');
    }
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Ödemeler ve Faturalar getiriliyor...');
      
      // Ödemeleri getir
      const paymentsResponse = await paymentService.getAllPayments();
      console.log('Ödemeler yanıtı:', paymentsResponse);
      
      const paymentsData = Array.isArray(paymentsResponse.data) ? paymentsResponse.data : 
                        (paymentsResponse.data && paymentsResponse.data.payments ? paymentsResponse.data.payments : []);
      
      console.log('İşlenen ödeme verileri:', paymentsData);
      setPayments(paymentsData);
      
      // Faturaları getir (ödeme oluşturma için kullanılacak)
      try {
        const invoicesResponse = await invoiceService.getAllInvoices();
        console.log('Faturalar yanıtı:', invoicesResponse);
        
        const invoicesData = Array.isArray(invoicesResponse.data) ? invoicesResponse.data : 
                           (invoicesResponse.data && invoicesResponse.data.invoices ? invoicesResponse.data.invoices : []);
        
        // Ödenmemiş faturaları filtrele
        const pendingInvoices = invoicesData.filter(invoice => invoice.paymentStatus === 'pending');
        console.log('Ödeme yapılabilecek faturalar:', pendingInvoices);
        
        setInvoices(pendingInvoices);
      } catch (invoicesError) {
        console.error('Fatura bilgilerini getirme hatası:', invoicesError);
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

  const handleCreatePayment = async (e) => {
    e.preventDefault();
    
    if (!newPayment.invoiceId || newPayment.amount <= 0) {
      setModalError('Fatura seçimi ve ödeme tutarı zorunludur');
      return;
    }
    
    try {
      setModalError('');
      console.log('Ödeme oluşturuluyor:', newPayment);
      
      // API'ye gönderilecek veriyi hazırla
      const paymentData = {
        invoiceId: newPayment.invoiceId,
        amount: parseFloat(newPayment.amount),
        paymentMethod: newPayment.paymentMethod,
        notes: newPayment.notes || ''
      };
      
      const response = await paymentService.createPayment(paymentData);
      console.log('Ödeme yanıtı:', response.data);
      
      // Modal'ı kapat ve formu sıfırla
      setShowCreateModal(false);
      setNewPayment({
        invoiceId: '',
        amount: 0,
        paymentMethod: 'cash',
        notes: ''
      });
      
      // Ödemeleri yeniden yükle
      fetchData();
      
      // URL'deki invoiceId parametresini temizle
      navigate('/payments');
      
      // Başarılı ödeme mesajı göster
      setError('');
      
      // Tam ödeme yapıldıysa başarı mesajı göster
      if (response.data && response.data.payment && response.data.payment.invoice && 
          response.data.payment.invoice.paymentStatus === 'paid') {
        alert('Ödeme başarıyla tamamlandı. Fatura tamamen ödendi!');
      } else {
        alert('Ödeme başarıyla kaydedildi.');
      }
    } catch (error) {
      console.error('Ödeme oluşturma hatası:', error);
      setModalError('Ödeme oluştururken bir hata oluştu: ' + (error.response?.data?.message || 'Bilinmeyen hata'));
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge bg="success">Tamamlandı</Badge>;
      case 'pending':
        return <Badge bg="warning">Beklemede</Badge>;
      case 'failed':
        return <Badge bg="danger">Başarısız</Badge>;
      default:
        return <Badge bg="secondary">Bilinmiyor</Badge>;
    }
  };
  
  const getPaymentMethodLabel = (method) => {
    switch (method) {
      case 'cash':
        return 'Nakit';
      case 'credit_card':
        return 'Kredi Kartı';
      case 'bank_transfer':
        return 'Banka Havalesi';
      case 'mobile_payment':
        return 'Mobil Ödeme';
      default:
        return method;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Belirtilmemiş';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
        <h2>Ödemeler</h2>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          Yeni Ödeme Yap
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
          <p className="mt-2">Ödemeler yükleniyor...</p>
        </div>
      ) : payments.length === 0 ? (
        <Alert variant="info">
          Henüz hiç ödeme bulunmuyor. Yeni bir ödeme yapmak için "Yeni Ödeme Yap" butonunu kullanın.
        </Alert>
      ) : (
        <Card>
          <Card.Body>
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Fatura No</th>
                  <th>Ödeme Tarihi</th>
                  <th>Tutar</th>
                  <th>Ödeme Yöntemi</th>
                  <th>Durum</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment._id}>
                    <td>
                      {payment.invoice ? (
                        payment.invoice.invoiceNumber || `#${payment.invoice._id ? payment.invoice._id.substr(-6) : 'Bilinmiyor'}`
                      ) : 'Bilinmiyor'}
                    </td>
                    <td>{formatDate(payment.paymentDate)}</td>
                    <td>{formatCurrency(payment.amount)}</td>
                    <td>{getPaymentMethodLabel(payment.paymentMethod)}</td>
                    <td>{getStatusBadge(payment.paymentStatus)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      {/* Yeni Ödeme Oluşturma Modal */}
      <Modal show={showCreateModal} onHide={() => {
        setShowCreateModal(false);
        // URL'deki invoiceId parametresini temizle
        if (location.search.includes('invoiceId')) {
          navigate('/payments');
        }
      }}>
        <Modal.Header closeButton>
          <Modal.Title>Ödeme Yap</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalError && <Alert variant="danger">{modalError}</Alert>}
          
          {invoices.length === 0 && !currentInvoice ? (
            <Alert variant="warning">
              Ödenecek fatura bulunmuyor. Önce bir fatura oluşturun.
            </Alert>
          ) : (
            <Form onSubmit={handleCreatePayment}>
              <Form.Group className="mb-3">
                <Form.Label>Fatura</Form.Label>
                {currentInvoice ? (
                  <div className="border rounded p-2 mb-2">
                    <strong>Fatura:</strong> {currentInvoice.invoiceNumber || `#${currentInvoice._id.substr(-6)}`} <br />
                    <strong>Toplam Tutar:</strong> {formatCurrency(currentInvoice.totalAmount)} <br />
                    <strong>Durum:</strong> Beklemede
                  </div>
                ) : (
                  <Form.Select
                    value={newPayment.invoiceId}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      setNewPayment({...newPayment, invoiceId: selectedId});
                      
                      // Seçilen faturanın tutarını otomatik olarak ödeme tutarına ata
                      const selectedInvoice = invoices.find(inv => inv._id === selectedId);
                      if (selectedInvoice) {
                        setNewPayment(prev => ({...prev, amount: selectedInvoice.totalAmount}));
                      }
                    }}
                    required
                  >
                    <option value="">Fatura Seçin</option>
                    {invoices.map((invoice) => (
                      <option key={invoice._id} value={invoice._id}>
                        {`Fatura ${invoice.invoiceNumber || '#' + invoice._id.substr(-6)} - ${formatCurrency(invoice.totalAmount)}`}
                      </option>
                    ))}
                  </Form.Select>
                )}
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Ödeme Tutarı (TL)</Form.Label>
                <Form.Control
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})}
                  required
                />
                <Form.Text>
                  Tam tutarın altında bir ödeme yaparsanız, fatura kısmen ödenmiş olarak işaretlenir.
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Ödeme Yöntemi</Form.Label>
                <Form.Select
                  value={newPayment.paymentMethod}
                  onChange={(e) => setNewPayment({...newPayment, paymentMethod: e.target.value})}
                  required
                >
                  <option value="cash">Nakit</option>
                  <option value="credit_card">Kredi Kartı</option>
                  <option value="bank_transfer">Banka Havalesi</option>
                  <option value="mobile_payment">Mobil Ödeme</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Notlar</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="Ödeme için notlar girin (opsiyonel)"
                  value={newPayment.notes}
                  onChange={(e) => setNewPayment({...newPayment, notes: e.target.value})}
                />
              </Form.Group>

              <div className="d-flex justify-content-end gap-2">
                <Button 
                  variant="secondary" 
                  onClick={() => {
                    setShowCreateModal(false);
                    // URL'deki invoiceId parametresini temizle
                    if (location.search.includes('invoiceId')) {
                      navigate('/payments');
                    }
                  }}
                >
                  İptal
                </Button>
                <Button variant="success" type="submit">
                  Ödeme Yap
                </Button>
              </div>
            </Form>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default PaymentsPage; 