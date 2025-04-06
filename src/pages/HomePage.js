import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { tableService, orderService } from '../services/api';

const HomePage = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    availableTables: 0,
    occupiedTables: 0,
    reservedTables: 0,
    activeOrders: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Token kontrolü
      const token = window.localStorage.getItem('token');
      if (!token) {
        console.error('Token bulunamadı, istatistikler getirilemeyecek');
        setLoading(false);
        return;
      }
      
      try {
        // Masaları getir
        const tablesResponse = await tableService.getAllTables();
        console.log('Masalar alındı:', tablesResponse);
        
        // Response formatını doğru işle
        let tables = [];
        if (tablesResponse.data) {
          tables = Array.isArray(tablesResponse.data) ? tablesResponse.data : 
                  (tablesResponse.data.tables ? tablesResponse.data.tables : []);
        }
        
        console.log('İşlenen masa verileri:', tables);
        
        // Siparişleri getir
        let activeOrders = 0;
        try {
          const ordersResponse = await orderService.getAllOrders();
          console.log('Siparişler alındı:', ordersResponse);
          
          // Response formatını doğru işle
          const orders = Array.isArray(ordersResponse.data) ? ordersResponse.data : 
                        (ordersResponse.data && ordersResponse.data.orders ? ordersResponse.data.orders : []);
                        
          console.log('İşlenen sipariş verileri:', orders);
          
          // Aktif siparişleri say (pending veya preparing durumunda olanlar)
          activeOrders = orders.filter(order => 
            order.status === 'pending' || order.status === 'preparing'
          ).length;
        } catch (error) {
          console.error('Siparişleri getirirken hata:', error);
          // Hata olsa bile devam et (siparişleri 0 olarak göster)
        }
        
        // İstatistikleri ayarla
        setStats({
          availableTables: tables.filter(table => table.status === 'available').length,
          occupiedTables: tables.filter(table => table.status === 'occupied').length,
          reservedTables: tables.filter(table => table.status === 'reserved').length,
          activeOrders
        });
        
        console.log('İstatistikler güncellendi:', {
          availableTables: tables.filter(table => table.status === 'available').length,
          occupiedTables: tables.filter(table => table.status === 'occupied').length,
          reservedTables: tables.filter(table => table.status === 'reserved').length,
          activeOrders
        });
      } catch (error) {
        console.error('Veri getirme hatası:', error);
      }
    } catch (error) {
      console.error('İstatistikleri yüklerken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <h2 className="text-center mb-5">İşletme Yönetim Sistemi</h2>

      {loading ? (
        <p className="text-center">Yükleniyor...</p>
      ) : (
        <>
          <Row className="mb-5">
            <Col md={3}>
              <Card className="text-center mb-4 shadow-sm h-100">
                <Card.Body>
                  <Card.Title className="display-4">{stats.availableTables}</Card.Title>
                  <Card.Text>Müsait Masa</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center mb-4 shadow-sm h-100 bg-danger text-white">
                <Card.Body>
                  <Card.Title className="display-4">{stats.occupiedTables}</Card.Title>
                  <Card.Text>Dolu Masa</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center mb-4 shadow-sm h-100 bg-warning">
                <Card.Body>
                  <Card.Title className="display-4">{stats.reservedTables}</Card.Title>
                  <Card.Text>Rezerve Masa</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center mb-4 shadow-sm h-100 bg-info text-white">
                <Card.Body>
                  <Card.Title className="display-4">{stats.activeOrders}</Card.Title>
                  <Card.Text>Aktif Sipariş</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className="mb-5">
            <Col md={4}>
              <Card className="shadow-sm h-100">
                <Card.Body className="d-flex flex-column">
                  <Card.Title>Masalar</Card.Title>
                  <Card.Text>
                    Masaları görüntüleyin, yeni masa ekleyin, masa durumlarını güncelleyin.
                  </Card.Text>
                  <Button as={Link} to="/tables" variant="primary" className="mt-auto">Masaları Yönet</Button>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="shadow-sm h-100">
                <Card.Body className="d-flex flex-column">
                  <Card.Title>Siparişler</Card.Title>
                  <Card.Text>
                    Aktif siparişleri görüntüleyin, sipariş durumlarını güncelleyin.
                  </Card.Text>
                  <Button as={Link} to="/orders" variant="primary" className="mt-auto">Siparişleri Yönet</Button>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="shadow-sm h-100">
                <Card.Body className="d-flex flex-column">
                  <Card.Title>Ürünler</Card.Title>
                  <Card.Text>
                    Ürünleri görüntüleyin, düzenleyin ve yeni ürünler ekleyin.
                  </Card.Text>
                  <Button as={Link} to="/products" variant="primary" className="mt-auto">Ürünleri Yönet</Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </Container>
  );
};

export default HomePage; 