import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PlusCircle, Edit2, Trash2, Image, X, Search } from 'lucide-react';

const ProductManager = () => {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('name');

  const categories = ['All', 'Veg', 'Non-Veg', 'Beverage', 'Starter', 'Dessert', 'Breads'];

  const [formData, setFormData] = useState({
    itemName: '',
    sellPrice: '',
    type: 'Veg',
    primaryUnit: '',
    customUnit: '',
    description: ''
  });

    useEffect(() => {
      fetchProducts();
    }, []);

    const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/products', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

    const handleInputChange = (field, value) => {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    };

    const handleImageChange = (e) => {
      const file = e.target.files[0];
      if (file) {
        setSelectedImage(file);
        setImagePreview(URL.createObjectURL(file));
      }
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      const formPayload = new FormData();
      
      Object.keys(formData).forEach(key => {
        formPayload.append(key, formData[key]);
      });
      
      if (selectedImage) {
        formPayload.append('image', selectedImage);
      }
    
      try {
        const url = editingProduct
          ? `http://localhost:5000/api/products/${editingProduct._id}`
          : 'http://localhost:5000/api/products';
        
        const method = editingProduct ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
          method,
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formPayload
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to save product');
        }
        
        await fetchProducts();
        resetForm();
      } catch (error) {
        console.error('Error saving product:', error);
        // Add error handling UI feedback here
      }
    };

    const handleDelete = async (productId) => {
      if (window.confirm('Are you sure you want to delete this product?')) {
        try {
          await fetch(`http://localhost:5000/api/products/${productId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          fetchProducts();
        } catch (error) {
          console.error('Error deleting product:', error);
        }
      }
    };

    const resetForm = () => {
      setFormData({
        itemName: '',
        sellPrice: '',
        type: 'Veg',
        primaryUnit: '',
        customUnit: '',
      });
      setSelectedImage(null);
      setImagePreview('');
      setEditingProduct(null);
      setIsFormOpen(false);
    };

    const handleEdit = (product) => {
      setFormData({
        itemName: product.itemName,
        sellPrice: product.sellPrice,
        type: product.type,
        primaryUnit: product.primaryUnit || '',
        customUnit: product.customUnit || '',
      });
      setImagePreview(product.imageUrl);
      setEditingProduct(product);
      setIsFormOpen(true);
    };

    const getTypeColor = (type) => {
      const colors = {
        'Veg': 'text-green-600 bg-green-50',
        'Non-Veg': 'text-red-600 bg-red-50',
        'Beverage': 'text-blue-600 bg-blue-50',
        'Starter': 'text-yellow-600 bg-yellow-50',
        'Dessert': 'text-purple-600 bg-purple-50',
        'Breads': 'text-orange-600 bg-orange-50'
      };
      return colors[type] || 'text-gray-600 bg-gray-50';
    };

    const sortProducts = (products) => {
      return [...products].sort((a, b) => {
        if (sortBy === 'name') return a.itemName.localeCompare(b.itemName);
        if (sortBy === 'price') return a.sellPrice - b.sellPrice;
        return 0;
      });
    };
  
    const filterProducts = (products) => {
      return products.filter(product => {
        const matchesSearch = product.itemName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || product.type === selectedCategory;
        return matchesSearch && matchesCategory;
      });
    };
  
    const filteredAndSortedProducts = sortProducts(filterProducts(products));

    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Compact Header Section */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6 border border-gray-100">
            <div className="p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Product Management
                  </h1>
                  <p className="mt-1 text-sm text-gray-600">Manage your restaurant's menu items with ease</p>
                </div>
                <button
                  onClick={() => setIsFormOpen(true)}
                  className="group inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  <PlusCircle className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform duration-200" />
                  Add New Item
                </button>
              </div>
    
              {/* Compact Search and Filter Section */}
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                  />
                </div>
                
                <div className="flex gap-3">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer text-sm"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer text-sm"
                  >
                    <option value="name">Sort by Name</option>
                    <option value="price">Sort by Price</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
    
          {/* Form Modal */}
          {isFormOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {editingProduct ? 'Edit Product' : 'Add New Product'}
                    </h2>
                    <button
                      onClick={resetForm}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
    
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Item Name</label>
                        <input
                          type="text"
                          value={formData.itemName}
                          onChange={(e) => handleInputChange('itemName', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
    
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Price (₹)</label>
                        <input
                          type="number"
                          value={formData.sellPrice}
                          onChange={(e) => handleInputChange('sellPrice', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
    
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Category</label>
                        <select
                          value={formData.type}
                          onChange={(e) => handleInputChange('type', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="Veg">Veg</option>
                          <option value="Non-Veg">Non-Veg</option>
                          <option value="Beverage">Beverage</option>
                          <option value="Starter">Starter</option>
                          <option value="Dessert">Dessert</option>
                          <option value="Breads">Breads</option>
                        </select>
                      </div>
    
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Primary Unit</label>
                        <input
                          type="text"
                          value={formData.primaryUnit}
                          onChange={(e) => handleInputChange('primaryUnit', e.target.value)}
                          placeholder="e.g., kg, piece"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
    
                      <div className="md:col-span-2">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Product Image</label>
                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <label
                                htmlFor="image-upload"
                                className="flex items-center justify-center px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors duration-200"
                              >
                                <Image className="w-5 h-5 mr-2 text-gray-400" />
                                <span className="text-gray-600">
                                  {imagePreview ? 'Change Image' : 'Upload Image'}
                                </span>
                              </label>
                              <input
                                type="file"
                                id="image-upload"
                                onChange={handleImageChange}
                                className="hidden"
                                accept="image/*"
                              />
                            </div>
                            {imagePreview && (
                              <div className="relative w-20 h-20">
                                <img
                                  src={imagePreview}
                                  alt="Preview"
                                  className="w-full h-full object-cover rounded-lg"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setImagePreview('');
                                    setSelectedImage(null);
                                  }}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
    
                    <div className="flex gap-4 justify-end pt-4 border-t">
                      <button
                        type="button"
                        onClick={resetForm}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                      >
                        {editingProduct ? 'Update Product' : 'Add Product'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
    
          {/* Products Grid - 4 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAndSortedProducts.length > 0 ? (
              filteredAndSortedProducts.map((product) => (
                <div
                  key={product._id}
                  className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 border border-gray-100"
                >
                  <div className="relative aspect-video">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.itemName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <Image className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(product.type)}`}>
                        {product.type}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-3">
                    <h3 className="font-semibold text-base text-gray-900 truncate">{product.itemName}</h3>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-lg font-bold text-blue-600">₹{product.sellPrice}</span>
                      {(product.primaryUnit || product.customUnit) && (
                        <span className="text-xs text-gray-500">
                          per {product.primaryUnit || product.customUnit}
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-3 flex justify-end gap-1">
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors duration-200"
                        title="Edit product"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product._id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors duration-200"
                        title="Delete product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-8 text-gray-500">
                <Image className="w-12 h-12 mb-3 text-gray-400" />
                <p className="text-base">No products found</p>
                <p className="text-sm">Try adjusting your search or add new products</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  export default ProductManager;