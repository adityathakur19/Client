  import React, { useState, useEffect, useCallback } from 'react';
  import { useAuth } from '../../context/AuthContext';
  import { TrendingUp, Wallet, Calendar, Trash2, Edit2, X } from 'lucide-react';

  const ExpenseTracker = () => {
    const { token } = useAuth();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [expenses, setExpenses] = useState([]);
    const [editingExpense, setEditingExpense] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteRange, setDeleteRange] = useState({
      startDate: '',
      endDate: ''
    });
    const [stats, setStats] = useState({
      totalExpenses: 0,
      avgExpense: 0,
      maxExpense: 0,
      count: 0
    });
    const [dropdownStates, setDropdownStates] = useState({
      item: false,
      status: false,
      payment: false
    });
    const [formData, setFormData] = useState({
      item: '',
      quantity: '',
      price: '',
      totalPrice: '',
      status: 'Unpaid',
      modeOfPayment: 'None'
    });

    const items = [
      'Chicken', 'Mutton', 'Boneless Chicken', 'Boneless Mutton',
      'Kashmiri Spices', 'Spices', 'Rice', 'Milk', 'Dry fruits',
      'Water', 'Cold Drink', 'Cab/Indrive', 'Petrol', 'Diesel',
      'Coal', 'Cylinder', 'Paneer', 'Curd', 'Vegetables',
      'Labour', 'Marketing', 'Packaging', 'Rent',
      'Electricity Bill', 'Salary'
    ];
    const [selectedFilter, setSelectedFilter] = useState('7days');
    
    const filterButtons = [
      { value: 'today', label: 'Today' },
      { value: 'yesterday', label: 'Yesterday' },
      { value: '7days', label: '7 Days'},
      { value: '30days', label: '30 Days' },
      { value: '3months', label: '3 Months'},
      { value: '6months', label: '6 Months'},
      { value: '1year', label: '1 Year'}
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
        case 'yesterday':
          return {
            start: new Date(today.setDate(today.getDate() - 1)),
            end: new Date(today.setHours(23, 59, 59, 999))
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
        case '6months':
          return {
            start: new Date(today.setMonth(today.getMonth() - 6)),
            end: new Date(now)
          };
        case '1year':
          return {
            start: new Date(today.setFullYear(today.getFullYear() - 1)),
            end: new Date(now)
          };
        default:
          return {
            start: new Date(today.setDate(today.getDate() - 7)),
            end: new Date(now)
          };
      }
    }, [selectedFilter]);

    const fetchStats = useCallback(async () => {
      try {
        const response = await fetch('http://localhost:5000/api/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    }, [token]);

    const fetchExpenses = useCallback(async () => {
      try {
        const { start, end } = getFilterDates();
        const response = await fetch(
          `http://localhost:5000/api/expenses?startDate=${start.toISOString()}&endDate=${end.toISOString()}`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
        const data = await response.json();
        setExpenses(data);
      } catch (error) {
        console.error('Error fetching expenses:', error);
      }
    }, [token, getFilterDates]);

    useEffect(() => {
      const timer = setInterval(() => setCurrentTime(new Date()), 1000);
      fetchExpenses();
      fetchStats();
      return () => clearInterval(timer);
    }, [fetchExpenses, fetchStats]);

    const handleInputChange = (field, value) => {
      setFormData(prev => {
        const newData = { ...prev, [field]: value };
        if ((field === 'quantity' || field === 'price') && newData.quantity && newData.price) {
          newData.totalPrice = (parseFloat(newData.quantity) * parseFloat(newData.price)).toFixed(2);
        }
        if (field === 'status') {
          newData.modeOfPayment = value === 'Unpaid' ? 'None' : prev.modeOfPayment;
        }
        return newData;
      });
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        const response = await fetch('http://localhost:5000/api/expenses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });
        
        if (response.ok) {
          fetchExpenses();
          fetchStats();
          setFormData({
            item: '',
            quantity: '',
            price: '',
            totalPrice: '',
            status: 'Unpaid',
            modeOfPayment: 'None'
          });
        }
      } catch (error) {
        console.error('Error adding expense:', error);
      }
    };
    // Add new functions for edit/delete
    const handleEdit = (expense) => {
      setEditingExpense(expense);
      setFormData({
        item: expense.item,
        quantity: expense.quantity,
        price: expense.price,
        totalPrice: expense.totalPrice,
        status: expense.status,
        modeOfPayment: expense.modeOfPayment
      });
    };

    const handleUpdate = async (e) => {
      e.preventDefault();
      try {
        const response = await fetch(`http://localhost:5000/api/expenses/${editingExpense._id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });
        
        if (response.ok) {
          fetchExpenses();
          fetchStats();
          setEditingExpense(null);
          setFormData({
            item: '',
            quantity: '',
            price: '',
            totalPrice: '',
            status: 'Unpaid',
            modeOfPayment: 'None'
          });
        }
      } catch (error) {
        console.error('Error updating expense:', error);
      }
    };

    const handleDelete = async (expenseId) => {
      if (!window.confirm('Are you sure you want to delete this expense?')) return;
      
      try {
        const response = await fetch(`http://localhost:5000/api/expenses/${expenseId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          fetchExpenses();
          fetchStats();
        }
      } catch (error) {
        console.error('Error deleting expense:', error);
      }
    };

    const handleDeleteRange = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/expenses-range', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(deleteRange)
        });
        
        if (response.ok) {
          const data = await response.json();
          alert(`Successfully deleted ${data.deletedCount} expense records`);
          fetchExpenses();
          fetchStats();
          setShowDeleteModal(false);
        }
      } catch (error) {
        console.error('Error deleting expenses:', error);
      }
    };

    const handleDeleteLastMonth = async () => {
      const today = new Date();
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
      
      setDeleteRange({
        startDate: lastMonth.toISOString().split('T')[0],
        endDate: lastMonthEnd.toISOString().split('T')[0]
      });
      setShowDeleteModal(true);
    };

    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
        <div className="max-w-[100rem] mx-auto space-y-6">
          {/* Stats Cards Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Date Card */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div className="text-white">
                  <p className="text-s opacity-1000">Current Date</p>
                  <p className="text-lg font-bold mt-0.5">{currentTime.toLocaleDateString()}</p>
                </div>
                <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
  
            {/* Total Expenses Card */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div className="text-white">
                  <p className="text-s opacity-1000">Total All Expenses</p>
                  <p className="text-lg font-bold mt-0.5">₹{stats.totalExpenses.toLocaleString()}</p>
                </div>
                <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                  <Wallet className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
  
            {/* Average Expense Card */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div className="text-white">
                  <p className="text-s opacity-1000">Average of All Expense</p>
                  <p className="text-lg font-bold mt-0.5">₹{stats.avgExpense.toFixed(2)}</p>
                </div>
                <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
  
            {/* Total Entries Card */}
            <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div className="text-white">
                  <p className="text-s opacity-1000">Total All Entries</p>
                  <p className="text-lg font-bold mt-0.5">{stats.count}</p>
                </div>
                <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          </div>
  
          {/* Main Content Area */}
          <div className="space-y-6">
            {/* Filter Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">Filter Period</h2>
              <div className="flex flex-wrap gap-2">
                {filterButtons.map(filter => (
                  <button
                    key={filter.value}
                    onClick={() => setSelectedFilter(filter.value)}
                    className={`flex items-center px-4 py-2 text-sm rounded-xl font-medium transition-all ${
                      selectedFilter === filter.value
                        ? 'bg-blue-600 text-white shadow-md transform scale-105'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
  
    
                {/* Expense Form */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold mb-6 text-gray-800">
                    {editingExpense ? 'Edit Expense' : 'Add New Expense'}
                  </h2>
                  <form onSubmit={editingExpense ? handleUpdate : handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Item</label>
                        <button
                          type="button"
                          className="w-full px-4 py-2.5 text-left bg-white border border-gray-300 rounded-xl hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onClick={() => setDropdownStates(prev => ({ ...prev, item: !prev.item }))}
                        >
                          {formData.item || "Select an item"}
                        </button>
                        {dropdownStates.item && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-auto">
                            {items.map((item) => (
                              <button
                                key={item}
                                type="button"
                                className="w-full px-4 py-2 text-left hover:bg-blue-50"
                                onClick={() => {
                                  handleInputChange('item', item);
                                  setDropdownStates(prev => ({ ...prev, item: false }));
                                }}
                              >
                                {item}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
    
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                        <input
                          type="number"
                          placeholder="Enter quantity"
                          value={formData.quantity}
                          onChange={(e) => handleInputChange('quantity', e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
    
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Price per unit</label>
                        <input
                          type="number"
                          placeholder="Enter price"
                          value={formData.price}
                          onChange={(e) => handleInputChange('price', e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
    
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Total Price</label>
                        <input
                          type="number"
                          placeholder="Total price"
                          value={formData.totalPrice}
                          readOnly
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl bg-gray-50"
                        />
                      </div>
    
                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <button
                          type="button"
                          className="w-full px-4 py-2.5 text-left bg-white border border-gray-300 rounded-xl hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onClick={() => setDropdownStates(prev => ({ ...prev, status: !prev.status }))}
                        >
                          {formData.status}
                        </button>
                        {dropdownStates.status && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg">
                            {['Paid', 'Unpaid'].map((status) => (
                              <button
                                key={status}
                                type="button"
                                className="w-full px-4 py-2 text-left hover:bg-blue-50"
                                onClick={() => {
                                  handleInputChange('status', status);
                                  setDropdownStates(prev => ({ ...prev, status: false }));
                                }}
                              >
                                {status}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
    
                      {formData.status === 'Paid' && (
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Payment Mode</label>
                          <button
                            type="button"
                            className="w-full px-4 py-2.5 text-left bg-white border border-gray-300 rounded-xl hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onClick={() => setDropdownStates(prev => ({ ...prev, payment: !prev.payment }))}
                          >
                            {formData.modeOfPayment || "Select payment mode"}
                          </button>
                          {dropdownStates.payment && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg">
                              {['Cash', 'UPI', 'Card'].map((mode) => (
                                <button
                                  key={mode}
                                  type="button"
                                  className="w-full px-4 py-2 text-left hover:bg-blue-50"
                                  onClick={() => {
                                    handleInputChange('modeOfPayment', mode);
                                    setDropdownStates(prev => ({ ...prev, payment: false }));
                                  }}
                                >
                                  {mode}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
    
                    <div className="flex gap-4 pt-4">
                      <button
                        type="submit"
                        className="flex-1 px-6 py-3 text-white bg-blue-600 rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-colors font-medium"
                      >
                        {editingExpense ? 'Update Expense' : 'Add Expense'}
                      </button>
                      {editingExpense && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingExpense(null);
                            setFormData({
                              item: '',
                              quantity: '',
                              price: '',
                              totalPrice: '',
                              status: 'Unpaid',
                              modeOfPayment: 'None'
                            });
                          }}
                          className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 focus:ring-4 focus:ring-gray-300 transition-colors font-medium"
                        >
                          Cancel Edit
                        </button>
                      )}
                    </div>
                  </form>
                </div>
    
            {/* Recent Transactions - Now full width */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="text-xl font-bold text-gray-800">Recent Expenses</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    Delete by Date Range
                  </button>
                  <button
                    onClick={handleDeleteLastMonth}
                    className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    Delete Last Month
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {expenses.map((expense) => (
                            <tr key={expense._id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{expense.item}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">{expense.quantity}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">₹{expense.price}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">₹{expense.totalPrice}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                                  expense.status === 'Paid' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {expense.status}
                                  {expense.modeOfPayment !== 'None' && ` (${expense.modeOfPayment})`}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">
                                  {new Date(expense.date).toLocaleDateString()}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => handleEdit(expense)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(expense._id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
    
                      {expenses.length === 0 && (
                        <div className="text-center py-12">
                          <p className="text-gray-500">No expenses found for the selected period</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
        </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex flex-col justify-between items-start mb-6">
              <div className="flex justify-between items-center w-full">
                <h3 className="text-xl font-bold text-red-600">
                  Delete Expenses by Date Range
                </h3>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-gray-500 hover:text-gray-700 p-1"
                  aria-label="Close"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <p className="text-sm text-yellow-800">
                  ⚠️ <strong>Warning:</strong> This action cannot be undone.
                  Selected expenses will be permanently deleted.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={deleteRange.startDate}
                  onChange={(e) => setDeleteRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={deleteRange.endDate}
                  onChange={(e) => setDeleteRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="pt-4 space-y-3">
                <button
                  onClick={handleDeleteRange}
                  className="w-full px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
                >
                  Delete Expenses
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseTracker;