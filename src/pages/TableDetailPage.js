import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Alert, ListGroup, Modal, Form } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { tableService, orderService, productService, categoryService } from '../services/api';

const TableDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [table, setTable] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [orderItems, setOrderItems] = useState([]);
  
  // Sipariş ekleme modalı için
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newOrderItem, setNewOrderItem] = useState({
    product: '',
    quantity: 1,
    notes: ''
  });

  useEffect(() => {
    fetchTableData();
    fetchCategories();
    fetchProducts();
  }, [id]);

  const fetchTableData = async () => {
    try {
      setLoading(true);
      const tableResponse = await tableService.getTableById(id);
      console.log('Masa detayı alındı:', tableResponse.data);
      setTable(tableResponse.data);

      try {
        const orderResponse = await orderService.getActiveOrderByTable(id);
        console.log('Aktif sipariş alındı:', orderResponse.data);
        
        // API yanıtını kontrol edelim
        if (orderResponse.data && orderResponse.data.order) {
          setActiveOrder(orderResponse.data.order);
        } else {
          console.log('Geçerli aktif sipariş bulunamadı');
          setActiveOrder(null);
        }
      } catch (orderError) {
        // Aktif sipariş olmaması bir hata durumu olmayabilir
        console.log('Aktif sipariş bulunamadı:', orderError);
        setActiveOrder(null);
      }
    } catch (error) {
      setError('Masa bilgilerini yüklerken bir hata oluştu');
      console.error('Masa bilgileri yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoryService.getAllCategories();
      console.log('Kategoriler alındı:', response.data);
      
      // API yanıtı kontrol edilip veri uygun formatta ayarlanıyor
      if (response.data) {
        // Kategori verisini doğru format şeklinde ayarla
        const categoriesData = Array.isArray(response.data) ? response.data 
                             : response.data.categories ? response.data.categories 
                             : [];
                             
        setCategories(categoriesData);
        
        // İlk kategoriyi seç (eğer varsa)
        if (categoriesData.length > 0) {
          setSelectedCategory(categoriesData[0]._id);
        }
      } else {
        console.warn('Kategori verisi alınamadı veya boş');
        setCategories([]);
      }
    } catch (error) {
      console.error('Kategorileri yüklerken hata:', error);
      setCategories([]); // Hata durumunda boş dizi olarak ayarla
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productService.getAllProducts();
      console.log('Ürünler alındı:', response.data);
      
      // API yanıtı kontrol edilip veri uygun formatta ayarlanıyor
      if (response.data) {
        // Ürün verisini doğru format şeklinde ayarla
        const productsData = Array.isArray(response.data) ? response.data 
                           : response.data.products ? response.data.products 
                           : [];
                           
        setProducts(productsData);
      } else {
        console.warn('Ürün verisi alınamadı veya boş');
        setProducts([]);
      }
    } catch (error) {
      console.error('Ürünleri yüklerken hata:', error);
      setProducts([]); // Hata durumunda boş dizi olarak ayarla
    }
  };

  const createNewOrder = async () => {
    if (orderItems.length === 0) {
      setError('Sipariş için en az bir ürün eklemelisiniz');
      return;
    }

    try {
      console.log('Oluşturulacak sipariş:', {
        table: id,
        items: orderItems.map(item => ({
          productId: item.product, // productId olarak gönderilmeli
          quantity: item.quantity,
          notes: item.notes
        }))
      });

      const newOrder = {
        tableId: id, // tableId olarak değiştirildi
        items: orderItems.map(item => ({
          productId: item.product, // productId olarak değiştirildi
          quantity: item.quantity,
          notes: item.notes || ''
        }))
      };

      const response = await orderService.createOrder(newOrder);
      console.log('Sipariş oluşturma yanıtı:', response.data);
      
      setShowOrderModal(false);
      setOrderItems([]);
      // Kısa bir gecikmeyle tabloyu güncelleyelim
      setTimeout(() => {
        fetchTableData(); // Sayfayı yenileyin
      }, 500);
    } catch (error) {
      console.error('Sipariş oluştururken hata:', error);
      let errorMessage = 'Sipariş oluştururken bir hata oluştu';
      
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
    }
  };

  const addItemToOrder = () => {
    if (!newOrderItem.product) {
      setError('Lütfen bir ürün seçin');
      return;
    }

    try {
      const selectedProduct = products.find(p => p._id === newOrderItem.product);
      
      if (!selectedProduct) {
        setError('Seçilen ürün bulunamadı');
        return;
      }
      
      console.log('Seçilen ürün:', selectedProduct);
      
      setOrderItems([
        ...orderItems,
        {
          product: newOrderItem.product, // Ürün ID'si 
          productName: selectedProduct.name,
          price: selectedProduct.price || 0,
          quantity: newOrderItem.quantity,
          notes: newOrderItem.notes || ''
        }
      ]);
      
      setNewOrderItem({
        product: '',
        quantity: 1,
        notes: ''
      });
      
      setShowAddItemModal(false);
      setError(''); // Hata mesajını temizle
    } catch (error) {
      console.error('Ürün eklerken hata:', error);
      setError('Ürün eklenirken bir hata oluştu');
    }
  };

  const removeOrderItem = (index) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const completeOrder = async () => {
    try {
      await orderService.updateOrderStatus(activeOrder._id, 'completed');
      fetchTableData();
    } catch (error) {
      setError('Siparişi tamamlarken bir hata oluştu');
      console.error(error);
    }
  };

  const cancelOrder = async () => {
    try {
      await orderService.updateOrderStatus(activeOrder._id, 'cancelled');
      fetchTableData();
    } catch (error) {
      setError('Siparişi iptal ederken bir hata oluştu');
      console.error(error);
    }
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

  const getOrderStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge bg="warning">Hazırlanıyor</Badge>;
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

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0).toFixed(2);
  };

  const getFilteredProducts = () => {
    if (!selectedCategory) return products;
    return products.filter(product => product.category === selectedCategory);
  };

  if (loading) {
    return <Container><p>Yükleniyor...</p></Container>;
  }

  if (!table) {
    return (
      <Container>
        <Alert variant="danger">Masa bulunamadı.</Alert>
        <Button variant="primary" onClick={() => navigate('/tables')}>
          Masalara Dön
        </Button>
      </Container>
    );
  }

  return (
    <Container>
      <Button variant="secondary" className="mb-3" onClick={() => navigate('/tables')}>
        &larr; Masalara Dön
      </Button>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="mb-4">
        <Col md={6}>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title>{table.tableNumber || `Masa #${table._id?.substring(table._id.length - 4)}`}</Card.Title>
              <Card.Text>
                Kapasite: {table.capacity || 0} kişi<br />
                Durum: {getStatusBadge(table.status)}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <h3>Sipariş Durumu</h3>
      
      {activeOrder && activeOrder._id ? (
        <Row className="mb-4">
          <Col>
            <Card className="shadow-sm">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <div>
                  Sipariş #{activeOrder._id ? activeOrder._id.substring(activeOrder._id.length - 6) : 'Yeni'}
                  {' '}{getOrderStatusBadge(activeOrder.status)}
                </div>
                <div>
                  {activeOrder.status === 'pending' || activeOrder.status === 'preparing' ? (
                    <div className="d-flex gap-2">
                      <Button variant="success" size="sm" onClick={completeOrder}>
                        Tamamla
                      </Button>
                      <Button variant="danger" size="sm" onClick={cancelOrder}>
                        İptal Et
                      </Button>
                    </div>
                  ) : null}
                </div>
              </Card.Header>
              <Card.Body>
                <ListGroup variant="flush">
                  {activeOrder.items && activeOrder.items.length > 0 ? (
                    activeOrder.items.map((item, index) => (
                      <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>{item.product?.name || 'Ürün'}</strong> x {item.quantity}
                          {item.notes && <div><small className="text-muted">Not: {item.notes}</small></div>}
                        </div>
                        <div className="text-end">
                          <div>
                            {/* Farklı fiyat gösterme olasılıkları */}
                            {item.totalPrice ? 
                              `${parseFloat(item.totalPrice).toFixed(2)}` : 
                              (item.unitPrice ? 
                                `${(parseFloat(item.unitPrice) * item.quantity).toFixed(2)}` :
                                (item.product?.price ? 
                                  `${(parseFloat(item.product.price) * item.quantity).toFixed(2)}` : 
                                  '0.00')
                              )
                            } TL
                          </div>
                        </div>
                      </ListGroup.Item>
                    ))
                  ) : (
                    <ListGroup.Item>Bu siparişte henüz ürün bulunmuyor</ListGroup.Item>
                  )}
                </ListGroup>
                <div className="d-flex justify-content-between mt-3">
                  <h5>Toplam:</h5>
                  <h5>
                    {/* totalAmount varsa onu, yoksa hesaplama yapalım */}
                    {activeOrder.totalAmount ? 
                      parseFloat(activeOrder.totalAmount).toFixed(2) : 
                      (activeOrder.items && activeOrder.items.reduce((total, item) => {
                        return total + (
                          item.totalPrice ? parseFloat(item.totalPrice) : 
                          (item.unitPrice ? parseFloat(item.unitPrice) * item.quantity : 
                            (item.product?.price ? parseFloat(item.product.price) * item.quantity : 0)
                          )
                        );
                      }, 0).toFixed(2))
                    } TL
                  </h5>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      ) : (
        <Row className="mb-4">
          <Col>
            <Alert variant="info">
              Bu masa için aktif sipariş bulunmuyor.
              <Button 
                variant="primary" 
                className="ms-3"
                onClick={() => setShowOrderModal(true)}
              >
                Sipariş Oluştur
              </Button>
            </Alert>
          </Col>
        </Row>
      )}

      {/* Sipariş Oluşturma Modalı */}
      <Modal show={showOrderModal} onHide={() => setShowOrderModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Yeni Sipariş Oluştur - {table.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          {orderItems.length > 0 ? (
            <div className="mb-3">
              <h5>Seçilen Ürünler</h5>
              <ListGroup>
                {orderItems.map((item, index) => (
                  <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong>{item.productName}</strong> x {item.quantity}
                      {item.notes && <div><small className="text-muted">Not: {item.notes}</small></div>}
                    </div>
                    <div className="d-flex align-items-center">
                      <div className="me-3">{(item.price * item.quantity).toFixed(2)} TL</div>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => removeOrderItem(index)}
                      >
                        Kaldır
                      </Button>
                    </div>
                  </ListGroup.Item>
                ))}
                <ListGroup.Item className="d-flex justify-content-between">
                  <h5>Toplam:</h5>
                  <h5>{calculateTotal()} TL</h5>
                </ListGroup.Item>
              </ListGroup>
            </div>
          ) : (
            <Alert variant="info">Henüz ürün eklenmedi.</Alert>
          )}
          
          <Button 
            variant="success" 
            onClick={() => setShowAddItemModal(true)}
          >
            Ürün Ekle
          </Button>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowOrderModal(false)}>
            İptal
          </Button>
          <Button 
            variant="primary" 
            onClick={createNewOrder}
            disabled={orderItems.length === 0}
          >
            Siparişi Oluştur
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Ürün Ekleme Modalı */}
      <Modal show={showAddItemModal} onHide={() => setShowAddItemModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Ürün Ekle</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            {/* Kategori Seçimi */}
            <Form.Group className="mb-3">
              <Form.Label>Kategori</Form.Label>
              <Form.Select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">Tüm Kategoriler</option>
                {categories && categories.length > 0 ? (
                  categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))
                ) : (
                  <option disabled>Kategori bulunamadı</option>
                )}
              </Form.Select>
            </Form.Group>
            
            {/* Ürün Seçimi */}
            <Form.Group className="mb-3">
              <Form.Label>Ürün</Form.Label>
              <Form.Select 
                value={newOrderItem.product}
                onChange={(e) => setNewOrderItem({...newOrderItem, product: e.target.value})}
                required
              >
                <option value="">Ürün Seçin</option>
                {getFilteredProducts().map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.name} - {product.price.toFixed(2)} TL
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            
            {/* Miktar */}
            <Form.Group className="mb-3">
              <Form.Label>Miktar</Form.Label>
              <Form.Control 
                type="number" 
                min="1"
                value={newOrderItem.quantity}
                onChange={(e) => setNewOrderItem({...newOrderItem, quantity: parseInt(e.target.value) || 1})}
                required
              />
            </Form.Group>
            
            {/* Notlar */}
            <Form.Group className="mb-3">
              <Form.Label>Notlar (İsteğe Bağlı)</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={2}
                value={newOrderItem.notes}
                onChange={(e) => setNewOrderItem({...newOrderItem, notes: e.target.value})}
                placeholder="Örn: Az pişmiş, soğansız, vb."
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddItemModal(false)}>
            İptal
          </Button>
          <Button 
            variant="primary" 
            onClick={addItemToOrder}
            disabled={!newOrderItem.product}
          >
            Ekle
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default TableDetailPage; 