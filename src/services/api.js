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
    return api.get('/api/product-categories');
  },
};

export default api; 