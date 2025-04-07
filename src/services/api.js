import axios from 'axios';

// API URL'imiz - API endpoint'i düzeltelim
const API_URL = 'https://multi-api-qsav.onrender.com';

// Axios instance oluşturma
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// İstek interceptor'ı - her istekte token eklemek için
api.interceptors.request.use(
  (config) => {
    // localStorage'dan token almak için doğrudan window.localStorage kullanın
    const token = window.localStorage.getItem('token');
    
    if (token) {
      // Authorization header'ına token ekleyin
      config.headers.Authorization = `Bearer ${token}`;
      console.log('İstek gönderiliyor, token:', token);
    } else {
      console.log('Token bulunamadı! İstek URL:', config.url);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - hataları yakalamak için
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Hatası:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

// Auth servisleri
export const authService = {
  login: async (email, password) => {
    try {
      const response = await api.post('/api/users/login', { email, password });
      return response;
    } catch (error) {
      console.error('Login hatası:', error);
      throw error;
    }
  },
  companyLogin: async (email, password) => {
    try {
      const response = await api.post('/api/companies/login', { email, password });
      return response;
    } catch (error) {
      console.error('Company login hatası:', error);
      throw error;
    }
  },
  registerCompany: async (companyData) => {
    return api.post('/api/companies/register', companyData);
  },
  registerUser: async (userData) => {
    return api.post('/api/users', userData);
  },
  getProfile: async () => {
    return api.get('/api/users/profile');
  },
  updateProfile: async (profileData) => {
    try {
      console.log('Profil güncelleme isteği gönderiliyor:', profileData);
      
      // Kullanıcı tipini localStorage'dan kontrol et
      const userInfo = localStorage.getItem('userInfo');
      let isCompany = false;
      
      if (userInfo) {
        const user = JSON.parse(userInfo);
        // Firma hesabı mı kontrol et (email firma email'i ise veya user object company bilgisi içermiyorsa)
        isCompany = !user.company;
      }
      
      // Kullanıcı veya firma için uygun endpoint'i kullan
      const endpoint = isCompany ? '/api/companies/profile' : '/api/users/profile';
      
      const response = await api.put(endpoint, profileData);
      console.log('Profil güncelleme yanıtı:', response.data);
      
      return response;
    } catch (error) {
      console.error('Profil güncelleme hatası:', error);
      throw error;
    }
  },
  changePassword: async (passwordData) => {
    try {
      // Bu işlem updateProfile ile birleştirildi, güvenlik için ayrı bir endpoint tercih edilebilir
      console.log('Şifre değiştirme isteği gönderiliyor');
      
      // Kullanıcı tipini localStorage'dan kontrol et
      const userInfo = localStorage.getItem('userInfo');
      let isCompany = false;
      
      if (userInfo) {
        const user = JSON.parse(userInfo);
        isCompany = !user.company;
      }
      
      // Kullanıcı veya firma için uygun endpoint'i kullan
      const endpoint = isCompany ? '/api/companies/profile' : '/api/users/profile';
      
      const response = await api.put(endpoint, passwordData);
      console.log('Şifre değiştirme yanıtı:', response.data);
      
      return response;
    } catch (error) {
      console.error('Şifre değiştirme hatası:', error);
      throw error;
    }
  }
};

// Masa servisleri
export const tableService = {
  getAllTables: async () => {
    try {
      const token = window.localStorage.getItem('token');
      if (!token) {
        throw new Error('Token bulunamadı');
      }
      
      const response = await api.get('/api/tables');
      return response;
    } catch (error) {
      console.error('Masa getirme hatası:', error);
      throw error;
    }
  },
  getTableById: async (id) => {
    return api.get(`/api/tables/${id}`);
  },
  createTable: async (tableData) => {
    try {
      console.log('Masa oluşturma isteği gönderiliyor:', tableData);
      const token = window.localStorage.getItem('token');
      if (!token) {
        throw new Error('Oturum bilgisi bulunamadı');
      }
      
      const response = await api.post('/api/tables', tableData);
      console.log('Masa oluşturma yanıtı:', response.data);
      return response;
    } catch (error) {
      console.error('Masa oluşturma hatası:', error);
      throw error;
    }
  },
  updateTable: async (id, tableData) => {
    return api.put(`/api/tables/${id}`, tableData);
  },
  updateTableStatus: async (id, status) => {
    return api.put(`/api/tables/${id}/status`, { status });
  },
  deleteTable: async (id) => {
    return api.delete(`/api/tables/${id}`);
  },
};

// Sipariş servisleri
export const orderService = {
  getAllOrders: async () => {
    try {
      console.log('Tüm siparişler getiriliyor...');
      const token = window.localStorage.getItem('token');
      if (!token) {
        throw new Error('Oturum bilgisi bulunamadı');
      }
      
      return await api.get('/api/orders');
    } catch (error) {
      console.error('Siparişleri getirme hatası:', error);
      throw error;
    }
  },
  getOrderById: async (id) => {
    return api.get(`/api/orders/${id}`);
  },
  createOrder: async (orderData) => {
    try {
      console.log('Sipariş isteği gönderiliyor:', orderData);
      const token = window.localStorage.getItem('token');
      if (!token) {
        throw new Error('Oturum bilgisi bulunamadı');
      }

      // Backend API'ın beklediği format:
      // { tableId: string, items: [{ productId: string, quantity: number, notes: string }] }
      const formattedData = {
        tableId: orderData.tableId || orderData.table, // Her iki format da desteklensin
        items: orderData.items.map(item => ({
          productId: item.productId || item.product, // Her iki format da desteklensin
          quantity: item.quantity,
          notes: item.notes || ''
        }))
      };
      
      console.log('Formatlanan sipariş verisi:', formattedData);
      
      // API endpoint'i ve veriyi kontrol et
      return await api.post('/api/orders', formattedData);
    } catch (error) {
      console.error('Sipariş oluşturma hatası:', error);
      throw error;
    }
  },
  updateOrderStatus: async (id, status) => {
    try {
      return await api.put(`/api/orders/${id}/status`, { status });
    } catch (error) {
      console.error('Sipariş durumu güncelleme hatası:', error);
      throw error;
    }
  },
  addItemToOrder: async (id, itemData) => {
    try {
      return await api.post(`/api/orders/${id}/items`, itemData);
    } catch (error) {
      console.error('Siparişe ürün ekleme hatası:', error);
      throw error;
    }
  },
  getActiveOrderByTable: async (tableId) => {
    try {
      console.log(`${tableId} ID'li masa için aktif sipariş getiriliyor`);
      return await api.get(`/api/orders/table/${tableId}/active`);
    } catch (error) {
      console.error('Masa bazlı sipariş getirme hatası:', error);
      throw error;
    }
  },
  updateOrder: async (id, orderData) => {
    try {
      console.log('Sipariş güncelleme isteği gönderiliyor:', id, orderData);
      const token = window.localStorage.getItem('token');
      if (!token) {
        throw new Error('Oturum bilgisi bulunamadı');
      }
      
      // Backend'de orders/:id PUT yok, bunun yerine addItem kullanabiliriz
      // Önce tüm eski ürünleri kaldıralım (bu endpoint yok ama API'nin iptal + yeni sipariş mantığıyla çalışabiliriz)
      try {
        // Siparişi iptal edip yeniden oluşturmak için önce durumunu güncelle
        await api.put(`/api/orders/${id}/status`, { status: 'cancelled' });
        
        // Sonra yeni bir sipariş oluştur
        const formattedData = {
          tableId: orderData.tableId,
          items: orderData.items.map(item => ({
            productId: item.productId || item.product,
            quantity: item.quantity,
            notes: item.notes || ''
          }))
        };
        
        return await api.post('/api/orders', formattedData);
      } catch (innerError) {
        console.error('Sipariş güncelleme iç hatası:', innerError);
        throw innerError;
      }
    } catch (error) {
      console.error('Sipariş güncelleme hatası:', error);
      throw error;
    }
  },
};

// Ürün servisleri
export const productService = {
  getAllProducts: async () => {
    try {
      console.log('Tüm ürünler getiriliyor...');
      const token = window.localStorage.getItem('token');
      if (!token) {
        throw new Error('Oturum bilgisi bulunamadı');
      }
      
      return await api.get('/api/products');
    } catch (error) {
      console.error('Ürünleri getirme hatası:', error);
      throw error;
    }
  },
  getProductById: async (id) => {
    return api.get(`/api/products/${id}`);
  },
  getProductsByCategory: async (categoryId) => {
    return api.get(`/api/products/category/${categoryId}`);
  },
  createProduct: async (productData) => {
    try {
      console.log('Ürün oluşturma isteği gönderiliyor:', productData);
      const token = window.localStorage.getItem('token');
      if (!token) {
        throw new Error('Oturum bilgisi bulunamadı');
      }
      
      const response = await api.post('/api/products', productData);
      console.log('Ürün oluşturma yanıtı:', response.data);
      return response;
    } catch (error) {
      console.error('Ürün oluşturma hatası:', error);
      throw error;
    }
  },
  updateProduct: async (id, productData) => {
    try {
      return await api.put(`/api/products/${id}`, productData);
    } catch (error) {
      console.error('Ürün güncelleme hatası:', error);
      throw error;
    }
  },
};

// Kategori servisleri
export const categoryService = {
  getAllCategories: async () => {
    try {
      console.log('Tüm kategoriler getiriliyor...');
      const token = window.localStorage.getItem('token');
      if (!token) {
        throw new Error('Oturum bilgisi bulunamadı');
      }
      
      return await api.get('/api/product-categories');
    } catch (error) {
      console.error('Kategorileri getirme hatası:', error);
      throw error;
    }
  },
  createCategory: async (categoryData) => {
    try {
      console.log('Kategori oluşturma isteği gönderiliyor:', categoryData);
      const token = window.localStorage.getItem('token');
      if (!token) {
        throw new Error('Oturum bilgisi bulunamadı');
      }
      
      const response = await api.post('/api/product-categories', categoryData);
      console.log('Kategori oluşturma yanıtı:', response.data);
      return response;
    } catch (error) {
      console.error('Kategori oluşturma hatası:', error);
      throw error;
    }
  },
  updateCategory: async (id, categoryData) => {
    try {
      return await api.put(`/api/product-categories/${id}`, categoryData);
    } catch (error) {
      console.error('Kategori güncelleme hatası:', error);
      throw error;
    }
  },
  deleteCategory: async (id) => {
    try {
      return await api.delete(`/api/product-categories/${id}`);
    } catch (error) {
      console.error('Kategori silme hatası:', error);
      throw error;
    }
  }
};

// Fatura servisleri
export const invoiceService = {
  getAllInvoices: async () => {
    try {
      console.log('Tüm faturalar getiriliyor...');
      const token = window.localStorage.getItem('token');
      if (!token) {
        throw new Error('Oturum bilgisi bulunamadı');
      }
      
      return await api.get('/api/invoices');
    } catch (error) {
      console.error('Faturaları getirme hatası:', error);
      throw error;
    }
  },
  getInvoiceById: async (id) => {
    try {
      return await api.get(`/api/invoices/${id}`);
    } catch (error) {
      console.error('Fatura detayı getirme hatası:', error);
      throw error;
    }
  },
  createInvoice: async (invoiceData) => {
    try {
      console.log('Fatura oluşturma isteği gönderiliyor:', invoiceData);
      const token = window.localStorage.getItem('token');
      if (!token) {
        throw new Error('Oturum bilgisi bulunamadı');
      }
      
      const response = await api.post('/api/invoices', invoiceData);
      console.log('Fatura oluşturma yanıtı:', response.data);
      return response;
    } catch (error) {
      console.error('Fatura oluşturma hatası:', error);
      throw error;
    }
  },
  updateInvoiceStatus: async (id, paymentStatus) => {
    try {
      return await api.put(`/api/invoices/${id}/status`, { paymentStatus });
    } catch (error) {
      console.error('Fatura durumu güncelleme hatası:', error);
      throw error;
    }
  }
};

// Ödeme servisleri
export const paymentService = {
  getAllPayments: async () => {
    try {
      console.log('Tüm ödemeler getiriliyor...');
      const token = window.localStorage.getItem('token');
      if (!token) {
        throw new Error('Oturum bilgisi bulunamadı');
      }
      
      return await api.get('/api/payments');
    } catch (error) {
      console.error('Ödemeleri getirme hatası:', error);
      throw error;
    }
  },
  getPaymentById: async (id) => {
    try {
      return await api.get(`/api/payments/${id}`);
    } catch (error) {
      console.error('Ödeme detayı getirme hatası:', error);
      throw error;
    }
  },
  createPayment: async (paymentData) => {
    try {
      console.log('Ödeme oluşturma isteği gönderiliyor:', paymentData);
      const token = window.localStorage.getItem('token');
      if (!token) {
        throw new Error('Oturum bilgisi bulunamadı');
      }
      
      const response = await api.post('/api/payments', paymentData);
      console.log('Ödeme oluşturma yanıtı:', response.data);
      return response;
    } catch (error) {
      console.error('Ödeme oluşturma hatası:', error);
      throw error;
    }
  },
  cancelPayment: async (id) => {
    try {
      return await api.put(`/api/payments/${id}/cancel`);
    } catch (error) {
      console.error('Ödeme iptal hatası:', error);
      throw error;
    }
  },
  getPaymentsByInvoice: async (invoiceId) => {
    try {
      return await api.get(`/api/payments/invoice/${invoiceId}`);
    } catch (error) {
      console.error('Fatura bazlı ödemeleri getirme hatası:', error);
      throw error;
    }
  }
};

export default api; 