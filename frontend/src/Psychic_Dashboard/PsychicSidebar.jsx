// components/PsychicSidebar.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, BadgeDollarSign, ChevronRight, Fence, HandCoins, LayoutDashboard, Mail, MessageCircle, Settings, SquareUserRound, Star, User, User2Icon, LogOut } from 'lucide-react';
import { MdAttachEmail, MdEmail, MdMarkEmailRead, MdOutlineAttachEmail } from "react-icons/md";
import { usePsychicAuth } from "@/context/PsychicAuthContext";

const PsychicSidebar = ({ side }) => {
  const [isActive, setIsActive] = useState(0);
  const [isOpenToggle, setIsOpenToggle] = useState(false);
  const { logout } = usePsychicAuth();
  const navigate = useNavigate();

  const isOpen = (ind) => {
    setIsActive(ind);
    setIsOpenToggle(!isOpenToggle);
  };

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to logout?")) {
      await logout();
      navigate('/psychic/login');
    }
  };

  return (
    <div>
      <div id="sidebar-wrapper" className={`${side ? "open" : ""} bg-[#3B5EB7]`}>
        <div className="sidebar hover:overflow-y-auto h-full scrollbar-hide scrollbar-thin scrollbar-track-transparent scrollbar-thumb-blue-500 hover:scrollbar-thumb-blue-700">
          <ul className="px-2 py-6 text-white relative">
            <li id="cc" className={`flex justify-between p-2 rounded-lg mt-12 mb-4`} onClick={() => isOpen(0)}>
              <Link to='/psychic/dashboard'>
                <div className="flex justify-center space-x-2">
                  <LayoutDashboard /> <p className="cursor-pointer">Dashboard</p>
                </div>
              </Link>
            </li>
            <li id="cc" className={`flex justify-between p-2 rounded-lg my-4`} onClick={() => isOpen(1)}>
              <Link to='/psychic/dashboard/profile'>
                <div className="flex justify-center space-x-2">
                  <User /> <p className="cursor-pointer">Profile</p>
                </div>
              </Link>
            </li>
            <li id="cc" className={`flex justify-between p-2 rounded-lg my-4`} onClick={() => isOpen(2)}>
              <Link to='/psychic/dashboard/golive'>
                <div className="flex justify-center space-x-2">
                  <MessageCircle /> <p className="cursor-pointer">Go Live</p>
                </div>
              </Link>
            </li>
            <li id="cc" className={`flex justify-between p-2 rounded-lg my-4`} onClick={() => isOpen(2)}>
              <Link to='/psychic/dashboard/chats'>
                <div className="flex justify-center space-x-2">
                  <MessageCircle /> <p className="cursor-pointer">Chats</p>
                </div>
              </Link>
            </li>
            <li id="cc" className={`flex justify-between p-2 rounded-lg my-4`} onClick={() => isOpen(3)}>
              <Link to='/psychic/dashboard/earning'>
                <div className="flex justify-center space-x-2">
                  <BadgeDollarSign /> <p className="cursor-pointer">Earnings</p>
                </div>
              </Link>
            </li>
            <li id="cc" className={`flex justify-between p-2 rounded-lg my-4`} onClick={() => isOpen(4)}>
              <Link to='/psychic/dashboard/reviews'>
                <div className="flex justify-center space-x-2">
                  <Star /> <p className="cursor-pointer">Reviews</p>
                </div>
              </Link>
            </li>
            
            
            {/* Logout Button - Added here */}
            <li 
              id="cc" 
              className={`flex justify-between p-2 rounded-lg my-4`} 
              onClick={handleLogout}
            >
              <div className="flex justify-center space-x-2">
                <LogOut /> <p className="cursor-pointer">Logout</p>
              </div>
            </li>
            
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PsychicSidebar;
