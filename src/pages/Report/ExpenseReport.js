import React, { useState, useEffect } from 'react';
import { BarChart, PieChart, Pie, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { BarChartIcon, PieChartIcon } from 'lucide-react';

const CHART_COLORS = {
  pie: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#6366F1', '#EC4899', '#8B5CF6', '#14B8A6', '#F97316', '#A855F7'],
  bar: ['#4F46E5', '#7C3AED', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#8B5CF6', '#14B8A6', '#F97316']
};

const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value, name }) => {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius * 1.2;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  // Only show label if percentage is greater than 3%
  if (percent < 0.03) return null;

  return (
    <text
      x={x}
      y={y}
      fill="#374151"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize="12"
    >
      {`${name}: ₹${value.toFixed(0)}`}
    </text>
  );
};

const ExpenseReport = () => {
  const { token } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [timeFilter, setTimeFilter] = useState('today');
  const [stats, setStats] = useState({});
  const [itemStats, setItemStats] = useState([]);
  const [chartType, setChartType] = useState('pie');
  const [sortConfig, setSortConfig] = useState({ key: 'count', direction: 'desc' });

  useEffect(() => {
    fetchData();
  }, [timeFilter, token]);

  const fetchData = async () => {
    try {
      const endDate = new Date();
      let startDate = new Date();

      switch (timeFilter) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case '7days':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '1month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case '3months':
          startDate.setMonth(endDate.getMonth() - 3);
          break;
        case '6months':
          startDate.setMonth(endDate.getMonth() - 6);
          break;
        case '1year':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      const response = await fetch(
        `http://localhost:5000/api/expenses?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      const data = await response.json();
      setExpenses(data);
      
      const statsResponse = await fetch('http://localhost:5000/api/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const statsData = await statsResponse.json();
      setStats(statsData);

      // Calculate detailed item statistics
      const itemStats = {};
      data.forEach(expense => {
        if (!itemStats[expense.item]) {
          itemStats[expense.item] = {
            item: expense.item,
            count: 0,
            totalSpent: 0,
            avgPrice: 0,
            firstPurchase: new Date(expense.date),
            lastPurchase: new Date(expense.date),
            frequency: 0
          };
        }
        
        const stat = itemStats[expense.item];
        stat.count += expense.quantity;
        stat.totalSpent += expense.totalPrice;
        stat.avgPrice = stat.totalSpent / stat.count;
        stat.firstPurchase = new Date(Math.min(stat.firstPurchase, new Date(expense.date)));
        stat.lastPurchase = new Date(Math.max(stat.lastPurchase, new Date(expense.date)));
      });

      // Calculate purchase frequency (purchases per month)
      Object.values(itemStats).forEach(stat => {
        const monthsDiff = (stat.lastPurchase - stat.firstPurchase) / (1000 * 60 * 60 * 24 * 30.44);
        stat.frequency = monthsDiff > 0 ? (stat.count / monthsDiff).toFixed(2) : stat.count;
      });

      setItemStats(Object.values(itemStats));
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const getExpensesByCategory = () => {
    const categories = {};
    expenses.forEach(expense => {
      categories[expense.item] = (categories[expense.item] || 0) + expense.totalPrice;
    });
    return Object.entries(categories).map(([name, value]) => ({
      name,
      value
    }));
  };

  const sortData = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortedItems = () => {
    const sortedItems = [...itemStats];
    const { key, direction } = sortConfig;
    
    return sortedItems.sort((a, b) => {
      if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
      if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const renderChart = () => {
    switch (chartType) {
      
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={500}>
            <PieChart>
              <Pie
                data={getExpensesByCategory()}
                cx="50%"
                cy="50%"
                outerRadius={180}
                dataKey="value"
                labelLine={false}
                label={CustomPieLabel}
              >
                {getExpensesByCategory().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS.pie[index % CHART_COLORS.pie.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      default:
        return null;
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={itemStats} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="item" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" name="Quantity" fill={CHART_COLORS.bar[0]}>
                {itemStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS.bar[index % CHART_COLORS.bar.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  const renderSortIndicator = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
    }
    return '';
  };

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Expense Report</h1>
          <div className="flex gap-2">
          <button
              onClick={() => setChartType('pie')}
              className={`p-2 rounded transition-colors ${
                chartType === 'pie' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-indigo-50'
              }`}
            >
              <PieChartIcon size={20} />
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`p-2 rounded transition-colors ${
                chartType === 'bar' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-indigo-50'
              }`}
            >
              <BarChartIcon size={20} />
            </button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {['today', '7days', '1month', '3months', '6months', '1year'].map(filter => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`px-3 py-1.5 text-sm md:px-4 md:py-2 rounded-lg transition-colors ${
                timeFilter === filter
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-indigo-50'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg p-3 text-white">
            <h3 className="text-base font-medium opacity-90">Total Expenses</h3>
            <p className="text-xl font-bold mt-1">₹{stats.totalExpenses?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || 0}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg p-3 text-white">
            <h3 className="text-base font-medium opacity-90">Average Expense</h3>
            <p className="text-xl font-bold mt-1">₹{stats.avgExpense?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || 0}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg p-3 text-white">
            <h3 className="text-base font-medium opacity-90">Highest Expense</h3>
            <p className="text-xl font-bold mt-1">₹{stats.maxExpense?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || 0}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-3 text-white">
            <h3 className="text-base font-medium opacity-90">Total Transactions</h3>
            <p className="text-xl font-bold mt-1">{stats.count?.toLocaleString('en-IN') || 0}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg">
          <div className="w-full p-6">
            {renderChart()}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Detailed Item Statistics</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-4 text-left text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-100"
                    onClick={() => sortData('item')}
                  >
                    Item {renderSortIndicator('item')}
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-100"
                    onClick={() => sortData('count')}
                  >
                    Quantity {renderSortIndicator('count')}
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-100"
                    onClick={() => sortData('totalSpent')}
                  >
                    Total Spent {renderSortIndicator('totalSpent')}
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-100"
                    onClick={() => sortData('avgPrice')}
                  >
                    Avg Price {renderSortIndicator('avgPrice')}
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-100"
                    onClick={() => sortData('frequency')}
                  >
                    Monthly Frequency {renderSortIndicator('frequency')}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Purchase Period</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {getSortedItems().map((item, index) => (
                  <tr 
                    key={item.item} 
                    className={`hover:bg-gray-50 transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.item}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.count.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      ₹{item.totalSpent.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      ₹{item.avgPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {Number(item.frequency).toLocaleString('en-IN', { maximumFractionDigits: 1 })}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <span className="whitespace-nowrap">
                        {new Date(item.firstPurchase).toLocaleDateString()} - {new Date(item.lastPurchase).toLocaleDateString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                <tr>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">Totals</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    {itemStats.reduce((sum, item) => sum + item.count, 0).toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    ₹{itemStats.reduce((sum, item) => sum + Number(item.totalSpent), 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    ₹{(itemStats.reduce((sum, item) => sum + Number(item.totalSpent), 0) / 
                       itemStats.reduce((sum, item) => sum + item.count, 0)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">-</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">-</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseReport;