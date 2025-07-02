import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Search, X, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TopMobileNavigationProps {
  activeItem: string;
  setActiveItem: (item: string) => void;
  userData?: any;
}

const TopMobileNavigation = ({
  activeItem,
  setActiveItem,
  userData,
}: TopMobileNavigationProps) => {
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const handleSearch = () => {
    if (isSearchActive) {
      // Perform search with the query
      console.log("Searching for:", searchQuery);
      // You can implement actual search functionality here
    } else {
      // Activate search mode
      setIsSearchActive(true);
    }
  };

  const closeSearch = () => {
    setIsSearchActive(false);
    setSearchQuery("");
  };

  return (
    <div className="fixed top-0 left-0 right-0 bg-bluegray-700/90 backdrop-blur-md border-b border-bluegray-600 shadow-lg lg:hidden z-40 h-14 safe-area-top">
      {/* Search functionality moved to bottom navigation */}

      <div className="flex justify-between items-center h-full px-4">
        <div className="w-8"></div>

        <div className="flex-1 flex items-center justify-center gap-3">
          {userData && (
            <Avatar className="h-8 w-8 border border-yellow-400/50">
              <AvatarImage src={userData.picture} alt={userData.name} />
              <AvatarFallback className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-bluegray-800 text-sm font-bold">
                {userData.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
          )}
          <h2
            className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-yellow-600 drop-shadow-[0_1.2px_1.2px_rgba(255,215,0,0.3)]"
            style={{ textShadow: "0 0 8px rgba(234, 179, 8, 0.3)" }}
          >
            Yacin Gym
          </h2>
        </div>

        <motion.div
          className="p-2.5 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-300 border border-red-400/30"
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
          onClick={handleLogout}
        >
          <LogOut size={16} className="text-white" />
        </motion.div>
      </div>
    </div>
  );
};

export default TopMobileNavigation;
