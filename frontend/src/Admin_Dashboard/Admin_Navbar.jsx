import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { 
  AlertTriangle, Bell, Calendar, Heart, Info, LayoutDashboard, 
  LogOut, Menu, MessageSquare, Settings, ShoppingCart, User, 
  ExternalLink 
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAdminAuth } from "@/context/AdminAuthContext";
import axios from "axios";
import { toast } from "sonner";

const Dashboard_Navbar = ({ side, setSide }) => {
  const [isOpen1, setIsOpen1] = useState(false);
  const { admin, setAdmin } = useAdminAuth();
  const navigate = useNavigate();

  // Website URL from environment variables
  const WEBSITE_URL = import.meta.env.VITE_WEBSITE_URL || 'https://www.spiritueelchatten.nl';

  const handleLogout = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_BASE_URL}/api/admin/logout`, {}, { withCredentials: true });
      toast.success("Logged out successfully");
      setAdmin(null);
      navigate("/admin/login");
    } catch (err) {
      console.error("Logout failed", err);
      toast.error("Failed to logout");
    }
  };

  const toggleDropdown = () => setIsOpen1(!isOpen1);

  // Handle visit website redirect
  const handleVisitWebsite = () => {
    window.open(WEBSITE_URL, '_blank'); // Opens in new tab
    // Alternative: window.location.href = WEBSITE_URL; // Opens in current tab
  };

  return (
    <div className="h-[60px] border-b fixed top-0 left-0 right-0 z-[100] bg-[#3B5EB7] flex justify-between items-center lg:px-20 md:px-10 px-4">
      
      {/* Logo + Menu Button */}
      <div className="logo flex items-center gap-2 md:gap-4">
        <div className='my-2 bg-[#3B5EB7] border border-gray-200 p-2 min-[950px]:hidden text-white inline-block rounded-md'>
          <Menu onClick={() => setSide(!side)} className="h-5 w-5" />
        </div>
        
          <img 
            src="/images/newLogo.jpg" 
            alt="Spiritueel Chatten Logo" 
            className="w-12 h-12 object-cover rounded-full border border-gray-100 shadow-sm hover:scale-105 transition-transform duration-200 cursor-pointer"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
       
      </div>

      {/* Center Section - Visit Website Button */}
      <div className="flex-1 flex justify-center items-center mx-4 hidden md:flex">
        <Button
          variant="outline"
          size="sm"
          onClick={handleVisitWebsite}
          className="flex items-center gap-2 bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 hover:border-white/50 transition-all duration-200"
        >
          <ExternalLink className="h-4 w-4" />
          Visit Website
        </Button>
      </div>

      {/* Admin Avatar Dropdown */}
      <div className="flex items-center gap-4 relative">
        {/* Mobile Visit Website Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleVisitWebsite}
          className="md:hidden text-white hover:bg-white/20 hover:text-white"
          title="Visit Website"
        >
          <ExternalLink className="h-5 w-5" />
        </Button>

        <Button
          variant="brand"
          size="icon"
          className="relative rounded-full bg-white/20 backdrop-blur-sm border-white/30 hover:bg-white/30"
          onClick={toggleDropdown}
        >
          <Avatar className="w-10 h-10">
            {admin?.image ? (
              <AvatarImage src={admin.image} alt="admin avatar" />
            ) : (
              <AvatarFallback className="bg-white text-[#3B5EB7]">
                <User className="w-6 h-6" />
              </AvatarFallback>
            )}
          </Avatar>
        </Button>

        <AnimatePresence>
          {isOpen1 && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-16 z-50 w-56 rounded-lg border bg-white shadow-lg"
            >
              <ul className="p-4 space-y-4">
                <Link to="/admin/dashboard/profile">
                  <li className="flex items-center gap-2 cursor-pointer p-2 rounded-md hover:bg-gray-100 transition-colors">
                    <LayoutDashboard className="h-4 w-4" /> Profile
                  </li>
                </Link>
                <Link to="/admin/dashboard/updateprofile">
                  <li className="flex items-center gap-2 cursor-pointer p-2 rounded-md hover:bg-gray-100 transition-colors">
                    <Settings className="h-4 w-4" /> Update Profile
                  </li>
                </Link>
                <li className="flex items-center gap-2 cursor-pointer p-2 rounded-md hover:bg-gray-100 transition-colors" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" /> Logout
                </li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Dashboard_Navbar;