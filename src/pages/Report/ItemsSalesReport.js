import React, { useState, useEffect } from 'react';
import { BarChart, PieChart, Pie, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { BarChartIcon, PieChartIcon } from 'lucide-react';

const ItemSalesReport = () => {
  const { token } = useAuth();
  const [sales, setSales] = useState([]);
  const [timeFilter, setTimeFilter] = useState('today');
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalItems: 0,
    averageOrderValue: 0
  });
  const [topSellingItems, setTopSellingItems] = useState([]);
  const [chartType, setChartType] = useState('pie');

  const COLORS = {
    bar: ['#4F46E5', '#7C3AED', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#6366F1', '#8B5CF6', '#14B8A6'],
    pie: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#6366F1', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#06B6D4']
  };

  const mergeSalesData = (walkinData, savedData) => {
    const itemMap = new Map();

    const processItems = (items, source) => {
      items.forEach(order => {
        order.items.forEach(item => {
          const itemName = source === 'walkin' ? item.itemName : item.name;
          const quantity = item.quantity || 0;
          const revenue = source === 'walkin' ? item.totalPrice : (item.price * item.quantity);

          if (itemMap.has(itemName)) {
            const existing = itemMap.get(itemName);
            itemMap.set(itemName, {
              name: itemName,
              quantity: existing.quantity + quantity,
              revenue: existing.revenue + revenue,
              orders: existing.orders + 1
            });
          } else {
            itemMap.set(itemName, {
              name: itemName,
              quantity: quantity,
              revenue: revenue,
              orders: 1
            });
          }
        });
      });
    };

    processItems(walkinData, 'walkin');
    processItems(savedData, 'saved');

    return Array.from(itemMap.values())
      .map(item => ({
        itemName: item.name,
        totalQuantity: item.quantity,
        totalRevenue: item.revenue,
        orderCount: item.orders
      }));
  };

  useEffect(() => {
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
          default:
            startDate.setHours(0, 0, 0, 0);
        }

        const [walkinRes, savedRes] = await Promise.all([
          fetch(`http://localhost:5000/api/walkin-orders?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`http://localhost:5000/api/saved-orders?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        if (!walkinRes.ok || !savedRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const [walkinData, savedData] = await Promise.all([
          walkinRes.json(),
          savedRes.json()
        ]);

        const combinedData = mergeSalesData(walkinData, savedData);
        setSales(combinedData);

        // Modified to show top 10 items
        const sortedItems = [...combinedData]
          .sort((a, b) => b.totalQuantity - a.totalQuantity)
          .slice(0, 10);
        setTopSellingItems(sortedItems);

        // Calculate stats
        const totals = combinedData.reduce((acc, item) => ({
          totalRevenue: acc.totalRevenue + item.totalRevenue,
          totalOrders: acc.totalOrders + item.orderCount,
          totalItems: acc.totalItems + item.totalQuantity
        }), { totalRevenue: 0, totalOrders: 0, totalItems: 0 });

        setStats({
          ...totals,
          averageOrderValue: totals.totalOrders ? totals.totalRevenue / totals.totalOrders : 0
        });

      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [timeFilter, token]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-200 rounded shadow">
          <p className="font-semibold">{label}</p>
          <p className="text-indigo-600">
            {payload[0].name}: {payload[0].value}
          </p>
          {payload[0].name === "Quantity Sold" && (
            <p className="text-green-600">
              Revenue: ₹{topSellingItems.find(item => item.itemName === label)?.totalRevenue.toFixed(2)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    if (topSellingItems.length === 0) {
      return (
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500">No data available</p>
        </div>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={500}>
        {chartType === 'bar' ? (
          <BarChart
            data={topSellingItems}
            margin={{ top: 20, right: 30, left: 40, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="itemName"
              interval={0}
              tick={props => (
                <g transform={`translate(${props.x},${props.y})`}>
                  <text
                    x={0}
                    y={0}
                    dy={16}
                    textAnchor="end"
                    fill="#666"
                    transform="rotate(-45)"
                    fontSize={12}
                  >
                    {props.payload.value}
                  </text>
                </g>
              )}
              height={60}
            />
            <YAxis
              label={{ 
                value: 'Quantity Sold', 
                angle: -90, 
                position: 'insideLeft',
                offset: -5
              }}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="totalQuantity" name="Quantity Sold" maxBarSize={60}>
              {topSellingItems.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS.bar[index % COLORS.bar.length]} />
              ))}
            </Bar>
          </BarChart>
        ) : (
          <PieChart>
            <Pie
              data={topSellingItems}
              cx="50%"
              cy="50%"
              outerRadius="65%"
              dataKey="totalRevenue"
              nameKey="itemName"
              label={({ cx, cy, midAngle, outerRadius, value, name }) => {
                const RADIAN = Math.PI / 180;
                const radius = outerRadius * 1.2;
                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                const percent = ((value / topSellingItems.reduce((sum, item) => sum + item.totalRevenue, 0)) * 100).toFixed(1);

                return (
                  <text
                    x={x}
                    y={y}
                    fill="#374151"
                    textAnchor={x > cx ? 'start' : 'end'}
                    dominantBaseline="central"
                    fontSize={12}
                  >
                    {`${name} (${percent}%)`}
                  </text>
                );
              }}
            >
              {topSellingItems.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS.pie[index % COLORS.pie.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value, entry) => {
                const item = topSellingItems.find(item => item.itemName === value);
                return `${value} - ₹${item.totalRevenue.toFixed(2)}`;
              }}
            />
          </PieChart>
        )}
      </ResponsiveContainer>
    );
  };

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Item Sales Report</h1>
          <div className="flex gap-2">
            {['pie', 'bar'].map(type => (
              <button
                key={type}
                onClick={() => setChartType(type)}
                className={`p-2 rounded ${
                  chartType === type ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600'
                }`}
              >
                {type === 'pie' ? <PieChartIcon size={20}/> :<BarChartIcon size={20} /> }
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {['today', '7days', '1month', '3months', '6months', '1year'].map(filter => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`px-3 py-1.5 text-sm md:px-4 md:py-2 rounded-lg ${
                timeFilter === filter
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-4 md:p-8 rounded-lg shadow">
          {renderChart()}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Revenue", value: `₹${stats.totalRevenue?.toFixed(2) || 0}`, color: "from-indigo-500 to-indigo-600" },
            { label: "Average Order Value", value: `₹${stats.averageOrderValue?.toFixed(2) || 0}`, color: "from-emerald-500 to-emerald-600" },
            { label: "Total Orders", value: stats.totalOrders || 0, color: "from-amber-500 to-amber-600" },
            { label: "Total Items Sold", value: stats.totalItems || 0, color: "from-purple-500 to-purple-600" }
          ].map(stat => (
            <div key={stat.label} className={`p-4 md:p-6 rounded-lg bg-gradient-to-br ${stat.color} text-white`}>
              <p className="text-sm opacity-80">{stat.label}</p>
              <p className="text-2xl md:text-3xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ItemSalesReport;