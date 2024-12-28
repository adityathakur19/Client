

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Building2, 
  PenSquare, 
  Printer, 
  Download, 
} from 'lucide-react';
import axios from 'axios';

const Dashboard = () => {
  const { token } = useAuth();
  const [todayBills, setTodayBills] = useState([]);
  const [settings, setSettings] = useState(null);
  const [editingBill, setEditingBill] = useState(null);
  const [dateFilter, setDateFilter] = useState('today');
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    topSellingItems: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [dateFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchBills(),
        fetchSettings(),
        calculateAnalytics()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setSettings(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const calculateAnalytics = () => {
    const revenue = todayBills.reduce((sum, bill) => sum + bill.totalAmount, 0);
    const avgOrder = todayBills.length > 0 ? revenue / todayBills.length : 0;
    
    // Calculate top selling items
    const itemCounts = {};
    todayBills.forEach(bill => {
      bill.items.forEach(item => {
        const itemName = item.name || item.itemName;
        itemCounts[itemName] = (itemCounts[itemName] || 0) + item.quantity;
      });
    });

    const topItems = Object.entries(itemCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    setAnalytics({
      totalRevenue: revenue,
      totalOrders: todayBills.length,
      averageOrderValue: avgOrder,
      topSellingItems: topItems
    });
  };

  const getDateRange = () => {
    const today = new Date();
    const startDate = new Date(today);
    const endDate = new Date(today);

    switch (dateFilter) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        startDate.setDate(today.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(today.getMonth() - 1);
        break;
      default:
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
    }

    return { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
  };

  const fetchBills = async () => {
    try {
      const { startDate, endDate } = getDateRange();

      const [savedOrdersRes, walkinOrdersRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/saved-orders?start=${startDate}&end=${endDate}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get(`http://localhost:5000/api/walkin-orders?start=${startDate}&end=${endDate}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const processOrder = (order, type) => {
        const subtotal = order.items.reduce((sum, item) => 
          sum + (item.quantity * item.price), 0);
        const cgst = subtotal * 0.025;
        const sgst = subtotal * 0.025;
        return {
          ...order,
          type,
          subtotal: subtotal || 0,
          cgst: cgst || 0,
          sgst: sgst || 0,
          totalAmount: subtotal + cgst + sgst || 0
        };
      };

      const savedOrders = savedOrdersRes.data.map(order => processOrder(order, 'saved'));
      const walkinOrders = walkinOrdersRes.data.map(order => processOrder(order, 'walkin'));
      const allOrders = [...savedOrders, ...walkinOrders]
        .sort((a, b) => new Date(b.createdAt || b.savedAt) - new Date(a.createdAt || a.savedAt));

      setTodayBills(allOrders);
    } catch (error) {
      console.error('Error fetching bills:', error);
    }
  };

  const handlePrint = (bill) => {
    // Implement print functionality
    window.print();
  };

  const handleExport = () => {
    const csv = convertToCSV(todayBills);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bills-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const convertToCSV = (bills) => {
    const headers = ['Order ID', 'Type', 'Table', 'Time', 'Subtotal', 'GST', 'Total'];
    const rows = bills.map(bill => [
      bill.orderId,
      bill.type,
      bill.selectedTable || 'N/A',
      formatTime(bill.createdAt || bill.savedAt),
      bill.subtotal,
      bill.cgst + bill.sgst,
      bill.totalAmount
    ]);
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const formatCurrency = (value) => {
    const number = parseFloat(value);
    return isNaN(number) ? '₹0.00' : `₹${number.toFixed(2)}`;
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  const handleEditBill = async (bill) => {
    try {
      const endpoint = bill.type === 'saved' 
        ? `http://localhost:5000/api/saved-orders/${bill._id}`
        : `http://localhost:5000/api/walkin-orders/${bill._id}`;
  
      const response = await axios.put(endpoint, editingBill, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
  
      if (response.status === 200) {
        setEditingBill(null);
      }
    } catch (error) {
      console.error('Error updating bill:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-[1920px] mx-auto p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {settings?.logoUrl ? (
                <img 
                  src={settings.logoUrl} 
                  alt="Restaurant Logo" 
                  className="w-16 h-16 object-contain rounded-lg"
                />
              ) : (
                <Building2 className="w-16 h-16 text-gray-400" />
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  {settings?.restaurantName || 'Restaurant Dashboard'}
                </h1>
                <h1 className="text-xl text-gray-600">{settings?.businessEmail || 'email'}</h1>
                <h1 className="text-lg text-gray-600">{settings?.location || 'Location'}</h1>
              </div>
            </div>
            <div className="flex flex-col items-start gap-3">
  <div className="flex gap-3 items-center">
    <select
      value={dateFilter}
      onChange={(e) => setDateFilter(e.target.value)}
      className="px-4 py-2 border rounded-lg bg-white"
    >
      <option value="today">Today</option>
      <option value="week">Last 7 Days</option>
      <option value="month">Last 30 Days</option>
    </select>
    <button
      onClick={handleExport}
      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
    >
      <Download className="w-5 h-5" />
      Export
    </button>
  </div>
  <p className="text-gray-600">
    {dateFilter === 'today' ? "Today's" : dateFilter === 'week' ? 'This Week\'s' : 'This Month\'s'} Overview
  </p>
</div>

          </div>
        </div>
      </div>
      

      {/* Analytics Cards */}

        {/* Bills Table */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Recent Orders</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4 text-left text-gray-600 font-medium border-b">Type</th>
                  <th className="p-4 text-left text-gray-600 font-medium border-b">Order ID</th>
                  <th className="p-4 text-left text-gray-600 font-medium border-b">Table</th>
                  <th className="p-4 text-left text-gray-600 font-medium border-b">Time</th>
                  <th className="p-4 text-left text-gray-600 font-medium border-b">Items</th>
                  <th className="p-4 text-right text-gray-600 font-medium border-b">Subtotal</th>
                  <th className="p-4 text-right text-gray-600 font-medium border-b">GST</th>
                  <th className="p-4 text-right text-gray-600 font-medium border-b">Total</th>
                  <th className="p-4 text-center text-gray-600 font-medium border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {todayBills.map((bill) => (
                  <tr key={bill._id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 border-b">
                      <span className={`px-2 py-1 rounded-full text-sm ${
                        bill.type === 'saved' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {bill.type}
                      </span>
                    </td>
                    <td className="p-4 border-b">{bill.orderId}</td>
                    <td className="p-4 border-b">{bill.selectedTable || 'N/A'}</td>
                    <td className="p-4 border-b">{formatTime(bill.createdAt || bill.savedAt)}</td>
                    <td className="p-4 border-b">
                      <div className="max-h-24 overflow-y-auto">
                        {bill.items.map((item, idx) => (
                          <div key={idx} className="text-sm text-gray-600">
                            {item.quantity}x {item.name || item.itemName}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 border-b text-right">{formatCurrency(bill.subtotal)}</td>
                    <td className="p-4 border-b text-right">
                      {formatCurrency(bill.cgst + bill.sgst)}
                    </td>
                    <td className="p-4 border-b text-right font-medium">
                      {formatCurrency(bill.totalAmount)}
                    </td>
                    <td className="p-4 border-b">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => setEditingBill(bill)}
                          className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                          title="Edit Bill"
                        >
                          {/* Continuing from where we left off */}
                          <PenSquare className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handlePrint(bill)}
                          className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
                          title="Print Bill"
                        >
                          <Printer className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {todayBills.length === 0 && (
                  <tr>
                    <td colSpan="9" className="p-8 text-center text-gray-500">
                      No bills found for the selected period
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      {/* Edit Bill Modal */}
      {editingBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Edit Bill #{editingBill.orderId}</h2>
              <button
                onClick={() => setEditingBill(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Table Number
                </label>
                <input
                  type="text"
                  value={editingBill.selectedTable || ''}
                  onChange={(e) => setEditingBill({
                    ...editingBill,
                    selectedTable: e.target.value
                  })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Items
                </label>
                <div className="space-y-2">
                  {editingBill.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => {
                          const newItems = [...editingBill.items];
                          newItems[index] = {
                            ...item,
                            quantity: parseInt(e.target.value) || 0
                          };
                          setEditingBill({
                            ...editingBill,
                            items: newItems
                          });
                        }}
                        className="w-20 p-2 border rounded-lg"
                        min="1"
                      />
                      <input
                        type="text"
                        value={item.name || item.itemName}
                        onChange={(e) => {
                          const newItems = [...editingBill.items];
                          newItems[index] = {
                            ...item,
                            name: e.target.value
                          };
                          setEditingBill({
                            ...editingBill,
                            items: newItems
                          });
                        }}
                        className="flex-1 p-2 border rounded-lg"
                      />
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => {
                          const newItems = [...editingBill.items];
                          newItems[index] = {
                            ...item,
                            price: parseFloat(e.target.value) || 0
                          };
                          setEditingBill({
                            ...editingBill,
                            items: newItems
                          });
                        }}
                        className="w-32 p-2 border rounded-lg"
                        step="0.01"
                      />
                      <button
                        onClick={() => {
                          const newItems = editingBill.items.filter((_, i) => i !== index);
                          setEditingBill({
                            ...editingBill,
                            items: newItems
                          });
                        }}
                        className="p-2 text-red-600 hover:text-red-800"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    setEditingBill({
                      ...editingBill,
                      items: [
                        ...editingBill.items,
                        { quantity: 1, name: '', price: 0 }
                      ]
                    });
                  }}
                  className="mt-2 text-blue-600 hover:text-blue-800"
                >
                  + Add Item
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => setEditingBill(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleEditBill(editingBill)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;