import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Users,
  CreditCard,
  BarChart3,
  QrCode,
  LogOut,
  RefreshCw,
} from "lucide-react";
import QrScannerDialog from "../attendance/QrScannerDialog";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileNavigationProps {
  activeItem: string;
  setActiveItem: (item: string) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const MobileNavigation = ({
  activeItem,
  setActiveItem,
  onRefresh,
  isRefreshing = false,
}: MobileNavigationProps) => {
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleScan = (data: string) => {
    console.log("QR Code scanned:", data);
    // Handle the scanned data here
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const handleSearch = () => {
    if (!isSearchActive) {
      setIsSearchActive(true);
    } else if (searchQuery.trim()) {
      // Perform search with the query
      console.log("Searching for:", searchQuery);
      // You can implement actual search functionality here
      // For example: filter members, navigate to search results, etc.
    }
  };

  const closeSearch = () => {
    setIsSearchActive(false);
    setSearchQuery("");
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log("Searching for:", searchQuery);
      // Implement search functionality here
    }
  };

  // Auto-focus search input when activated
  useEffect(() => {
    if (isSearchActive && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchActive]);

  return (
    <>
      {/* Refresh Button - Fixed at top right */}
      {onRefresh && (
        <div className="fixed top-4 right-4 z-50 lg:hidden">
          <Button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white shadow-lg rounded-full p-3"
          >
            <RefreshCw
              className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      )}

      <QrScannerDialog
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        onScan={handleScan}
      />

      <div className="fixed bottom-0 left-0 right-0 bg-bluegray-700/90 backdrop-blur-md border-t border-bluegray-600 shadow-2xl lg:hidden z-50">
        <div className="flex justify-around items-center px-2 py-3 pb-6 relative safe-area-bottom">
          <motion.div
            className={`flex flex-col items-center p-2 rounded-xl min-w-[60px] ${activeItem === "dashboard" ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20" : ""}`}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveItem("dashboard")}
          >
            <Home
              size={20}
              className={
                activeItem === "dashboard" ? "text-blue-400" : "text-gray-400"
              }
            />
            <span
              className={`text-xs mt-1 font-medium ${activeItem === "dashboard" ? "text-blue-400" : "text-gray-400"}`}
            >
              الرئيسية
            </span>
          </motion.div>

          <motion.div
            className={`flex flex-col items-center p-2 rounded-xl min-w-[60px] ${activeItem === "attendance" ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20" : ""}`}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveItem("attendance")}
          >
            <Users
              size={20}
              className={
                activeItem === "attendance" ? "text-blue-400" : "text-gray-400"
              }
            />
            <span
              className={`text-xs mt-1 font-medium ${activeItem === "attendance" ? "text-blue-400" : "text-gray-400"}`}
            >
              الأعضاء
            </span>
          </motion.div>

          {/* QR Code - Fixed in center above menu bar */}
          <div className="absolute -top-14 inset-x-0 flex justify-center items-center z-20 pointer-events-none">
            {/* QR Code Button */}
            <motion.div
              className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 shadow-xl border-2 border-white/20 pointer-events-auto"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsQrScannerOpen(true)}
            >
              <QrCode size={22} className="text-white" />
            </motion.div>
          </div>

          <motion.div
            className={`flex flex-col items-center p-2 rounded-xl min-w-[60px] ${activeItem === "payments" ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20" : ""}`}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveItem("payments")}
          >
            <CreditCard
              size={20}
              className={
                activeItem === "payments" ? "text-blue-400" : "text-gray-400"
              }
            />
            <span
              className={`text-xs mt-1 font-medium ${activeItem === "payments" ? "text-blue-400" : "text-gray-400"}`}
            >
              المدفوعات
            </span>
          </motion.div>

          <motion.div
            className={`flex flex-col items-center p-2 rounded-xl min-w-[60px] ${activeItem === "reports" ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20" : ""}`}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveItem("reports")}
          >
            <BarChart3
              size={20}
              className={
                activeItem === "reports" ? "text-blue-400" : "text-gray-400"
              }
            />
            <span
              className={`text-xs mt-1 font-medium ${activeItem === "reports" ? "text-blue-400" : "text-gray-400"}`}
            >
              التقارير
            </span>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default MobileNavigation;
