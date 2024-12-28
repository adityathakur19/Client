import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CreditCard, IndianRupee, Printer } from 'lucide-react';

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { orderId, tableNumber, items, total } = location.state || {};

  const [paymentMethod, setPaymentMethod] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!orderId || !tableNumber || !items || !total) {
    return <div className="text-center text-red-600 mt-10">Invalid payment session. Please create a new order.</div>;
  }

  const handlePrint = async () => {
    try {
      // Create bill in the database first, include orderId in the body
      const response = await fetch('http://localhost:5000/api/bills', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId, // Add the orderId here
          tableNumber,
          items
        }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to create bill');
      }
  
      // Get the bill with settings after creating it
      const billResponse = await fetch(`http://localhost:5000/api/bills/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const { bill, settings } = await billResponse.json();
  
      const printContent = `
        <div style="width: 58mm; font-family: 'Courier New', monospace; font-size: 12px;">
          <div style="text-align: center; margin-bottom: 10px;">
            <strong style="font-size: 14px;">${settings.restaurantName}</strong><br/>
            ${settings.gstin ? `GSTIN: ${settings.gstin}<br/>` : ''}
            ${settings.businessEmail ? `Email: ${settings.businessEmail}<br/>` : ''}
            Tel: ${settings.phoneNumber}<br/>
            Bill No: ${orderId}<br/>
            Table: ${tableNumber}<br/>
            Date: ${new Date().toLocaleString()}<br/>
          </div>
          
          <div style="border-top: 1px dashed black; border-bottom: 1px dashed black; padding: 5px 0;">
            <table style="width: 100%;">
              <tr style="font-size: 11px;">
                <th style="text-align: left;">Item</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Amt</th>
              </tr>
              ${bill.items.map(item => `
                <tr>
                  <td style="text-align: left;">${item.itemName}</td>
                  <td style="text-align: center;">${item.quantity}</td>
                  <td style="text-align: right;">${item.ratePerUnit.toFixed(2)}</td>
                  <td style="text-align: right;">${item.totalPrice.toFixed(2)}</td>
                </tr>
              `).join('')}
            </table>
          </div>
          
          <div style="margin-top: 10px;">
            <div style="display: flex; justify-content: space-between;">
              <span>Sub Total:</span>
              <span>₹${bill.subTotal.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>SGST (2.5%):</span>
              <span>₹${(bill.totalGst/2).toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>CGST (2.5%):</span>
              <span>₹${(bill.totalGst/2).toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-weight: bold; margin-top: 5px;">
              <span>Grand Total:</span>
              <span>₹${bill.grandTotal.toFixed(2)}</span>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 15px;">
            ${settings.note}<br/>
            Thank you!
          </div>
        </div>
      `;
  
      const printWindow = window.open('', '', 'width=300,height=600');
      printWindow.document.write(`
        <html>
          <head>
            <title>Bill - ${orderId}</title>
          </head>
          <body>
            ${printContent}
            <script>
              window.onload = function() {
                window.print();
                window.onafterprint = function() {
                  window.close();
                }
              }
            </script>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Print error:', error);
      setError('Failed to print bill');
    }
  };
  



  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        {error && (
          <div className="mb-4 p-4 text-red-800 bg-red-100 rounded-md">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Order Details</h2>
          <div className="space-y-2 mb-6">
            <p>Order ID: {orderId}</p>
            <p>Table: {tableNumber}</p>
          </div>

          <div className="space-y-4 mb-6">
            {items.map((item) => (
              <div key={item._id} className="flex justify-between">
                <div>
                  <p className="font-medium">{item.itemName}</p>
                  <p className="text-sm text-gray-500">₹{item.sellPrice} x {item.quantity}</p>
                </div>
                <p className="font-medium">₹{item.sellPrice * item.quantity}</p>
              </div>
            ))}
          </div>

          <div className="border-t pt-4 mb-6">
            <div className="flex justify-between">
              <span className="font-bold">Total</span>
              <span className="font-bold">₹{total}</span>
            </div>
          </div>

       

          <h3 className="font-bold mb-4">Select Payment Method</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => setPaymentMethod('cash')}
              className={`p-4 rounded-lg flex items-center gap-2 border ${
                paymentMethod === 'cash' ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              } hover:shadow`}
            >
              <IndianRupee className="w-5 h-5" />
              Cash
            </button>
            <button
              onClick={() => setPaymentMethod('card')}
              className={`p-4 rounded-lg flex items-center gap-2 border ${
                paymentMethod === 'card' ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              } hover:shadow`}
            >
              <CreditCard className="w-5 h-5" />
              Card
            </button>
          </div>
          <button
            onClick={handlePrint}
            className="w-full mb-4 flex items-center justify-center gap-2 py-3 rounded-lg text-white bg-blue-600 hover:bg-blue-700"
          >
            <Printer className="w-5 h-5" />
            Save Bill
          </button> 
        </div>
      </div>
    </div>
  );
};

export default Payment;