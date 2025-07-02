import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  className?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const Sidebar = ({
  className = "",
  onRefresh,
  isRefreshing = false,
}: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const navItems = [
    {
      icon: <LayoutDashboard size={20} />,
      label: "لوحة التحكم",
      path: "/home",
    },
    { icon: <Users size={20} />, label: "تسجيل الحضور", path: "/attendance" },
    { icon: <CreditCard size={20} />, label: "المدفوعات", path: "/payments" },
    { icon: <BarChart3 size={20} />, label: "التقارير", path: "/reports" },
    { icon: <Settings size={20} />, label: "الإعدادات", path: "/settings" },
  ];

  const sidebarVariants = {
    expanded: { width: 280 },
    collapsed: { width: 80 },
  };

  const mobileMenuVariants = {
    open: { opacity: 1, x: 0 },
    closed: { opacity: 0, x: "-100%" },
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.div
        className={cn(
          "hidden h-screen bg-white/10 backdrop-blur-xl border-r border-white/20 shadow-lg z-20 fixed top-0 left-0 md:flex flex-col",
          className,
        )}
        variants={sidebarVariants}
        initial="expanded"
        animate={isCollapsed ? "collapsed" : "expanded"}
        transition={{ duration: 0.3 }}
      >
        {/* Logo Area */}
        <div className="flex items-center justify-between p-4 border-b border-white/20">
          {!isCollapsed && (
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 flex items-center justify-center overflow-hidden">
                <img
                  src="/yacin-gym-logo.png"
                  alt="Yacin Gym"
                  className="w-8 h-8 object-contain"
                />
              </div>
              <h1 className="ml-3 text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                Yacin Gym
              </h1>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <Menu size={20} className="text-gray-700" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="px-2 space-y-1">
            {navItems.map((item, index) => (
              <Link
                key={index}
                to={item.path}
                className={cn(
                  "flex items-center p-3 rounded-lg text-gray-700 hover:bg-white/20 transition-all group",
                  isCollapsed ? "justify-center" : "justify-start",
                )}
              >
                <div className="p-2 rounded-full bg-white/20 group-hover:bg-gradient-to-r group-hover:from-blue-500 group-hover:to-purple-600 group-hover:text-white transition-all">
                  {item.icon}
                </div>
                {!isCollapsed && <span className="ml-3">{item.label}</span>}
              </Link>
            ))}
          </nav>

          {/* Refresh Button */}
          {onRefresh && (
            <div className="px-2 mt-4">
              <Button
                onClick={onRefresh}
                disabled={isRefreshing}
                className={cn(
                  "w-full bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white transition-all",
                  isCollapsed ? "px-2" : "px-4",
                )}
              >
                <RefreshCw
                  className={cn("h-4 w-4", isRefreshing && "animate-spin")}
                />
                {!isCollapsed && (
                  <span className="ml-2">
                    {isRefreshing ? "جاري التحديث..." : "تحديث"}
                  </span>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <div className="p-4 border-t border-white/20">
          <button
            className={cn(
              "flex items-center p-3 rounded-lg text-gray-700 hover:bg-white/20 transition-all w-full",
              isCollapsed ? "justify-center" : "justify-start",
            )}
          >
            <div className="p-2 rounded-full bg-white/20 hover:bg-red-500 hover:text-white transition-all">
              <LogOut size={20} />
            </div>
            {!isCollapsed && <span className="ml-3">تسجيل الخروج</span>}
          </button>
        </div>
      </motion.div>

      {/* Mobile Menu Button */}
      <div className="fixed top-4 left-4 z-30 md:hidden">
        <button
          onClick={toggleMobileMenu}
          className="p-2 rounded-full bg-white/20 backdrop-blur-xl shadow-lg hover:bg-white/30 transition-all"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Mobile Menu */}
      <motion.div
        className="fixed top-0 left-0 h-screen w-64 bg-white/10 backdrop-blur-xl border-r border-white/20 shadow-lg z-30 md:hidden"
        variants={mobileMenuVariants}
        initial="closed"
        animate={isMobileMenuOpen ? "open" : "closed"}
        transition={{ duration: 0.3 }}
      >
        {/* Logo Area */}
        <div className="flex items-center p-4 border-b border-white/20">
          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 flex items-center justify-center overflow-hidden">
            <img
              src="/yacin-gym-logo.png"
              alt="Yacin Gym"
              className="w-8 h-8 object-contain"
            />
          </div>
          <h1 className="ml-3 text-xl font-bold bg-gradient-to-r from-yellow-500 to-yellow-600 bg-clip-text text-transparent">
            Yacin Gym
          </h1>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="px-2 space-y-1">
            {navItems.map((item, index) => (
              <Link
                key={index}
                to={item.path}
                className="flex items-center p-3 rounded-lg text-gray-700 hover:bg-white/20 transition-all"
                onClick={toggleMobileMenu}
              >
                <div className="p-2 rounded-full bg-white/20 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white transition-all">
                  {item.icon}
                </div>
                <span className="ml-3">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Logout Button */}
        <div className="p-4 border-t border-white/20">
          <Link
            to="/login"
            className="flex items-center p-3 rounded-lg text-gray-700 hover:bg-white/20 transition-all w-full"
            onClick={() => {
              // Clear any stored user data
              localStorage.removeItem("user");
              sessionStorage.removeItem("user");
            }}
          >
            <div className="p-2 rounded-full bg-white/20 hover:bg-red-500 hover:text-white transition-all">
              <LogOut size={20} />
            </div>
            <span className="ml-3">تسجيل الخروج</span>
          </Link>
        </div>
      </motion.div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-white/10 backdrop-blur-xl border-t border-white/20 shadow-lg z-20 md:hidden flex justify-around items-center">
        {navItems.slice(0, 4).map((item, index) => (
          <Link
            key={index}
            to={item.path}
            className="flex flex-col items-center justify-center h-full w-full text-gray-700 hover:bg-white/20 transition-all"
          >
            <div className="p-1 rounded-full hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white transition-all">
              {item.icon}
            </div>
            <span className="text-xs mt-1">{item.label}</span>
          </Link>
        ))}
      </div>
    </>
  );
};

export default Sidebar;
