import React, { useState, useEffect } from 'react';
import { Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GenerateBillPage = () => {
  const [order, setOrder] = useState(null);
  const [printMode, setPrintMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedOrder = localStorage.getItem('selectedOrder');
    if (storedOrder) {
      setOrder(JSON.parse(storedOrder));
    } else {
      navigate('/');
    }
  }, [navigate]);



  // Calculation functions
  const calculateItemTotal = (item) => {
    return item.price * item.quantity;
  };

  const calculateSubTotal = () => {
    return order?.items.reduce((total, item) => total + calculateItemTotal(item), 0) || 0;
  };

  const calculateTax = () => {
    const subTotal = calculateSubTotal();
    const cgst = subTotal * 0.025; // 2.5% CGST
    const sgst = subTotal * 0.025; // 2.5% SGST
    return cgst + sgst;
  };

  const calculateGrandTotal = () => {
    const subTotal = calculateSubTotal();
    const tax = calculateTax();
    return subTotal + tax;
  };

  const handlePrint = () => {
    setPrintMode(true);
    setTimeout(() => {
      window.print();
      setPrintMode(false);
    }, 100);
  };




  if (!order) {
    return <div>Loading...</div>;
  }

  return (
    <div className={`container mx-auto p-6 ${printMode ? 'print-mode' : ''}`}>
      <div className="w-full max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Bill Actions */}
        {!printMode && (
          <div className="flex justify-end p-4 bg-gray-100 space-x-4">
            <button 
              onClick={handlePrint}
              className="flex items-center bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              <Printer className="mr-2" size={20} /> Print
            </button>
          </div>
        )}

        {/* Bill Content */}
        <div className="p-6">
          {/* Business Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">TEST RESTAURANT</h1>
            <p className="text-gray-600">Tax Invoice</p>
          </div>

          {/* Customer and Invoice Details */}
          <div className="flex justify-between mb-6">
            <div>
              <h2 className="font-semibold">Bill To:</h2>
              <p>Table: {order.selectedTable}</p>
            </div>
            <div className="text-right">
            <p><strong>Order No:</strong> {order.orderId}</p>
            <p><strong>Date:</strong> {new Date(order.createdAt?.$date || order.createdAt).toLocaleString()}</p>
            </div>
          </div>
          {/* Item Details */}
          <div className="mb-6">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left">Item</th>
                  <th className="p-2 text-right">Quantity</th>
                  <th className="p-2 text-right">Rate</th>
                  <th className="p-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2">{item.name}</td>
                    <td className="p-2 text-right">{item.quantity}</td>
                    <td className="p-2 text-right">₹{item.price.toFixed(2)}</td>
                    <td className="p-2 text-right">₹{calculateItemTotal(item).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bill Summary */}
          <div className="w-full max-w-md ml-auto">
            <div className="flex justify-between mb-2">
              <span>Sub Total</span>
              <span>₹{calculateSubTotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>CGST (2.5%) + SGST (2.5%)</span>
              <span>₹{calculateTax().toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Grand Total</span>
              <span>₹{calculateGrandTotal().toFixed(2)}</span>
            </div>
          </div>

          {/* Bill Footer */}
          <div className="text-center mt-6 text-sm text-gray-600">
            <p>Thank you for your business!</p>
            <p>No exchange or refund</p>
          </div>
        </div>
      </div>

      {/* Print-specific styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-mode, .print-mode * {
            visibility: visible;
          }
          .print-mode {
            position: absolute;
            left: 50%;
            top: 0;
            transform: translateX(-50%);
            width: 100%;
            max-width: 300px;
            padding: 10px;
            box-sizing: border-box;
            font-size: 10px;
          }
          .print-mode .text-2xl {
            font-size: 16px;
          }
          .print-mode table {
            font-size: 9px;
          }
          .print-mode .text-lg {
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default GenerateBillPage;