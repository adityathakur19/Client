import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ListFilter, Calendar, IndianRupee, Users, Smartphone, PersonStanding } from 'lucide-react';

const BillHistory = () => {
  const { token } = useAuth();
  const [bills, setBills] = useState([]);
  const [stats, setStats] = useState({
    totalAmount: 0,
    averageAmount: 0,
    totalOrders: 0
  });
  const [selectedFilter, setSelectedFilter] = useState('7days');
  const [orderTypeFilter, setOrderTypeFilter] = useState('all');
  const [currentTime, setCurrentTime] = useState(new Date());

  const filterButtons = [
    { value: 'today', label: 'Today', icon: Calendar },
    { value: '7days', label: '7 Days', icon: Calendar },
    { value: '30days', label: '30 Days', icon: Calendar },
    { value: '3months', label: '3 Months', icon: Calendar },
    { value: 'all', label: 'All Time', icon: Calendar }
  ];

  const orderTypeButtons = [
    { value: 'all', label: 'All Orders', icon: Users },
    { value: 'saved', label: 'App Orders', icon: Smartphone },
    { value: 'walkin', label: 'Walk-in Orders', icon: PersonStanding }
  ];

  const getFilterDates = useCallback(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch(selectedFilter) {
      case 'today':
        return {
          start: new Date(today),
          end: new Date(now)
        };
      case '7days':
        return {
          start: new Date(today.setDate(today.getDate() - 7)),
          end: new Date(now)
        };
      case '30days':
        return {
          start: new Date(today.setDate(today.getDate() - 30)),
          end: new Date(now)
        };
      case '3months':
        return {
          start: new Date(today.setMonth(today.getMonth() - 3)),
          end: new Date(now)
        };
      case 'all':
        return {
          start: new Date(2000, 0, 1),
          end: new Date(now)
        };
      default:
        return {
          start: new Date(today.setDate(today.getDate() - 7)),
          end: new Date(now)
        };
    }
  }, [selectedFilter]);

  const fetchBills = useCallback(async () => {
    try {
      const { start, end } = getFilterDates();
      
      // Fetch saved orders
      const savedOrdersResponse = await fetch(
        `http://localhost:5000/api/saved-orders?startDate=${start.toISOString()}&endDate=${end.toISOString()}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      const savedOrdersData = await savedOrdersResponse.json();

      // Fetch walk-in orders
      const walkinOrdersResponse = await fetch(
        `http://localhost:5000/api/walkin-orders?startDate=${start.toISOString()}&endDate=${end.toISOString()}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      const walkinOrdersData = await walkinOrdersResponse.json();

      // Combine and process the orders
      const combinedBills = [
        ...savedOrdersData.map(order => ({ 
          ...order, 
          type: 'saved',
          // For saved orders, keep existing table number display logic
          displayTable: order.tableNumber || `Table ${order.selectedTable}`
        })),
        ...walkinOrdersData.map(order => ({ 
          ...order, 
          type: 'walkin',
          // For walk-in orders, use the tableNumber field we added earlier
          displayTable: order.tableNumber ? `Table ${order.tableNumber}` : order.selectedTable
        }))
      ].sort((a, b) => new Date(b.createdAt || b.savedAt) - new Date(a.createdAt || a.savedAt));

      const filteredBills = orderTypeFilter === 'all' 
        ? combinedBills 
        : combinedBills.filter(bill => bill.type === orderTypeFilter);

      setBills(filteredBills);

      const totalAmount = filteredBills.reduce((sum, bill) => sum + bill.totalAmount, 0);
      setStats({
        totalAmount,
        averageAmount: totalAmount / filteredBills.length || 0,
        totalOrders: filteredBills.length
      });

    } catch (error) {
      console.error('Error fetching bills:', error);
    }
  }, [token, getFilterDates, orderTypeFilter]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    fetchBills();
    return () => clearInterval(timer);
  }, [fetchBills]);



  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-gray-500 text-sm font-medium">Total Orders</h3>
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-gray-500 text-sm font-medium">Total Revenue</h3>
              <IndianRupee className="w-5 h-5 text-green-500" />
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900">₹{stats.totalAmount.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-gray-500 text-sm font-medium">Average Order Value</h3>
              <Calendar className="w-5 h-5 text-purple-500" />
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900">₹{stats.averageAmount.toFixed(2)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            {/* Time Period Filter */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700">Time Period</h3>
              <div className="flex flex-wrap gap-2">
                {filterButtons.map(filter => {
                  const Icon = filter.icon;
                  return (
                    <button
                      key={filter.value}
                      onClick={() => setSelectedFilter(filter.value)}
                      className={`flex items-center px-3 py-1.5 text-sm rounded-lg font-medium transition-all ${
                        selectedFilter === filter.value
                          ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {filter.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Order Type Filter */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700">Order Type</h3>
              <div className="flex flex-wrap gap-2">
                {orderTypeButtons.map(type => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      onClick={() => setOrderTypeFilter(type.value)}
                      className={`flex items-center px-3 py-1.5 text-sm rounded-lg font-medium transition-all ${
                        orderTypeFilter === type.value
                          ? 'bg-purple-600 text-white shadow-lg transform scale-105'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {type.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Bills Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Bill History</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Table
                </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bills.map((bill) => (
                <tr key={bill.orderId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{bill.orderId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      bill.type === 'saved' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {bill.type === 'saved' ? 'App Order' : 'Walk-in'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {bill.displayTable}
                  </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs space-y-1">
                        {bill.items.map((item, index) => (
                          <div key={index}>
                            {item.name || item.itemName} × {item.quantity}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₹{bill.totalAmount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(bill.createdAt || bill.savedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {bills.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                      No bills found for the selected period
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillHistory;