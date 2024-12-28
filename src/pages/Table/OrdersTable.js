import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FileText } from 'lucide-react';

const AcceptedOrders = () => {
  const [acceptedOrders, setAcceptedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAcceptedOrders();
  }, []);

  const fetchAcceptedOrders = async () => {
    try {
      const response = await axios.get('http://51.20.97.10/orders');
      const filteredOrders = response.data.orders.filter(
        order => order.orderStatus === 'accepted' || order.orderStatus === 'cooking' || order.orderStatus === 'ready'
      );
      setAcceptedOrders(filteredOrders);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch accepted orders:', error);
      setError('Could not load accepted orders');
      setLoading(false);
    }
  };

  const handleGenerateBill = (orderId) => {
    navigate(`/generate-bill/${orderId}`);
  };

  const calculateTotalPrice = (items) => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
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
      <div className="text-red-500 text-center p-4">
        {error}
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-center mb-6">Accepted Orders</h1>
      
      <div className="grid gap-6">
        {acceptedOrders.map((order) => (
          <div key={order._id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold">Order #{order.orderId}</h2>
                <p className="text-gray-500 text-sm">
                  Table: {order.selectedTable} | Date: {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span className="px-4 py-2 rounded-full text-sm font-semibold" style={{
                backgroundColor: order.orderStatus === 'cooking' ? '#FEF3C7' : 
                               order.orderStatus === 'ready' ? '#D1FAE5' : '#E0E7FF',
                color: order.orderStatus === 'cooking' ? '#92400E' :
                       order.orderStatus === 'ready' ? '#065F46' : '#3730A3'
              }}>
                {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <h3 className="font-semibold">Items:</h3>
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center px-4 py-2 bg-gray-50 rounded">
                  <span>{item.name}</span>
                  <span className="text-gray-600">Qty: {item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center border-t pt-4">
              <div className="text-lg font-semibold">
                Total: ₹{calculateTotalPrice(order.items)}
              </div>
              <button
                onClick={() => handleGenerateBill(order._id)}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition flex items-center"
              >
                <FileText className="mr-2" size={20} />
                Generate Bill
              </button>
            </div>
          </div>
        ))}

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