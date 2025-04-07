import React, { useState, useEffect, useCallback } from 'react';
import { Container, Table, Badge, Button, Alert, Form, Row, Col, Spinner } from 'react-bootstrap';
import { orderService, tableService } from '../services/api';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'preparing', 'completed', 'cancelled'

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Siparişler getiriliyor...');
      
      // Önce masa bilgilerini getirelim (siparişlerden önce)
      let tableList = [];
      try {
        const tablesResponse = await tableService.getAllTables();
        console.log('Masa yanıtı:', tablesResponse);
        
        const tablesData = Array.isArray(tablesResponse.data) ? tablesResponse.data : 
                          (tablesResponse.data && tablesResponse.data.tables ? tablesResponse.data.tables : []);
        
        console.log('İşlenen masa verileri:', tablesData);
        tableList = tablesData;
        setTables(tablesData);
      } catch (tableError) {
        console.error('Masa bilgilerini getirme hatası:', tableError);
      }
      
      // Sonra siparişleri getirelim
      const ordersResponse = await orderService.getAllOrders();
      console.log('Siparişler yanıtı:', ordersResponse);
      
      // API yanıtı kontrolü
      const ordersData = Array.isArray(ordersResponse.data) ? ordersResponse.data : 
                        (ordersResponse.data && ordersResponse.data.orders ? ordersResponse.data.orders : []);
      
      console.log('İşlenen sipariş verileri:', ordersData);
      
      // Sipariş ve masa ilişkisini debug et
      ordersData.forEach(order => {
        const tableName = tableList.find(t => t._id === order.table)?.tableNumber || 'Bulunamadı';
        console.log(`Sipariş ID: ${order._id}, Masa ID: ${order.table}, Masa Adı: ${tableName}`);
      });
      
      setOrders(ordersData);
    } catch (error) {
      console.error('Siparişleri getirme hatası:', error);
      setError('Siparişleri yüklerken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setLoading(true);
      await orderService.updateOrderStatus(orderId, newStatus);
      fetchOrders();
    } catch (error) {
      console.error('Sipariş durumu güncelleme hatası:', error);
      setError('Sipariş durumunu güncellerken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge bg="warning">Beklemede</Badge>;
      case 'preparing':
        return <Badge bg="info">Hazırlanıyor</Badge>;
      case 'completed':
        return <Badge bg="success">Tamamlandı</Badge>;
      case 'cancelled':
        return <Badge bg="danger">İptal Edildi</Badge>;
      default:
        return <Badge bg="secondary">Bilinmiyor</Badge>;
    }
  };

  const getTableName = (tableId) => {
    // tableId kontrolü
    if (!tableId) return 'Belirsiz Masa';
    
    // tableId string değilse string'e çevirelim
    const tableIdStr = String(tableId);
    
    const table = tables.find(t => t._id === tableId);
    if (table) {
      return table.name || table.tableNumber || `Masa ${table.tableNumber || '#' + tableIdStr.substring(0, 6)}`;
    }
    
    // Eğer masa bulunamazsa ID'nin ilk 6 karakterini göster
    try {
      return `Masa #${tableIdStr.substring(0, 6)}`;
    } catch (error) {
      console.error('Masa ID işleme hatası:', error, tableId);
      return 'Bilinmeyen Masa';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('tr-TR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const filteredOrders = filter === 'all' ? 
    orders : 
    orders.filter(order => order.status === filter);

  return (
    <Container>
      <h2 className="mb-4">Siparişler</h2>

      {error && (
        <Alert variant="danger">
          {error}
          <Button variant="outline-danger" size="sm" className="ms-2" onClick={fetchOrders}>
            Tekrar Dene
          </Button>
        </Alert>
      )}

      <Row className="mb-4">
        <Col md={6}>
          <Form.Group>
            <Form.Label>Durum Filtresi</Form.Label>
            <Form.Select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">Tüm Siparişler</option>
              <option value="pending">Beklemede</option>
              <option value="preparing">Hazırlanıyor</option>
              <option value="completed">Tamamlandı</option>
              <option value="cancelled">İptal Edildi</option>
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      {loading ? (
        <div className="text-center p-5">
          <Spinner animation="border" role="status" />
          <p className="mt-2">Siparişler yükleniyor...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <Alert variant="info">
          {filter === 'all' ? 'Henüz hiç sipariş bulunmuyor.' : `${filter} durumunda sipariş bulunmuyor.`}
        </Alert>
      ) : (
        <Table responsive striped bordered hover>
          <thead>
            <tr>
              <th>Sipariş No</th>
              <th>Masa</th>
              <th>Tarih</th>
              <th>Tutar</th>
              <th>Durum</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order._id}>
                <td>#{order._id.substring(order._id.length - 6)}</td>
                <td>
                  {getTableName(order.table)}
                  {order.table && (
                    <small className="text-muted d-block">
                      ID: {String(order.table).substring(0, 6)}
                    </small>
                  )}
                </td>
                <td>{formatDate(order.orderDate)}</td>
                <td>{parseFloat(order.totalAmount).toFixed(2)} TL</td>
                <td>{getStatusBadge(order.status)}</td>
                <td>
                  {order.status === 'pending' && (
                    <>
                      <Button 
                        variant="primary" 
                        size="sm" 
                        className="me-2"
                        onClick={() => handleStatusChange(order._id, 'preparing')}
                      >
                        Hazırlanıyor
                      </Button>
                      <Button 
                        variant="danger" 
                        size="sm"
                        onClick={() => handleStatusChange(order._id, 'cancelled')}
                      >
                        İptal Et
                      </Button>
                    </>
                  )}
                  {order.status === 'preparing' && (
                    <Button 
                      variant="success" 
                      size="sm"
                      onClick={() => handleStatusChange(order._id, 'completed')}
                    >
                      Tamamla
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Container>
  );
};

export default OrdersPage; 