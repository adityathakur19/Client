import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home, BarChart2, Settings, LogOut, Users, 
  FileText, History, Menu as MenuIcon,
  CookingPot, Sofa, Wallet,
  ChevronDown, Keyboard, ChevronUp, Sun, Moon,
  ChevronLeft
} from "lucide-react";
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [restaurantName, setRestaurantName] = useState("Restaurant App");
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuth();

  useEffect(() => {
    fetchRestaurantName();
  }, []);

  const fetchRestaurantName = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setRestaurantName(data.restaurantName || "Restaurant App");
      }
    } catch (error) {
      console.error('Error fetching restaurant name:', error);
    }
  };

  const sidebarItems = [
    { name: "Dashboard", icon: Home, path: "/dashboard" },
    { name: "Menu", icon: CookingPot, path: "/product" },
    { name: "Daily Expenses", icon: Wallet, path: "/Expense" },
  ];

  const quickNavItems = [
    { name: "KOT Bills", icon: Users, path: "/accepted-orders" },
    { name: "KOT", icon: FileText, path: "/kot" },
    { name: "New Bill", icon: Keyboard, path: "/sales" },
    { name: "Table Activity", icon: Sofa, path: "/table-manager" },
  ];

  const reportsSubItems = [
    { name: "Expense Report", icon: Wallet, path: "/expense-report" },
    { name: "Items Report", icon: FileText, path: "/items-sales-report" }
  ];

  const quickActions = [
    { name: "Settings", icon: Settings, path: "/settings" },
  ];

  const billsHistory = [
    { name: "App Bill History", icon: History, path: "/bill-history" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("isAuthenticated");
    navigate("/login");
  };

  const handleReportsClick = () => {
    setIsReportsOpen(!isReportsOpen);
  };

  const getThemeColors = () => {
    if (isDarkTheme) {
      return {
        background: "bg-slate-900",
        text: "text-slate-200",
        border: "border-slate-800",
        hover: "hover:bg-slate-800/50",
        activeBg: "bg-indigo-500/10",
        activeText: "text-indigo-400",
        headerBg: "bg-slate-900/95",
        menuText: "text-slate-400",
        scrollbarThumb: "scrollbar-thumb-slate-600",
        scrollbarTrack: "scrollbar-track-slate-800/40",
      };
    }
    return {
      background: "bg-white",
      text: "text-slate-800",
      border: "border-slate-200",
      hover: "hover:bg-slate-100",
      activeBg: "bg-indigo-50",
      activeText: "text-indigo-600",
      headerBg: "bg-white/95",
      menuText: "text-slate-600",
      scrollbarThumb: "scrollbar-thumb-slate-300",
      scrollbarTrack: "scrollbar-track-slate-100",
    };
  };

  const colors = getThemeColors();

  const renderNavItem = (item, isActive) => {
    if (!item.icon) return null;
    
    const Icon = item.icon;
    return (
      <Link
        key={item.name}
        to={item.path}
        className={`flex items-center p-3 rounded-lg transition-all duration-200 mx-2 group ${
          isActive 
            ? `${colors.activeBg} ${colors.activeText}` 
            : `${colors.hover} ${colors.menuText} hover:${colors.text}`
        }`}
        onClick={() => setIsMobileOpen(false)}
      >
        <Icon className={`w-6 h-6 ${isActive ? colors.activeText : colors.menuText} group-hover:scale-110 transition-transform`} />
        {!isCollapsed && (
          <span className="ml-3 text-sm font-medium whitespace-nowrap">
            {item.name}
          </span>
        )}
      </Link>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full relative">
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`absolute -right-4 top-6 w-8 h-8 rounded-full ${colors.background} ${colors.border} 
          shadow-lg flex items-center justify-center group hover:${colors.hover} z-50
          transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
      >
        <ChevronLeft className={`w-5 h-5 ${colors.menuText}`} />
      </button>

      {/* Sidebar Header */}
      <div className={`sticky top-0 ${colors.headerBg} border-b ${colors.border} p-4 flex items-center justify-between`}>
        {!isCollapsed && (
          <div className="flex-1">
            <h2 className="text-3xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent truncate">
              {restaurantName}
            </h2>
          </div>
        )}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsDarkTheme(!isDarkTheme)}
            className={`p-2 ${colors.hover} rounded-lg transition-colors`}
          >
            {isDarkTheme ? (
              <Sun className="w-6 h-6 text-yellow-400" />
            ) : (
              <Moon className="w-6 h-6 text-slate-600" />
            )}
          </button>
        </div>
      </div>

      {/* Scrollable Navigation */}
      
     {/* Enhanced Scrollable Navigation */}
     <div className={`
        flex-1 overflow-y-auto
        scrollbar-thin
        ${colors.scrollbarTrack}
        ${colors.scrollbarThumb}
        hover:scrollbar-thumb-slate-400
        dark:hover:scrollbar-thumb-slate-500
        transition-colors
        scroll-smooth
        scrollbar-track-rounded-full
        scrollbar-thumb-rounded-full
        px-2
      `}>
        <nav className="p-2 space-y-6">
          {/* Main Navigation */}
          <div>
            {!isCollapsed && (
              <p className={`px-1 text-sm font-semibold ${colors.menuText} uppercase tracking-wider`}>
                Main Navigation
              </p>
            )}
            <div className="mt-2 space-y-1">
              {sidebarItems.map((item) => renderNavItem(item, location.pathname === item.path))}
            </div>
          </div>
          
          {/* Quick Navigation */}
          <div>
            {!isCollapsed && (
              <p className={`px-1 text-sm font-semibold ${colors.menuText} uppercase tracking-wider`}>
                Quick Navigation
              </p>
            )}
            <div className="mt-2 space-y-1">
              {quickNavItems.map((item) => renderNavItem(item, location.pathname === item.path))}
            </div>
          </div>

          {/* Reports Section */}
          <div>
            {!isCollapsed && (
              <p className={`px-1 text-sm font-semibold ${colors.menuText} uppercase tracking-wider`}>
                Reports & Analytics
              </p>
            )}
            <div className="mt-2">
              <button
                onClick={handleReportsClick}
                className={`flex items-center w-full p-3 rounded-lg transition-all duration-200 mx-2 group ${
                  location.pathname.startsWith("/report")
                    ? `${colors.activeBg} ${colors.activeText}`
                    : `${colors.hover} ${colors.menuText} hover:${colors.text}`
                }`}
              >
                <BarChart2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
                {!isCollapsed && (
                  <>
                    <span className="ml-3 text-sm font-medium">Reports</span>
                    <span className="ml-auto">
                      {isReportsOpen ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </span>
                  </>
                )}
              </button>
              {isReportsOpen && !isCollapsed && (
                <div className="mt-1 ml-4 space-y-1">
                  {reportsSubItems.map((item) => renderNavItem(item, location.pathname === item.path))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            {!isCollapsed && (
              <p className={`px-1 text-sm font-semibold ${colors.menuText} uppercase tracking-wider`}>
                Quick Actions
              </p>
            )}
            <div className="mt-2 space-y-1">
              {quickActions.map((item) => renderNavItem(item, location.pathname === item.path))}
            </div>
          </div>

          {/* Bills History */}
          <div>
            {!isCollapsed && (
              <p className={`px-1 text-sm font-semibold ${colors.menuText} uppercase tracking-wider`}>
                Bills History
              </p>
            )}
            <div className="mt-2 space-y-1">
              {billsHistory.map((item) => renderNavItem(item, location.pathname === item.path))}
            </div>
          </div>
        </nav>
      </div>

      {/* Logout Button */}
      <div className={`sticky bottom-0 p-4 border-t ${colors.border} ${colors.background}`}>
        <button
          onClick={handleLogout}
          className="w-full flex items-center p-3 rounded-lg transition-all duration-200
          text-red-400 hover:bg-red-500/10 hover:text-red-300 group"
        >
          <LogOut className="w-6 h-6 group-hover:scale-110 transition-transform" />
          {!isCollapsed && (
            <span className="ml-3 text-sm font-medium">Logout</span>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-3 rounded-lg bg-white dark:bg-slate-800 shadow-lg"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        <MenuIcon className="w-6 h-6" />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed lg:sticky top-0 left-0 h-screen z-40
          ${colors.background} ${colors.text} 
          transition-all duration-300 border-r ${colors.border}
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${isCollapsed ? "w-12" : "w-60"}`}
      >
        <SidebarContent />
      </aside>
    </>
  );
};

export default Sidebar;