import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FileText, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AcceptedOrders = () => {
  const { token } = useAuth();
  const [acceptedOrders, setAcceptedOrders] = useState([]);
  const [savedOrderIds, setSavedOrderIds] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingOrders, setSavingOrders] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const initializeData = async () => {
      await Promise.all([
        fetchAcceptedOrders(),
        fetchSavedOrders()
      ]);
    };
    initializeData();
  }, [token]);

  const fetchAcceptedOrders = async () => {
    try {
      const response = await axios.get('http://51.20.97.10/orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const filteredOrders = response.data.orders
        .filter(order => 
          order.orderStatus === 'accepted' || 
          order.orderStatus === 'cooking' || 
          order.orderStatus === 'ready'
        )
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setAcceptedOrders(filteredOrders);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch accepted orders:', error);
      setError('Could not load accepted orders');
      setLoading(false);
    }
  };

  const fetchSavedOrders = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/saved-orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const savedMap = {};
      response.data.forEach(savedOrder => {
        savedMap[savedOrder.orderId] = savedOrder._id;
      });
      setSavedOrderIds(savedMap);
    } catch (error) {
      console.error('Failed to fetch saved orders:', error);
    }
  };

  const calculateSubTotal = (items) => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateTaxes = (subtotal) => {
    const cgst = subtotal * 0.025; // 2.5% CGST
    const sgst = subtotal * 0.025; // 2.5% SGST
    return { cgst, sgst };
  };

  const calculateTotalPrice = (items) => {
    const subtotal = calculateSubTotal(items);
    const { cgst, sgst } = calculateTaxes(subtotal);
    return subtotal + cgst + sgst;
  };

  const handleGenerateBill = (order) => {
    if (!savedOrderIds[order.orderId]) {
      alert('Please save the order before generating a bill');
      return;
    }
    navigate(`/generate-bill/${savedOrderIds[order.orderId]}`);
  };

  const handleSaveOrder = async (order) => {
    if (savedOrderIds[order.orderId]) {
      alert('This order has already been saved');
      return;
    }

    const subtotal = calculateSubTotal(order.items);
    const { cgst, sgst } = calculateTaxes(subtotal);
    const totalWithTaxes = subtotal + cgst + sgst;

    setSavingOrders(prev => ({ ...prev, [order._id]: true }));
    try {
      const response = await axios.post('http://localhost:5000/api/saved-orders', {
        orderId: order.orderId,
        selectedTable: order.selectedTable,
        items: order.items,
        subtotal: subtotal,
        cgst: cgst,
        sgst: sgst,
        totalAmount: totalWithTaxes,
        orderStatus: order.orderStatus
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      setSavedOrderIds(prev => ({
        ...prev,
        [order.orderId]: response.data._id
      }));
      
      alert('Order saved successfully');
    } catch (error) {
      console.error('Failed to save order:', error);
      alert(error.response?.data?.message || 'Failed to save order');
    } finally {
      setSavingOrders(prev => ({ ...prev, [order._id]: false }));
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'cooking':
        return 'bg-amber-100 text-amber-800';
      case 'ready':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-indigo-100 text-indigo-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">{error}</div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-center mb-6">Accepted Orders</h1>
      
      <div className="overflow-x-auto">
        <table className="w-full bg-white rounded-lg shadow-md">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CGST (2.5%)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SGST (2.5%)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {acceptedOrders.map((order) => {
              const subtotal = calculateSubTotal(order.items);
              const { cgst, sgst } = calculateTaxes(subtotal);
              const total = subtotal + cgst + sgst;

              return (
                <tr key={order._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium">#{order.orderId}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {order.selectedTable}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(order.orderStatus)}`}>
                      {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-h-20 overflow-y-auto">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="text-sm">
                          {item.name} × {item.quantity}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    ₹{subtotal.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    ₹{cgst.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    ₹{sgst.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    ₹{total.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleGenerateBill(order)}
                        className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white 
                          ${savedOrderIds[order.orderId] 
                            ? 'bg-blue-500 hover:bg-blue-600' 
                            : 'bg-gray-300 cursor-not-allowed'}`}
                        disabled={!savedOrderIds[order.orderId]}
                      >
                        <FileText className="mr-2" size={16} />
                        Generate Bill
                      </button>
                      <button
                        onClick={() => handleSaveOrder(order)}
                        className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white 
                          ${savedOrderIds[order.orderId] 
                            ? 'bg-gray-300 cursor-not-allowed' 
                            : 'bg-green-500 hover:bg-green-600'}`}
                        disabled={savingOrders[order._id] || savedOrderIds[order.orderId]}
                      >
                        <Save className="mr-2" size={16} />
                        {savingOrders[order._id] ? 'Saving...' : 
                         savedOrderIds[order.orderId] ? 'Saved' : 'Save'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {acceptedOrders.length === 0 && (
          <div className="text-center text-gray-500 mt-10">
            No accepted orders found
          </div>
        )}
      </div>
    </div>
  );
};

export default AcceptedOrders;