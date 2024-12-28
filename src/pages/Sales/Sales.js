// NewSales.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Printer, CreditCard, ArrowLeft, ShoppingBag, MessageCircleWarning } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ReactDOMServer from 'react-dom/server';

const NewSales = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState('tables');
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [heldBills, setHeldBills] = useState({});
  const [selectedBill, setSelectedBill] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Add beforeunload event listener
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    fetchTables();
    fetchAllHeldBills();
  }, []);

  useEffect(() => {
    if (view === 'menu') {
      fetchProducts();
      if (selectedTable) {
        fetchHeldBill(selectedTable._id);
      }
    }
  }, [view, selectedTable]);

  // Track changes to selectedItems
  useEffect(() => {
    if (selectedItems.length > 0) {
      setHasUnsavedChanges(true);
    }
  }, [selectedItems]);

  const fetchAllHeldBills = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/held-bills', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch held bills');
      const bills = await response.json();
      
      const billsObject = bills.reduce((acc, bill) => {
        acc[bill.tableId] = bill.items;
        return acc;
      }, {});
      
      setHeldBills(billsObject);
    } catch (err) {
      setError('Failed to fetch held bills');
    }
  };

// Update the fetchHeldBill function in NewSales.js
const fetchHeldBill = async (tableId) => {
  try {
    const response = await fetch(`http://localhost:5000/api/held-bills/${tableId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (response.ok) {
      const bill = await response.json();
      if (bill && bill.items) {
        setSelectedItems(bill.items);
        setSelectedBill(bill); // Store the full bill object
        setHasUnsavedChanges(false);
      }
    }
  } catch (err) {
    setError('Failed to fetch held bill');
  }
};


  const fetchTables = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/tables', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch tables');
      const data = await response.json();
      const formattedTables = data.map(table => ({
        _id: table._id,
        name: `Table ${table.tableNumber}`,
        tableNumber: table.tableNumber,
        status: table.status || 'Available'
      }));
      setTables(formattedTables);
    } catch (err) {
      setError('Failed to fetch tables');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/products', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      const formattedProducts = data.map(product => ({
        _id: product._id,
        itemName: product.itemName,
        totalPrice: product.sellPrice,
        imageUrl: product.imageUrl
      }));
      setProducts(formattedProducts);
    } catch (err) {
      setError('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const KOTPrintTemplate = ({ tableInfo, items, timestamp }) => {
    return (
      <div className="p-4 font-mono text-sm">
        <div className="text-center mb-4">
          <p>Table: {tableInfo?.name}</p>
          <p>{new Date(timestamp).toLocaleString()}</p>
        </div>
        
        <div className="border-t border-b border-black my-2">
          <div className="grid grid-cols-12 font-bold py-1">
            <div className="col-span-1">Qty</div>
            <div className="col-span-9">Item</div>
          </div>
        </div>

        {items.map((item, index) => (
          <div key={index} className="grid grid-cols-12 py-1">
            <div className="col-span-1">{item.quantity}</div>
            <div className="col-span-9">{item.itemName}</div>
          </div>
        ))}
        
        <div className="mt-4 text-center">
          <p>*** KOT ***</p>
        </div>
      </div>
    );
  };

  const handlePrintKOT = () => {
    if (!selectedItems.length) return;
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    
    // Generate the content
    const content = (
      <html>
        <head>
          <title>KOT - Table {selectedTable?.name}</title>
          <style>
            {`
              @media print {
                @page { margin: 0; }
                body { margin: 1cm; }
              }
              .font-mono { font-family: monospace; }
              .text-sm { font-size: 0.875rem; }
              .text-xs { font-size: 0.75rem; }
              .text-xl { font-size: 1.25rem; }
              .font-bold { font-weight: bold; }
              .text-center { text-align: center; }
              .p-4 { padding: 1rem; }
              .mb-4 { margin-bottom: 1rem; }
              .my-2 { margin-top: 0.5rem; margin-bottom: 0.5rem; }
              .mt-4 { margin-top: 1rem; }
              .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
              .grid { display: grid; }
              .grid-cols-12 { grid-template-columns: repeat(12, minmax(0, 1fr)); }
              .col-span-1 { grid-column: span 1 / span 1; }
              .col-span-9 { grid-column: span 9 / span 9; }
              .col-span-2 { grid-column: span 2 / span 2; }
              .border-t { border-top-width: 1px; }
              .border-b { border-bottom-width: 1px; }
              .border-black { border-color: black; }
            `}
          </style>
        </head>
        <body>
          <KOTPrintTemplate 
            tableInfo={selectedTable} 
            items={selectedItems} 
            timestamp={new Date().toISOString()} 
          />
        </body>
      </html>
    );

    // Write the content to the new window
    printWindow.document.write(ReactDOMServer.renderToStaticMarkup(content));
    printWindow.document.close();

    // Print the window
    printWindow.onload = () => {
      printWindow.print();
      // Close the window after printing (optional)
      printWindow.onafterprint = () => {
        printWindow.close();
      };
    };
  };

// 3. Update the handleHoldBill function in NewSales.js
const handleHoldBill = async () => {
  if (selectedTable && selectedItems.length > 0) {
    try {
      setLoading(true);
      
      // Update table status
      const tableResponse = await fetch(`http://localhost:5000/api/tables/${selectedTable._id}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'Occupied' }),
      });

      if (!tableResponse.ok) throw new Error('Failed to update table status');

      // Save held bill with table number
      const billResponse = await fetch(`http://localhost:5000/api/held-bills/${selectedTable._id}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          tableId: selectedTable._id,
          tableNumber: selectedTable.tableNumber,  // Add table number
          items: selectedItems.map(item => ({
            itemId: item._id,
            itemName: item.itemName,
            quantity: item.quantity,
            totalPrice: item.totalPrice*item.quantity
          }))
        }),
      });

      if (!billResponse.ok) throw new Error('Failed to save held bill');

      setHasUnsavedChanges(false);
      setHeldBills(prev => ({
        ...prev,
        [selectedTable._id]: selectedItems
      }));
      
      setTables(prev => 
        prev.map(t => 
          t._id === selectedTable._id 
            ? { ...t, status: 'Occupied' }
            : t
        )
      );

      setView('tables');
      setSelectedTable(null);
      setSelectedItems([]);
    } catch (err) {
      setError('Failed to hold bill');
    } finally {
      setLoading(false);
    }
  }
  setShowExitDialog(false);
};

  const handleTableSelect = (table) => {
    setSelectedTable(table);
    setView('menu');
    if (table.status === 'Occupied') {
      const heldItems = heldBills[table._id] || [];
      setSelectedItems(heldItems);
      setHasUnsavedChanges(false);
    } else {
      setSelectedItems([]);
    }
  };

  const handleDeleteHeldBill = async () => {
    if (!selectedTable) return;
  
    try {
      setLoading(true);
      
      // Delete held bill from database
      const response = await fetch(`http://localhost:5000/api/held-bills/${selectedTable._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
  
      if (!response.ok) throw new Error('Failed to delete held bill');
  
      // Update table status back to Available
      const tableResponse = await fetch(`http://localhost:5000/api/tables/${selectedTable._id}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'Available' }),
      });
  
      if (!tableResponse.ok) throw new Error('Failed to update table status');
  
      // Update local state
      setHeldBills(prev => {
        const newHeldBills = { ...prev };
        delete newHeldBills[selectedTable._id];
        return newHeldBills;
      });
  
      setTables(prev => 
        prev.map(t => 
          t._id === selectedTable._id 
            ? { ...t, status: 'Available' }
            : t
        )
      );
  
      // Reset view and clear selections
      setView('tables');
      setSelectedTable(null);
      setSelectedItems([]);
      setHasUnsavedChanges(false);
  
    } catch (err) {
      setError('Failed to delete held bill');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = (product) => {
    setSelectedItems(prevItems => {
      const existingItem = prevItems.find(item => item._id === product._id);
      if (existingItem) {
        return prevItems.map(item =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + 1, totalPrice: product.totalPrice } // Keep original price
            : item
        );
      }
      return [...prevItems, { ...product, quantity: 1, totalPrice: product.totalPrice }];
    });
    setHasUnsavedChanges(true);
  };

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      setSelectedItems(prevItems => 
        prevItems.filter(item => item._id !== itemId)
      );
    } else {
      setSelectedItems(prevItems =>
        prevItems.map(item =>
          item._id === itemId
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    }
    setHasUnsavedChanges(true);
  };

  const calculateTotal = () => {
    return selectedItems.reduce((total, item) => 
      total + (item.totalPrice * item.quantity), 0
    );
  };

  const calculateTableTotal = (items) => {
    return items.reduce((total, item) => 
      total + (item.totalPrice * item.quantity), 0
    );
  };

  const handleExit = () => {
    if (hasUnsavedChanges) {
      setShowExitDialog(true);
    } else {
      setView('tables');
      setSelectedTable(null);
      setSelectedItems([]);
    }
  };

  const renderTableCard = (table) => (
    <div
      key={table._id}
      className={`relative p-6 rounded-lg shadow-lg cursor-pointer ${
        table.status === 'Available' ? 'bg-green-100' : 'bg-red-100'
      }`}
      onClick={() => handleTableSelect(table)}
    >
      <div className="flex flex-col items-center">
        <h3 className="text-lg font-semibold mb-2">Table {table.tableNumber}</h3>
        <p className={`text-sm ${
          table.status === 'Available' ? 'text-green-600' : 'text-red-600'
        }`}>
          {table.status}
        </p>
        
        {table.status === 'Occupied' && heldBills[table._id] && (
          <div className="mt-3 w-full">
            <div className="bg-white bg-opacity-90 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <ShoppingBag size={16} />
                <span className="font-medium">Held Items (Table {table.tableNumber})</span>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {heldBills[table._id].map((item, idx) => (
                  <div key={idx} className="text-sm flex justify-between">
                    <span>{item.itemName} x{item.quantity}</span>
                    <span>₹{item.totalPrice * item.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t border-gray-200">
                <div className="text-sm font-medium flex justify-between">
                  <span>Total:</span>
                  <span>₹{calculateTableTotal(heldBills[table._id])}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderMenu = () => (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Table: {selectedTable?.name}</h2>
          {selectedBill && (
            <div className="mt-2 p-4 bg-blue-50 border-l-4 border-blue-500 text-blue-700 rounded">
              <p className="text-sm">Order ID: {selectedBill.orderId}</p>
              <p className="text-sm">Loaded previously held items for this table</p>
            </div>
          )}
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handlePrintKOT}
            className={`bg-blue-500 text-white px-6 py-2 rounded-lg flex items-center ${
              selectedItems.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
            } transition-colors`}
            disabled={selectedItems.length === 0}
          >
            <Printer className="mr-2" /> Print KOT
          </button>
          <button
            onClick={handleHoldBill}
            className="bg-green-500 text-white px-6 py-2 rounded-lg flex items-center hover:bg-green-600 transition-colors"
          >
            <MessageCircleWarning className="mr-2" /> Hold Bill
          </button>
          <button 
            onClick={() => {
              navigate('/held-payment', {
                state: {
                  tableInfo: selectedTable,
                  items: selectedItems
                }
              });
            }} 
            className="bg-green-500 text-white px-6 py-2 rounded-lg flex items-center hover:bg-green-600 transition-colors"
          >
            <CreditCard className="mr-2" /> Payment
          </button>
          <button 
            onClick={handleExit}
            className="border border-gray-300 px-6 py-2 rounded-lg flex items-center hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="mr-2" /> Back
          </button>
          
          <button
            onClick={handleDeleteHeldBill}
            className="bg-green-500 text-white px-6 py-2 rounded-lg flex items-center hover:bg-green-600 transition-colors"
          >
            <MessageCircleWarning className="mr-2" /> Delete  held Bill
          </button>

        </div>
      </div>

      <div className="space-y-4">
        <div className="relative w-full max-w-md mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border rounded-lg"
          />
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 max-h-[400px] overflow-y-auto p-2">
          {products
            .filter((product) =>
              product.itemName.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((product) => (
              <div
                key={product._id}
                onClick={() => handleAddItem(product)}
                className="bg-white rounded-lg shadow hover:shadow-md transition-all duration-200 cursor-pointer transform hover:scale-105">
                  <div className="aspect-square relative">
                <img
                  src={product.imageUrl || "/api/placeholder/100/100"}
                  alt={product.itemName}
                  className="w-full h-full object-cover rounded-t-lg"
                />
              </div>
              <div className="p-2">
                <h4 className="font-medium text-xs mb-1 truncate">{product.itemName}</h4>
                <p className="text-green-600 font-medium text-sm">₹{product.totalPrice}</p>
              </div>
            </div>
          ))}
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
        <h3 className="text-xl font-semibold mb-4">Selected Items</h3>
        <div className="space-y-4 max-h-[300px] overflow-y-auto">
          {selectedItems.map((item) => (
            <div key={item._id} className="flex justify-between items-center p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">{item.itemName}</h4>
                <p className="text-sm text-gray-600">₹{item.totalPrice} each</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center bg-gray-100 rounded-lg">
                  <button
                    onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                    className="px-3 py-1 text-lg font-medium hover:bg-gray-200 rounded-l-lg"
                  >
                    -
                  </button>
                  <span className="px-4 py-1 font-medium">{item.quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                    className="px-3 py-1 text-lg font-medium hover:bg-gray-200 rounded-r-lg"
                  >
                    +
                  </button>
                </div>
                <span className="font-medium">₹{item.totalPrice * item.quantity}</span>
              </div>
            </div>
          ))}
        </div>

        {selectedItems.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <div className="flex justify-between text-xl font-bold">
              <span>Total</span>
              <span>₹{calculateTotal()}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);

return (
  <div className="min-h-screen bg-gray-100">
    {error && (
      <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 mb-4">
        <p>{error}</p>
      </div>
    )}
    
    {view === 'tables' && (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Select a Table</h2>
          <button
            onClick={() => navigate('/held-payment')}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            View Held Bills
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {tables.map(renderTableCard)}
        </div>
      </div>
    )}
    {view === 'menu' && renderMenu()}

    {showExitDialog && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
          <h3 className="text-xl font-bold mb-4">Exit Options</h3>
          <p className="text-gray-600 mb-6">Would you like to hold this bill or exit completely?</p>
          <div className="flex justify-end gap-4">
            <button
              onClick={handleHoldBill}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Hold Bill
            </button>
            <button
              onClick={() => {
                setShowExitDialog(false);
                setView('tables');
                setSelectedTable(null);
                setSelectedItems([]);
                setHasUnsavedChanges(false);
              }}
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Exit
            </button>
          </div>
        </div>
      </div>
    )}

    {loading && (
      <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )}
  </div>
);
};

export default NewSales;
