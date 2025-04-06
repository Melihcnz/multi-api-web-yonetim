import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form, Alert, Badge, Spinner } from 'react-bootstrap';
import { productService, categoryService } from '../services/api';

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalError, setModalError] = useState('');
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: 0,
    category: '',
    stockAmount: 0,
    isAvailable: true
  });

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Ürünler getiriliyor...');
      
      const productsResponse = await productService.getAllProducts();
      console.log('Ürünler yanıtı:', productsResponse);
      
      // API yanıtı kontrolü
      const productsData = Array.isArray(productsResponse.data) ? productsResponse.data : 
                        (productsResponse.data && productsResponse.data.products ? productsResponse.data.products : []);
      
      console.log('İşlenen ürün verileri:', productsData);
      setProducts(productsData);
      
      // Kategori bilgilerini de getirelim
      try {
        const categoriesResponse = await categoryService.getAllCategories();
        console.log('Kategoriler yanıtı:', categoriesResponse);
        
        const categoriesData = Array.isArray(categoriesResponse.data) ? categoriesResponse.data : 
                             (categoriesResponse.data && categoriesResponse.data.categories ? categoriesResponse.data.categories : []);
        
        console.log('İşlenen kategori verileri:', categoriesData);
        setCategories(categoriesData);
        
        // Varsayılan olarak ilk kategoriyi seç (eğer varsa)
        if (categoriesData.length > 0 && !newProduct.category) {
          setNewProduct(prev => ({...prev, category: categoriesData[0]._id}));
        }
      } catch (categoryError) {
        console.error('Kategori bilgilerini getirme hatası:', categoryError);
      }
    } catch (error) {
      console.error('Ürünleri getirme hatası:', error);
      setError('Ürünleri yüklerken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [newProduct.category]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    
    if (!newProduct.name || !newProduct.price) {
      setModalError('Ürün adı ve fiyatı zorunludur');
      return;
    }
    
    try {
      setModalError('');
      console.log('Ürün oluşturuluyor:', newProduct);
      
      // API'ye gönderilecek veriyi hazırla
      const productData = {
        name: newProduct.name,
        description: newProduct.description || '',
        price: parseFloat(newProduct.price),
        category: newProduct.category,
        stockAmount: parseInt(newProduct.stockAmount) || 0,
        isAvailable: newProduct.isAvailable
      };
      
      await productService.createProduct(productData);
      
      // Modal'ı kapat ve formu sıfırla
      setShowCreateModal(false);
      setNewProduct({
        name: '',
        description: '',
        price: 0,
        category: categories.length > 0 ? categories[0]._id : '',
        stockAmount: 0,
        isAvailable: true
      });
      
      // Ürünleri yeniden yükle
      fetchProducts();
    } catch (error) {
      console.error('Ürün oluşturma hatası:', error);
      setModalError('Ürün oluştururken bir hata oluştu: ' + (error.response?.data?.message || 'Bilinmeyen hata'));
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat._id === categoryId);
    return category ? category.name : 'Kategorisiz';
  };

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Ürünler</h2>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          Yeni Ürün Ekle
        </Button>
      </div>

      {error && (
        <Alert variant="danger" className="d-flex justify-content-between align-items-center">
          <div>{error}</div>
          <Button variant="outline-danger" size="sm" onClick={fetchProducts}>
            Tekrar Dene
          </Button>
        </Alert>
      )}

      {loading ? (
        <div className="text-center p-5">
          <Spinner animation="border" role="status" />
          <p className="mt-2">Ürünler yükleniyor...</p>
        </div>
      ) : products.length === 0 ? (
        <Alert variant="info">
          Henüz hiç ürün bulunmuyor. Yeni bir ürün eklemek için "Yeni Ürün Ekle" butonunu kullanın.
        </Alert>
      ) : (
        <Row>
          {products.map((product) => (
            <Col key={product._id} lg={4} md={6} className="mb-4">
              <Card className="h-100 shadow-sm">
                <Card.Body>
                  <div className="d-flex justify-content-between">
                    <Card.Title>{product.name}</Card.Title>
                    <h5>{parseFloat(product.price).toFixed(2)} TL</h5>
                  </div>
                  
                  <Card.Text>
                    {product.description}
                  </Card.Text>
                  
                  <div className="mt-3 mb-2">
                    <Badge bg="primary">{getCategoryName(product.category)}</Badge>
                    {' '}
                    <Badge bg={product.isAvailable ? 'success' : 'danger'}>
                      {product.isAvailable ? 'Satışta' : 'Tükenmiş'}
                    </Badge>
                  </div>
                  
                  <div className="d-flex justify-content-end">
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      // onClick={() => handleEdit(product._id)}
                    >
                      Düzenle
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Yeni Ürün Ekleme Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Yeni Ürün Ekle</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalError && <Alert variant="danger">{modalError}</Alert>}
          <Form onSubmit={handleCreateProduct}>
            <Form.Group className="mb-3">
              <Form.Label>Ürün Adı</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ürün adını girin"
                value={newProduct.name}
                onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Açıklama</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Ürün açıklaması girin"
                value={newProduct.description}
                onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Fiyat (TL)</Form.Label>
              <Form.Control
                type="number"
                min="0"
                step="0.01"
                value={newProduct.price}
                onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Kategori</Form.Label>
              <Form.Select
                value={newProduct.category}
                onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                required
              >
                {categories.length === 0 ? (
                  <option disabled>Kategori bulunamadı</option>
                ) : (
                  categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))
                )}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Stok Miktarı</Form.Label>
              <Form.Control
                type="number"
                min="0"
                value={newProduct.stockAmount}
                onChange={(e) => setNewProduct({...newProduct, stockAmount: e.target.value})}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Satışta"
                checked={newProduct.isAvailable}
                onChange={(e) => setNewProduct({...newProduct, isAvailable: e.target.checked})}
              />
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
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

export default ProductsPage; 