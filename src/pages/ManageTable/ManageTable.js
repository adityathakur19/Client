import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PlusCircle, Trash2, RefreshCw, Search, Grid, List } from 'lucide-react';

const TableManager = () => {
  const { token } = useAuth();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState({ tableNumber: '' });
  const [bulkData, setBulkData] = useState({ baseNumber: '', quantity: '' });
  const [error, setError] = useState('');

  const filteredTables = tables
    .filter(table => {
      const matchesSearch = table.tableNumber.toString().includes(searchQuery);
      const matchesFilter = filterStatus === 'all' || table.status === filterStatus;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => a.tableNumber - b.tableNumber);

  const fetchTables = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5000/api/tables', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setTables(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tables:', error);
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/tables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        fetchTables();
        setFormData({ tableNumber: '' });
        setIsAddModalOpen(false);
        setError('');
      } else {
        const data = await response.json();
        setError(data.message);
      }
    } catch (error) {
      setError('Failed to add table');
    }
  };

  // Update bulk submit handler
  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/tables/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bulkData)
      });
      
      if (response.ok) {
        fetchTables();
        setBulkData({
          baseNumber: '',
          quantity: '',
        });
        setIsBulkModalOpen(false);
        setError('');
      } else {
        const data = await response.json();
        setError(data.message);
      }
    } catch (error) {
      setError('Failed to add tables. Please try again.');
    }
  };
  const handleBulkInputChange = (e) => {
    setBulkData({
      ...bulkData,
      [e.target.name]: e.target.value
    });
  };


  const handleStatusUpdate = async (tableId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/api/tables/${tableId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        fetchTables();
      }
    } catch (error) {
      console.error('Error updating table status:', error);
    }
  };

  const handleDelete = async (tableId) => {
    if (!window.confirm('Are you sure you want to delete this table?')) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/tables/${tableId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        fetchTables();
      }
    } catch (error) {
      console.error('Error deleting table:', error);
    }
  };


  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {filteredTables.map((table) => (
        <div
          key={table._id}
          className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group"
        >
          <div className={`p-6 ${
            table.status === 'Available' 
              ? 'bg-gradient-to-br from-green-50 to-emerald-50' 
              : 'bg-gradient-to-br from-red-50 to-rose-50'
          }`}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-bold text-gray-800">
                Table {table.tableNumber}
              </h3>
              <button
                onClick={() => handleDelete(table._id)}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-all p-2 hover:bg-white/50 rounded-xl"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between mt-6">
              <span className={`px-4 py-2 rounded-xl text-sm font-semibold ${
                table.status === 'Available'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {table.status}
              </span>
              <button
                onClick={() => handleStatusUpdate(
                  table._id,
                  table.status === 'Available' ? 'Occupied' : 'Available'
                )}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  table.status === 'Available'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {table.status === 'Available' ? 'Set Occupied' : 'Set Available'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table Number</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredTables.map((table) => (
            <tr key={table._id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm font-medium text-gray-900">Table {table.tableNumber}</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  table.status === 'Available' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {table.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end items-center space-x-3">
                  <button
                    onClick={() => handleStatusUpdate(
                      table._id,
                      table.status === 'Available' ? 'Occupied' : 'Available'
                    )}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      table.status === 'Available'
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {table.status === 'Available' ? 'Set Occupied' : 'Set Available'}
                  </button>
                  <button
                    onClick={() => handleDelete(table._id)}
                    className="text-gray-400 hover:text-red-600 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );


  
  const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl transform transition-all">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            >
              ×
            </button>
          </div>
          {children}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm mb-8 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h1 className="text-3xl font-bold text-gray-800">Table Management</h1>
            <div className="flex items-center gap-4">
              <div className="relative flex-1 md:w-64">
                <input
                  type="text"
                  placeholder="Search tables..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 rounded-xl border border-gray-200 bg-white"
              >
                <option value="all">All Status</option>
                <option value="Available">Available</option>
                <option value="Occupied">Occupied</option>
              </select>
              <div className="flex items-center gap-2 px-2 py-1 bg-gray-100 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm hover:shadow flex items-center gap-2"
              >
                <PlusCircle className="w-5 h-5" />
                Add Table
              </button>
              <button
                onClick={() => setIsBulkModalOpen(true)}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all shadow-sm hover:shadow flex items-center gap-2"
              >
                <PlusCircle className="w-5 h-5" />
                Bulk Add
              </button>
            </div>
          </div>
        </div>

 {/* Content */}
 {loading ? (
          <div className="flex justify-center items-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            {tables.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
                <PlusCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  No Tables Added
                </h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Get started by adding your first table or bulk import multiple tables.
                </p>
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm hover:shadow"
                  >
                    Add Single Table
                  </button>
                  <button
                    onClick={() => setIsBulkModalOpen(true)}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all shadow-sm hover:shadow"
                  >
                    Bulk Import
                  </button>
                </div>
              </div>
            ) : (
              viewMode === 'grid' ? renderGridView() : renderListView()
            )}
          </>
        )}

        {/* Add Table Modal */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setError('');
          }}
          title="Add New Table"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Table Number
              </label>
              <input
                type="number"
                name="tableNumber"
                value={formData.tableNumber}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all"
            >
              Add Table
            </button>
          </form>
        </Modal>

        {/* Bulk Add Modal */}
        <Modal
          isOpen={isBulkModalOpen}
          onClose={() => {
            setIsBulkModalOpen(false);
            setError('');
            setBulkData({ baseNumber: '', quantity: '' });
          }}
          title="Bulk Add Tables"
        >
          <form onSubmit={handleBulkSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100">
                {error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Starting Number
                </label>
                <input
                  type="number"
                  name="baseNumber"
                  value={bulkData.baseNumber}
                  onChange={handleBulkInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Tables
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={bulkData.quantity}
                  onChange={handleBulkInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  min="1"
                  max="50"
                />
              </div>
            </div>

            <div className="p-4 bg-blue-50 text-blue-700 rounded-xl border border-blue-100">
              <p>This will create <span className="font-bold">{bulkData.quantity || '0'}</span> tables</p>
              <p>Numbers: {bulkData.baseNumber ? `${bulkData.baseNumber} to ${parseInt(bulkData.baseNumber) + parseInt(bulkData.quantity || 0) - 1}` : 'N/A'}</p>
            </div>
            <button
              type="submit"
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all"
            >
              Create Tables
            </button>
          </form>
        </Modal>
      </div>
    </div>
  );
};

export default TableManager;