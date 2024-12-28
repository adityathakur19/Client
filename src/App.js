import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'; 
import { AuthProvider } from './context/AuthContext';
import Register from './components/Register';
import Login from './components/Login';
import ForgotPassword from './components/ForgotPassword';
import ExpenseTracker from './pages/Expense/ExpenseTracker';
import TableManager from './pages/ManageTable/ManageTable';
import AcceptedOrders from './pages/AcceptedOrders/AcceptedOrders';
import Settings from './pages/Settings/Settings';
import Sales from './pages/Sales/Sales';
import Payment from './pages/Payment/Payment';
import HeldPayment from './pages/Payment/HeldPayment';
import KOT from './pages/KOT/KOT';
import GenerateBill from './pages/GenerateBill/GenerateBill';
import Dashboard from './pages/Dashboard/Dashboard';
import ProductManager from './pages/Item/Product';
import ExpenseReport from './pages/Report/ExpenseReport';
import ItemsSalesReport from './pages/Report/ItemsSalesReport'
import BillHistory from './pages/BillHistory/BillHistory'
import PrivateRoute from './Route/PrivateRoute';
import Sidebar from './components/Sidebar'; 

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Main />
      </Router>
    </AuthProvider>
  );
};

const Main = () => {
  const location = useLocation(); 
  const shouldShowSidebar = !["/login", "/register", "/forgot-password"].includes(location.pathname); 

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {shouldShowSidebar && <Sidebar />}
      <div className="flex-1 min-h-screen">
        <div className="p-0">
          <Routes>
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/Expense" element={<PrivateRoute><ExpenseTracker /></PrivateRoute>} />
            <Route path="/product" element={<PrivateRoute><ProductManager /></PrivateRoute>} />
            <Route path="/table-manager" element={<PrivateRoute><TableManager /></PrivateRoute>} />
            <Route path="/accepted-orders" element={<PrivateRoute><AcceptedOrders /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
            <Route path="/sales" element={<PrivateRoute><Sales /></PrivateRoute>} />
            <Route path="/payment" element={<PrivateRoute><Payment /></PrivateRoute>} />
            <Route path="/held-payment" element={<PrivateRoute><HeldPayment /></PrivateRoute>} />
            <Route path='/expense-report'element={<PrivateRoute><ExpenseReport /></PrivateRoute>} />
            <Route path='/items-sales-report'element={<PrivateRoute><ItemsSalesReport /></PrivateRoute>} />
            <Route path="/kot" element={<PrivateRoute><KOT /></PrivateRoute>} />
            <Route path="/generate-bill/:orderId" element={<PrivateRoute><GenerateBill /></PrivateRoute>} />
            <Route path="/bill-history" element={<PrivateRoute><BillHistory /></PrivateRoute>} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default App;