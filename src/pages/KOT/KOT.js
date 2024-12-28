import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { 
  CheckCircle, 
  XCircle, 
  Bell, 
  Clock, 
  Check, 
  Timer,
  Edit2,
  Trash2,
  PlusCircle
} from 'lucide-react';

const KitchenOrderBoard = () => {
  // State management
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timers, setTimers] = useState({});
  const [isNewOrderNotification, setIsNewOrderNotification] = useState(false);
  const [selectedOrderForTimer, setSelectedOrderForTimer] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [rejectionTimers, setRejectionTimers] = useState({});

  // Refs
  const socketRef = useRef(null);
  const audioRef = useRef(null);

  // Fetch initial orders
  const fetchInitialOrders = useCallback(async () => {
    try {
      const response = await axios.get('http://51.20.97.10/orders');
      const sortedOrders = (response.data.orders || [])
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(sortedOrders);
      setLoading(false);
    } catch (fetchError) {
      console.error('Failed to fetch initial orders:', fetchError);
      setError('Could not load orders');
      setLoading(false);
    }
  }, []);

  // Socket connection and event handling
  useEffect(() => {
    // Initialize audio notification
    try {
      audioRef.current = new Audio('/notify.mp3');
    } catch (audioError) {
      console.error('Failed to create audio element:', audioError);
    }

    // Initialize socket connection
    socketRef.current = io('http://51.20.97.10', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    const socket = socketRef.current;

    socket.on('connect_error', (error) => {
      console.error('Detailed Socket Connection Error:', error);
    });
    
    socket.on('disconnect', (reason) => {
      console.error('Socket Disconnected:', reason);
    });

    // Connect handler
    socket.on('connect', () => {
      console.log('Socket connected');
      fetchInitialOrders();
    });

    // Order update handler
    socket.on('orderUpdated', (updateData) => {
      console.log('Received order update:', updateData);

      // Play notification sound
      if (audioRef.current) {
        audioRef.current.play().catch((err) => console.error('Audio play error:', err));
      }

      setOrders((prevOrders) => {
        // Handle different update actions
        switch(updateData.action) {
          case 'create':
            // Add new order if not existing
            const orderExists = prevOrders.some(order => order._id === updateData.order._id);
            const newOrderList = orderExists 
              ? prevOrders 
              : [updateData.order, ...prevOrders];
            
            // Update table status to occupied
            axios.patch(`http://localhost:5000/api/tables/tables/${updateData.tableId}/status`, {
              status: 'Occupied'
            }).catch(error => {
              console.error('Failed to update table status:', error);
            });
            
            // Trigger new order notification
            setIsNewOrderNotification(true);
            setTimeout(() => setIsNewOrderNotification(false), 3000);
            
            return newOrderList;

          case 'statusUpdate':
            // Update existing order
            return prevOrders.map(order => 
              order._id === updateData.order._id 
                ? updateData.order 
                : order
            ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

          default:
            return prevOrders;
        }
      });
    });

    // Error handlers
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setError(`Socket Connection Error: ${error.message}`);
    });

    // Cleanup on component unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
      // Clear any existing rejection timers
      Object.values(rejectionTimers).forEach(clearTimeout);
    };
  }, [fetchInitialOrders]);

  // Order status update handler
  const handleOrderAction = async (order, actionStatus) => {
    try {
      const response = await axios.put(
        `http://51.20.97.10/orders/${order._id}/status`, 
        { orderStatus: actionStatus }
      );
      
      console.log('Order status updated:', response.data);

      // If order is rejected, start a timer to remove it from database
      if (actionStatus === 'rejected') {
        const deletionTimer = setTimeout(async () => {
          try {
            // Delete the order from the database
            await axios.delete(`http://51.20.97.10/orders/${order._id}`);
            
            // Remove from local state
            setOrders(prevOrders => 
              prevOrders.filter(o => o._id !== order._id)
            );
            
            // Clear the rejection timer
            setRejectionTimers(prev => {
              const newTimers = {...prev};
              delete newTimers[order._id];
              return newTimers;
            });
          } catch (deleteError) {
            console.error('Failed to delete rejected order:', deleteError);
          }
        }, 1 * 60 * 1000); // 1.5 minutes (middle of 1-2 minute range)

        // Store the deletion timer
        setRejectionTimers(prev => ({
          ...prev,
          [order._id]: {
            timer: deletionTimer,
            expiresAt: Date.now() + (1.5 * 60 * 1000)
          }
        }));
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  // Update the calculateRemainingTime function
  const calculateRemainingTime = (orderId) => {
    const rejectionTimer = rejectionTimers[orderId];
    if (rejectionTimer) {
      const remainingMs = rejectionTimer.expiresAt - Date.now();
      return Math.ceil(remainingMs / (1000 * 60));
    }
    return 0;
  };

  // Cleanup effect to clear timers
  useEffect(() => {
    return () => {
      // Clear any existing rejection timers
      Object.values(rejectionTimers).forEach(timerObj => {
        if (timerObj.timer) {
          clearTimeout(timerObj.timer);
        }
      });
    };
  }, [rejectionTimers]);
  // Edit order functionality
  const handleEditOrder = (order) => {
    setEditingOrder({
      ...order,
      tempItems: [...order.items]
    });
  };

  const updateItemQuantity = (itemIndex, newQuantity) => {
    if (!editingOrder) return;

    const updatedItems = [...editingOrder.tempItems];
    updatedItems[itemIndex] = {
      ...updatedItems[itemIndex],
      quantity: Math.max(0, newQuantity)
    };

    // Remove items with zero quantity
    const filteredItems = updatedItems.filter(item => item.quantity > 0);

    setEditingOrder({
      ...editingOrder,
      tempItems: filteredItems
    });
  };

  const saveOrderChanges = async () => {
    if (!editingOrder) return;

    try {
      // Update order with modified items
      await axios.put(
        `http://51.20.97.10/orders/${editingOrder._id}`, 
        { 
          ...editingOrder, 
          items: editingOrder.tempItems 
        }
      );

      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order._id === editingOrder._id 
            ? { ...order, items: editingOrder.tempItems } 
            : order
        )
      );

      // Close editing mode
      setEditingOrder(null);
    } catch (error) {
      console.error('Failed to update order:', error);
    }
  };

  // Timer management
  const startOrderTimer = (order, minutes) => {
    const timerId = setInterval(() => {
      setTimers(prevTimers => {
        const currentTimer = prevTimers[order._id];
        if (currentTimer && currentTimer.remainingTime > 0) {
          return {
            ...prevTimers,
            [order._id]: {
              ...currentTimer,
              remainingTime: currentTimer.remainingTime - 1
            }
          };
        } else {
          clearInterval(timerId);
          return prevTimers;
        }
      });
    }, 60000); // Update every minute

    setTimers(prevTimers => ({
      ...prevTimers,
      [order._id]: {
        totalTime: minutes,
        remainingTime: minutes,
        timerId: timerId
      }
    }));

    // Update order status to cooking
    handleOrderAction(order, 'cooking');
  };

  // Mark order as ready
  const markOrderReady = async (order) => {
    // Clear the timer if it exists
    if (timers[order._id]) {
      clearInterval(timers[order._id].timerId);
      setTimers(prevTimers => {
        const newTimers = { ...prevTimers };
        delete newTimers[order._id];
        return newTimers;
      });
    }

    // Update order status to ready
    await handleOrderAction(order, 'ready');
  };

  // Timer Input Modal Component
  const TimerModal = ({ order, onClose }) => {
    const [customMinutes, setCustomMinutes] = useState(15);
    const [timerType, setTimerType] = useState('default');

    const handleStartCooking = () => {
      const cookingTime = timerType === 'default' ? 15 : customMinutes;
      startOrderTimer(order, cookingTime);
      onClose();
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl w-96">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Timer className="mr-2" /> Set Cooking Time
          </h2>
          
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <input 
                type="radio" 
                id="defaultTimer" 
                name="timerType" 
                checked={timerType === 'default'}
                onChange={() => setTimerType('default')}
                className="mr-2"
              />
              <label htmlFor="defaultTimer" className="flex-grow">
                Default Timer (15 minutes)
              </label>
            </div>
            
            <div className="flex items-center">
              <input 
                type="radio" 
                id="customTimer" 
                name="timerType" 
                checked={timerType === 'custom'}
                onChange={() => setTimerType('custom')}
                className="mr-2"
              />
              <label htmlFor="customTimer" className="flex-grow">
                Custom Timer
              </label>
              {timerType === 'custom' && (
                <input 
                  type="number" 
                  value={customMinutes} 
                  onChange={(e) => setCustomMinutes(Math.max(1, parseInt(e.target.value)))}
                  className="border rounded p-2 w-24 ml-2"
                  min="1"
                />
              )}
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button 
              onClick={handleStartCooking}
              className="flex-1 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center justify-center"
            >
              <Clock className="mr-2" /> Start Cooking
            </button>
            <button 
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render items with optional editing
  const renderOrderItems = (items, isEditing = false, orderIndex = null) => {
    return items.map((item, index) => (
      <div 
        key={item.id || index} 
        className="flex justify-between items-center border-b pb-2 last:border-b-0"
      >
        <span className="font-medium">{item.name}</span>
        {isEditing ? (
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => updateItemQuantity(index, item.quantity - 1)}
              className="text-red-500 hover:bg-red-100 rounded-full p-1"
            >
              <Trash2 size={16} />
            </button>
            <input
              type="number"
              value={item.quantity}
              onChange={(e) => updateItemQuantity(index, parseInt(e.target.value))}
              className="w-16 text-center border rounded"
              min="0"
            />
            <button 
              onClick={() => updateItemQuantity(index, item.quantity + 1)}
              className="text-green-500 hover:bg-green-100 rounded-full p-1"
            >
              <PlusCircle size={16} />
            </button>
          </div>
        ) : (
          <span className="text-gray-600">
            Qty: {item.quantity} | ₹{item.price * item.quantity}
          </span>
        )}
      </div>
    ));
  };

  // Render order actions based on order status
  const renderOrderActions = (order) => {
    // Calculation for remaining rejection time
    const calculateRemainingTime = (orderId) => {
      const rejectionTimer = rejectionTimers[orderId];
      if (rejectionTimer) {
        const remainingMs = rejectionTimer.expiresAt - Date.now();
        return Math.ceil(remainingMs / (1000 * 60));
      }
      return 0;
    };

    if (order.orderStatus === 'pending') {
      return (
        <div className="flex space-x-2">
          <button
            onClick={() => handleOrderAction(order, 'accepted')}
            className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition flex items-center justify-center"
          >
            <CheckCircle className="mr-2" /> Accept
          </button>
          <button
            onClick={() => handleOrderAction(order, 'rejected')}
            className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition flex items-center justify-center"
          >
            <XCircle className="mr-2" /> Reject
          </button>
        </div>
      );
    } else if (order.orderStatus === 'rejected') {
      const remainingTime = calculateRemainingTime(order._id);
      return (
        <div className="w-full bg-red-100 text-red-800 py-2 rounded-lg flex items-center justify-center">
          <XCircle className="mr-2" /> Rejected
          <span className="ml-2 text-sm">
            (Removing in {remainingTime} mins)
          </span>
        </div>
      );
    } else if (order.orderStatus === 'accepted') {
      return (
        <button
          onClick={() => setSelectedOrderForTimer(order)}
          className="w-full bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600 transition flex items-center justify-center"
        >
          <Clock className="mr-2" /> Start Cooking
        </button>
      );
    } else if (order.orderStatus === 'cooking') {
      return (
        <div className="space-y-2">
          <div className="w-full bg-yellow-100 text-yellow-800 py-2 rounded-lg flex items-center justify-center">
            <Clock className="mr-2" /> 
            Time Remaining: {timers[order._id] ? 
              `${timers[order._id].remainingTime} mins` : 
              'Calculating...'
            }
          </div>
          <button
            onClick={() => markOrderReady(order)}
            className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition flex items-center justify-center"
          >
            <Check className="mr-2" /> Mark as Ready
          </button>
        </div>
      );
    } else {
      return (
        <div className="w-full bg-green-100 text-green-800 py-2 rounded-lg flex items-center justify-center">
          <Check className="mr-2" /> Ready to Serve
        </div>
      );
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        {error}
      </div>
    );
  }

  // Main render
  return (
    <div className="p-4 bg-gray-100 min-h-screen relative">
      {/* New Order Notification */}
      {isNewOrderNotification && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center animate-bounce">
          <Bell className="mr-2 animate-ring" />
          New Order Received!
        </div>
      )}

      {/* Timer Modal */}
      {selectedOrderForTimer && (
        <TimerModal 
          order={selectedOrderForTimer} 
          onClose={() => setSelectedOrderForTimer(null)} 
        />
      )}

      {/* Order Editing Modal */}
      {editingOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Edit2 className="mr-2" /> Edit Order
            </h2>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Table: {editingOrder.selectedTable}
              </h3>
              
              <div className="max-h-64 overflow-y-auto">
                {renderOrderItems(editingOrder.tempItems, true)}
              </div>
            </div>
            
            <div className="flex space-x-2 mt-4">
              <button 
                onClick={saveOrderChanges}
                className="flex-1 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center justify-center"
              >
                <Check className="mr-2" /> Save Changes
              </button>
              <button 
                onClick={() => setEditingOrder(null)}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <h1 className="text-3xl font-bold text-center mb-6">Kitchen Order Board</h1>
      
      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {orders.map((order) => (
          <div
            key={order._id}
            className={`bg-white shadow-lg rounded-lg p-4 transform transition-all hover:scale-105 
              ${order.orderStatus === 'cooking' ? 'border-2 border-yellow-500' : 
                order.orderStatus === 'rejected' ? 'border-2 border-red-500' : ''}`}
          >
            {/* Order Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">
                Table: {order.selectedTable}
              </h2>
              <span className="text-sm text-gray-500">
                Order #{order.orderId}
              </span>
            </div>

            {/* Order Items */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">Items</h3>
                {(order.orderStatus === 'accepted' || order.orderStatus === 'cooking') && (
                  <button
                    onClick={() => handleEditOrder(order)}
                    className="text-blue-500 hover:bg-blue-100 rounded-full p-1"
                  >
                    <Edit2 size={20} />
                  </button>
                )}
              </div>
              <ul className="space-y-2">
                {renderOrderItems(order.items)}
              </ul>
            </div>

            {/* Dynamically render order actions */}
            {renderOrderActions(order)}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {orders.length === 0 && (
        <div className="text-center text-gray-500 mt-10">
          No pending orders
        </div>
      )}
    </div>
  );
};

export default KitchenOrderBoard;