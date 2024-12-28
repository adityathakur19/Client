import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Printer } from 'lucide-react';

const GenerateBill = () => {
  const { orderId } = useParams();
  const { token } = useAuth();
  const [currentTime] = useState(new Date());
  const [order, setOrder] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Use the actual orderId from params
        const orderResponse = await fetch(`http://localhost:5000/api/saved-orders/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!orderResponse.ok) {
          throw new Error(`Failed to fetch order data: ${orderResponse.statusText}`);
        }
        
        const orderData = await orderResponse.json();
        
        // Verify the order data structure
        if (!orderData || !Array.isArray(orderData.items)) {
          throw new Error('Invalid order data structure');
        }
        
        setOrder(orderData);

        // Fetch restaurant settings
        const settingsResponse = await fetch('http://localhost:5000/api/settings', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!settingsResponse.ok) {
          throw new Error(`Failed to fetch settings data: ${settingsResponse.statusText}`);
        }
        
        const settingsData = await settingsResponse.json();
        setSettings(settingsData);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to load bill information');
        setLoading(false);
      }
    };

    if (token && orderId) {
      fetchData();
    }
  }, [orderId, token]);

  const calculateItemTotal = (price, quantity) => {
    return (price * quantity) || 0;
  };

  const calculateSubTotal = (items) => {
    if (!Array.isArray(items)) return 0;
    return items.reduce((total, item) => total + (calculateItemTotal(item.price, item.quantity)), 0);
  };

  const calculateTax = (subtotal) => {
    const SGST = (subtotal * 0.025) || 0; // 2.5%
    const CGST = (subtotal * 0.025) || 0; // 2.5%
    return { SGST, CGST };
  };

  const calculateGrandTotal = (subtotal) => {
    const { SGST, CGST } = calculateTax(subtotal);
    return subtotal + SGST + CGST;
  };

  const handlePrint = () => {
    window.print();
  };

  if (!token) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-500 text-center p-4">
          Please log in to access bill information
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-500 text-center p-4">{error}</div>
      </div>
    );
  }

  if (!order || !settings) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center p-4">No bill information found</div>
      </div>
    );
  }

  const subtotal = calculateSubTotal(order.items);
  const { SGST, CGST } = calculateTax(subtotal);
  const grandTotal = calculateGrandTotal(subtotal);

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white shadow-lg my-8">
      {/* Print Button - Hidden when printing */}
      <div className="print:hidden mb-6">
        <button
          onClick={handlePrint}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          <Printer className="mr-2" size={20} />
          Print Bill
        </button>
      </div>

      {/* Bill Content */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-2">{settings.restaurantName}</h1>
        <p className="text-gray-600">{settings.address}</p>
        <p className="text-gray-600">Phone: {settings.phoneNumber}</p>
        {settings.businessEmail && (
          <p className="text-gray-600">Email: {settings.businessEmail}</p>
        )}
        {settings.gstin && (
          <p className="text-gray-600">GSTIN: {settings.gstin}</p>
        )}
      </div>

      <div className="mb-6">
        <div className="flex justify-between text-sm">
          <div>
            <p>Bill No: #{order.orderId}</p>
            <p>Date: {currentTime.toLocaleDateString()}</p>
          </div>
          <div>
            <p>Table No: {order.selectedTable}</p>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full mb-6">
        <thead>
          <tr className="border-b-2 border-gray-300">
            <th className="text-left py-2">Item Name</th>
            <th className="text-center py-2">Qty</th>
            <th className="text-right py-2">Rate</th>
            <th className="text-right py-2">Total</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, index) => (
            <tr key={index} className="border-b border-gray-200">
              <td className="py-2">{item.name}</td>
              <td className="text-center py-2">{item.quantity}</td>
              <td className="text-right py-2">₹{item.price}</td>
              <td className="text-right py-2">
                ₹{calculateItemTotal(item.price, item.quantity)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Bill Summary */}
      <div className="border-t-2 border-gray-300 pt-4">
        <div className="flex justify-between mb-2">
          <span>Subtotal:</span>
          <span>₹{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span>SGST (2.5%):</span>
          <span>₹{SGST.toFixed(2)}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span>CGST (2.5%):</span>
          <span>₹{CGST.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-lg border-t border-gray-300 pt-2">
          <span>Grand Total:</span>
          <span>₹{grandTotal.toFixed(2)}</span>
        </div>
      </div>

      {/* Note */}
      <div className="text-center mt-8 text-gray-600">
        <p>{settings.note || 'Thank you for your visit!'}</p>
      </div>
    </div>
  );
};

export default GenerateBill;