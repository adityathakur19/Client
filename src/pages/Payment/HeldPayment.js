import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Printer } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const HeldPayments = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [heldBills, setHeldBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingOrders, setSavingOrders] = useState({});
  const [savedOrderIds, setSavedOrderIds] = useState({});

  useEffect(() => {
    fetchHeldBills();
  }, [token]);

  const fetchHeldBills = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/held-bills', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setHeldBills(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch held bills');
      setLoading(false);
    }
  };

  const calculateSubTotal = (items) => {
    return items.reduce((total, item) => total + item.totalPrice, 0);
  };
  
  const calculateTaxes = (subTotal) => {
    const sgst = subTotal * 0.025;
    const cgst = subTotal * 0.025;
    return { sgst, cgst };
  };
  
  const handleSaveOrder = async (bill) => {
    if (savedOrderIds[bill._id]) {
      alert('This order has already been saved');
      return;
    }
  
    setSavingOrders(prev => ({ ...prev, [bill._id]: true }));
    try {
      const items = bill.items.map(item => ({
        itemName: item.itemName,
        quantity: parseInt(item.quantity),
        price: Number((item.totalPrice * item.quantity).toFixed(2)),
        totalPrice: Number(item.totalPrice.toFixed(2))
      }));
  
      const subTotal = Number(items.reduce((total, item) => total + item.totalPrice, 0).toFixed(2));
      const sgst = Number((subTotal * 0.025).toFixed(2));
      const cgst = Number((subTotal * 0.025).toFixed(2));
      const totalAmount = Number((subTotal + sgst + cgst).toFixed(2));
  
      const orderData = {
        orderId: bill.orderId,
        selectedTable: bill.tableNumber,
        items: items,
        subTotal: subTotal,
        sgst: sgst,
        cgst: cgst,
        totalAmount: totalAmount,
        orderStatus: 'pending'
      };
  
      const response = await axios.post(
        'http://localhost:5000/api/walkin-orders',
        orderData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      setSavedOrderIds(prev => ({
        ...prev,
        [bill._id]: response.data._id
      }));
      
      await axios.delete(`http://localhost:5000/api/held-bills/${bill.tableId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setHeldBills(prev => prev.filter(item => item._id !== bill._id));
      alert('Order saved successfully');
    } catch (error) {
      console.error('Failed to save order:', error);
      console.error('Error response:', error.response?.data);
      alert(error.response?.data?.message || 'Failed to save order');
    } finally {
      setSavingOrders(prev => ({ ...prev, [bill._id]: false }));
    }
  };
  

  const handlePrintKOT = async (bill) => {
    try {
      const kotData = {
        tableId: bill.tableId,
        items: bill.items,
        timestamp: new Date().toISOString(),
        orderType: 'dine-in'
      };
      
      await axios.post('http://localhost:5000/api/print-kot', kotData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      alert('KOT sent to printer');
    } catch (error) {
      console.error('Failed to print KOT:', error);
      alert('Failed to print KOT');
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
      <h1 className="text-3xl font-bold text-center mb-6">Held Bills</h1>
      
      <div className="overflow-x-auto">
        <table className="w-full bg-white rounded-lg shadow-md">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table No.</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sub Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SGST (2.5%)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CGST (2.5%)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {heldBills.map((bill) => {
              const subTotal = calculateSubTotal(bill.items);
              const { sgst, cgst } = calculateTaxes(subTotal);
              const total = subTotal + sgst + cgst;

              return (
                <tr key={bill._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {bill.tableNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {bill.orderId}
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-h-20 overflow-y-auto">
                      {bill.items.map((item, idx) => (
                        <div key={idx} className="text-sm">
                          {item.itemName} × {item.quantity} = ₹{item.totalPrice.toFixed(2)}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    ₹{subTotal.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    ₹{sgst.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    ₹{cgst.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-semibold">
                    ₹{total.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(bill.updatedAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handlePrintKOT(bill)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50"
                        disabled={savingOrders[bill._id]}
                      >
                        <Printer className="mr-2" size={16} />
                        Print KOT
                      </button>
                      <button
                        onClick={() => navigate(`/payment/${bill.tableId}`)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-500 hover:bg-green-600 disabled:opacity-50"
                        disabled={savingOrders[bill._id]}
                      >
                        <FileText className="mr-2" size={16} />
                        Generate Bill
                      </button>
                      <button
                        onClick={() => handleSaveOrder(bill)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50"
                        disabled={savingOrders[bill._id] || savedOrderIds[bill._id]}
                      >
                        {savingOrders[bill._id] ? (
                          <span>Saving...</span>
                        ) : savedOrderIds[bill._id] ? (
                          <span>Saved</span>
                        ) : (
                          <span>Save Order</span>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {heldBills.length === 0 && (
          <div className="text-center text-gray-500 mt-10">
            No held bills found
          </div>
        )}
      </div>
    </div>
  );
};

export default HeldPayments;