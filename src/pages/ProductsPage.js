import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form, Alert, Badge, Spinner, Nav } from 'react-bootstrap';
import { productService, categoryService } from '../services/api';

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalError, setModalError] = useState('');
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editProduct, setEditProduct] = useState({
    _id: '',
    name: '',
    description: '',
    price: 0,
    category: '',
    stockAmount: 0,
    isAvailable: true
  });
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: ''
  });
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
      setFilteredProducts(productsData); // Başlangıçta tüm ürünleri göster
      
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

  // Kategori değiştiğinde ürünleri filtrele
  useEffect(() => {
    if (selectedCategory === '') {
      setFilteredProducts(products); // Tüm ürünleri göster
      console.log('Tüm ürünler gösteriliyor:', products);
    } else {
      const filtered = products.filter(product => product.category === selectedCategory);
      console.log(`"${selectedCategory}" kategorisindeki ürünler:`, filtered);
      setFilteredProducts(filtered);
    }
  }, [selectedCategory, products]);

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

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    
    if (!newCategory.name) {
      setModalError('Kategori adı zorunludur');
      return;
    }
    
    try {
      setModalError('');
      console.log('Kategori oluşturuluyor:', newCategory);
      
      const categoryData = {
        name: newCategory.name,
        description: newCategory.description || ''
      };
      
      await categoryService.createCategory(categoryData);
      
      // Modal'ı kapat ve formu sıfırla
      setShowCategoryModal(false);
      setNewCategory({
        name: '',
        description: ''
      });
      
      // Kategorileri yeniden yükle
      fetchProducts();
    } catch (error) {
      console.error('Kategori oluşturma hatası:', error);
      setModalError('Kategori oluştururken bir hata oluştu: ' + (error.response?.data?.message || 'Bilinmeyen hata'));
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat._id === categoryId);
    return category ? category.name : 'Kategorisiz';
  };

  const handleEditProduct = (product) => {
    setEditProduct({
      _id: product._id,
      name: product.name,
      description: product.description || '',
      price: product.price,
      category: product.category,
      stockAmount: product.stockQuantity || product.stockAmount || 0,
      isAvailable: product.isAvailable !== undefined ? product.isAvailable : true
    });
    setShowEditModal(true);
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    
    if (!editProduct.name || !editProduct.price) {
      setModalError('Ürün adı ve fiyatı zorunludur');
      return;
    }
    
    try {
      setModalError('');
      console.log('Ürün güncelleniyor:', editProduct);
      
      // API'ye gönderilecek veriyi hazırla
      const productData = {
        name: editProduct.name,
        description: editProduct.description || '',
        price: parseFloat(editProduct.price),
        category: editProduct.category,
        stockAmount: parseInt(editProduct.stockAmount) || 0,
        isAvailable: editProduct.isAvailable
      };
      
      await productService.updateProduct(editProduct._id, productData);
      
      // Modal'ı kapat
      setShowEditModal(false);
      
      // Ürünleri yeniden yükle
      fetchProducts();
    } catch (error) {
      console.error('Ürün güncelleme hatası:', error);
      setModalError('Ürün güncellenirken bir hata oluştu: ' + (error.response?.data?.message || 'Bilinmeyen hata'));
    }
  };

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Ürünler</h2>
        <div>
          <Button variant="outline-success" className="me-2" onClick={() => setShowCategoryModal(true)}>
            Yeni Kategori Ekle
          </Button>
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            Yeni Ürün Ekle
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="danger" className="d-flex justify-content-between align-items-center">
          <div>{error}</div>
          <Button variant="outline-danger" size="sm" onClick={fetchProducts}>
            Tekrar Dene
          </Button>
        </Alert>
      )}

      {/* Kategori filtre navigasyonu */}
      <Nav variant="tabs" className="mb-4">
        <Nav.Item>
          <Nav.Link 
            active={selectedCategory === ''} 
            onClick={() => setSelectedCategory('')}
          >
            Tüm Ürünler
          </Nav.Link>
        </Nav.Item>
        {categories.map(category => (
          <Nav.Item key={category._id}>
            <Nav.Link 
              active={selectedCategory === category._id}
              onClick={() => setSelectedCategory(category._id)}
            >
              {category.name}
            </Nav.Link>
          </Nav.Item>
        ))}
      </Nav>

      {loading ? (
        <div className="text-center p-5">
          <Spinner animation="border" role="status" />
          <p className="mt-2">Ürünler yükleniyor...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <Alert variant="info">
          {selectedCategory ? 'Bu kategoride ürün bulunmuyor.' : 'Henüz hiç ürün bulunmuyor.'} 
          Yeni bir ürün eklemek için "Yeni Ürün Ekle" butonunu kullanın.
        </Alert>
      ) : (
        <Row>
          {filteredProducts.map((product) => (
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
                      onClick={() => handleEditProduct(product)}
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

      {/* Yeni Kategori Ekleme Modal */}
      <Modal show={showCategoryModal} onHide={() => setShowCategoryModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Yeni Kategori Ekle</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalError && <Alert variant="danger">{modalError}</Alert>}
          <Form onSubmit={handleCreateCategory}>
            <Form.Group className="mb-3">
              <Form.Label>Kategori Adı</Form.Label>
              <Form.Control
                type="text"
                placeholder="Kategori adını girin"
                value={newCategory.name}
                onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Açıklama</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Kategori açıklaması girin"
                value={newCategory.description}
                onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
              />
            </Form.Group>

            <div className="d-flex justify-content-end">
              <Button variant="secondary" className="me-2" onClick={() => setShowCategoryModal(false)}>
                İptal
              </Button>
              <Button variant="success" type="submit">
                Kategori Oluştur
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Ürün Düzenleme Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Ürün Düzenle</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalError && <Alert variant="danger">{modalError}</Alert>}
          <Form onSubmit={handleUpdateProduct}>
            <Form.Group className="mb-3">
              <Form.Label>Ürün Adı</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ürün adını girin"
                value={editProduct.name}
                onChange={(e) => setEditProduct({...editProduct, name: e.target.value})}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Açıklama</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Ürün açıklaması girin"
                value={editProduct.description}
                onChange={(e) => setEditProduct({...editProduct, description: e.target.value})}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Fiyat (TL)</Form.Label>
              <Form.Control
                type="number"
                min="0"
                step="0.01"
                value={editProduct.price}
                onChange={(e) => setEditProduct({...editProduct, price: e.target.value})}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Kategori</Form.Label>
              <Form.Select
                value={editProduct.category}
                onChange={(e) => setEditProduct({...editProduct, category: e.target.value})}
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
                value={editProduct.stockAmount}
                onChange={(e) => setEditProduct({...editProduct, stockAmount: e.target.value})}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Satışta"
                checked={editProduct.isAvailable}
                onChange={(e) => setEditProduct({...editProduct, isAvailable: e.target.checked})}
              />
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                İptal
              </Button>
              <Button variant="success" type="submit">
                Güncelle
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default ProductsPage; 