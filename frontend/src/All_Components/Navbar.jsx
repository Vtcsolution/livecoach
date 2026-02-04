import {
  AlignJustify,
  Wallet,
  Check,
  UserCircle,
  Users,
  ChevronDown,
  LogIn,
  UserPlus,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./screen/AuthContext";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import axios from "axios";
import io from "socket.io-client";

export default function Navbar({ onOpenPaymentModal }) {
  const [menubar, setMenubar] = useState(false);
  const { user, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [socket, setSocket] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const handlePaymentMethodSelect = useCallback((method) => {
    setSelectedPaymentMethod(method);
  }, []);

  const openPaymentModal = useCallback(() => {
    setIsPaymentModalOpen(true);
  }, []);

  useEffect(() => {
    if (onOpenPaymentModal) {
      onOpenPaymentModal(openPaymentModal);
    }
  }, [onOpenPaymentModal, openPaymentModal]);

  useEffect(() => {
    if (authLoading || !user) {
      setIsLoadingBalance(false);
      return;
    }

    // Initialize Socket.IO connection
    const newSocket = io(import.meta.env.VITE_BASE_URL, {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    setSocket(newSocket);

    // Handle connection
    newSocket.on("connect", () => {
      console.log("Socket.IO connected, joining room:", user._id);
      newSocket.emit("join", user._id);
    });

    // Listen for walletUpdate event
    newSocket.on("walletUpdate", (data) => {
      console.log("Received walletUpdate:", data);
      setWalletBalance(data.credits || 0);
      setIsLoadingBalance(false);
    });

    // Handle connection errors
    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      toast.error("Connection issue. Please check your network.");
      setIsLoadingBalance(false);
    });

    // Fetch initial wallet balance
    const fetchWalletBalance = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          toast.error("Please log in again to access your credits.");
          navigate("/login");
          return;
        }
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/api/wallet/balance`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log("Fetched wallet balance:", response.data);
        setWalletBalance(response.data.credits || 0);
        setIsLoadingBalance(false);
      } catch (error) {
        console.error("Error fetching balance:", error);
        setWalletBalance(0);
        setIsLoadingBalance(false);
      }
    };

    fetchWalletBalance();

    // Polling every 30 seconds as a fallback
    const pollingInterval = setInterval(fetchWalletBalance, 30000);

    // Cleanup on unmount
    return () => {
      console.log("Disconnecting Socket.IO and clearing polling");
      newSocket.disconnect();
      setSocket(null);
      clearInterval(pollingInterval);
    };
  }, [user, authLoading, navigate]);

  const handleMenu = useCallback(() => {
    setMenubar((prev) => !prev);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    toast.success("Logout successful");
    navigate("/");
  }, [logout, navigate]);

  const handlePayment = useCallback(async () => {
    if (!selectedPaymentMethod || !selectedPlan) {
      toast.error("Please select a payment method and plan.");
      return;
    }

    setIsProcessing(true);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/payments/topup`,
        {
          amount: selectedPlan.price,
          planName: selectedPlan.name,
          creditsPurchased: selectedPlan.credits,
          paymentMethod: selectedPaymentMethod,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      localStorage.setItem("lastPaymentId", response.data.paymentId);
      window.location.href = response.data.paymentUrl;
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [selectedPaymentMethod, selectedPlan]);

  // Animation variants for menu items
  const menuItemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
  };

  // Animation for credit balance
  const balanceVariants = {
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <>
      {/* Mobile Menu Overlay */}
      {menubar && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={handleMenu}
        />
      )}
      
      <div
        className={`w-full lg:hidden duration-300 transition-all fixed top-[95px] z-50 ${
          menubar ? "left-0" : "left-[-100%]"
        }`}
      >
        <motion.ul
          className="w-full flex flex-col gap-4 bg-[#EEEEEE] py-4 px-4 h-screen"
          initial="hidden"
          animate={menubar ? "visible" : "hidden"}
          exit="exit"
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          <motion.li variants={menuItemVariants}>
            <Link onClick={handleMenu} to="/" className="block py-2">
              <span className="text-[#3B5EB7] hover:text-[#88a7f5] cursor-pointer text-lg font-medium">
                Home
              </span>
            </Link>
          </motion.li>
          <motion.li variants={menuItemVariants}>
            <Link onClick={handleMenu} to="/about" className="block py-2">
              <span className="text-[#3B5EB7] hover:text-[#88a7f5] cursor-pointer text-lg font-medium">
                About
              </span>
            </Link>
          </motion.li>
          <motion.li variants={menuItemVariants}>
            <Link onClick={handleMenu} to="/contact" className="block py-2">
              <span className="text-[#3B5EB7] hover:text-[#88a7f5] cursor-pointer text-lg font-medium">
                Contact
              </span>
            </Link>
          </motion.li>
          <motion.li variants={menuItemVariants}>
            <Link onClick={handleMenu} to="/terms-&-conditions" className="block py-2">
              <span className="text-[#3B5EB7] hover:text-[#88a7f5] cursor-pointer text-lg font-medium">
                Terms & Conditions
              </span>
            </Link>
          </motion.li>
          {user && (
            <>
              <motion.li variants={menuItemVariants} className="py-2">
                <Link
                  onClick={handleMenu}
                  to="/dashboard"
                  className="inline-block bg-blue-100 hover:bg-blue-200 text-[#3B5EB7] hover:text-[#2d4a9b] cursor-pointer text-lg font-medium px-4 py-2 rounded-md transition-colors duration-200"
                >
                  Dashboard
                </Link>
              </motion.li>
              <motion.li variants={menuItemVariants} className="py-2">
                <button
                  onClick={() => {
                    handleMenu();
                    handleLogout();
                  }}
                  className="inline-block bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-800 cursor-pointer text-lg font-medium px-4 py-2 rounded-md transition-colors duration-200 w-full text-left"
                >
                  Logout
                </button>
              </motion.li>
            </>
          )}
          {!user && (
            <>
              {/* Mobile: Separate buttons */}
              <motion.div variants={menuItemVariants} className="mt-4">
                <h3 className="text-[#3B5EB7] font-medium text-lg mb-3">For Users</h3>
                <div className="flex flex-col gap-2">
                  <Link to="/login" onClick={handleMenu}>
                    <Button
                      variant="outline"
                      className="w-full bg-white hover:bg-[#3B5EB7] hover:text-white transition-colors duration-300 py-2 flex items-center gap-2"
                    >
                      <LogIn className="h-4 w-4" />
                      User Login
                    </Button>
                  </Link>
                  <Link to="/register" onClick={handleMenu}>
                    <Button
                      variant="outline"
                      className="w-full bg-white hover:bg-[#3B5EB7] hover:text-white transition-colors duration-300 py-2 flex items-center gap-2"
                    >
                      <UserPlus className="h-4 w-4" />
                      User Register
                    </Button>
                  </Link>
                </div>
              </motion.div>
              
              <motion.div variants={menuItemVariants} className="mt-4">
                <h3 className="text-[#3B5EB7] font-medium text-lg mb-3">For Coaches</h3>
                <div className="flex flex-col gap-2">
                  <Link to="/psychic/login" onClick={handleMenu}>
                    <Button
                      variant="outline"
                      className="w-full bg-white hover:bg-[#10b981] hover:text-white transition-colors duration-300 py-2 flex items-center gap-2"
                    >
                      <LogIn className="h-4 w-4" />
                      Coach Login
                    </Button>
                  </Link>
                  <Link to="/psychic/register" onClick={handleMenu}>
                    <Button
                      variant="outline"
                      className="w-full bg-white hover:bg-[#10b981] hover:text-white transition-colors duration-300 py-2 flex items-center gap-2"
                    >
                      <UserPlus className="h-4 w-4" />
                      Coach Register
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </>
          )}
        </motion.ul>
      </div>
      
      <header className="overflow-hidden border-b top-0 bg-[#EEEEEE] z-[100] shadow-sm relative">
        <div className="container mx-auto px-4 py-3 max-w-7xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1">
              <Link to="/">
                <motion.img
                  src="/images/newLogo.jpg"
                  alt="logo"
                  className="h-16 w-16 rounded-full object-cover"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                />
              </Link>
            </div>
            <div className="flex items-center gap-6">
              <motion.ul
                className="flex max-lg:hidden items-center gap-6"
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
              >
                <motion.li variants={menuItemVariants}>
                  <Link to="/">
                    <span className="text-[#3B5EB7] hover:text-[#88a7f5] cursor-pointer text-lg font-medium">
                      Home
                    </span>
                  </Link>
                </motion.li>
                <motion.li variants={menuItemVariants}>
                  <Link to="/about">
                    <span className="text-[#3B5EB7] hover:text-[#88a7f5] cursor-pointer text-lg font-medium">
                      About
                    </span>
                  </Link>
                </motion.li>
                <motion.li variants={menuItemVariants}>
                  <Link to="/contact">
                    <span className="text-[#3B5EB7] hover:text-[#88a7f5] cursor-pointer text-lg font-medium">
                      Contact
                    </span>
                  </Link>
                </motion.li>
                <motion.li variants={menuItemVariants}>
                  <Link to="/terms-&-conditions">
                    <span className="text-[#3B5EB7] hover:text-[#88a7f5] cursor-pointer text-lg font-medium">
                      Terms & Conditions
                    </span>
                  </Link>
                </motion.li>
                
                {user && (
                  <>
                    <motion.li variants={menuItemVariants}>
                      <Link
                        to="/dashboard"
                        className="inline-block bg-blue-100 hover:bg-blue-200 text-[#3B5EB7] hover:text-[#2d4a9b] cursor-pointer text-lg font-medium px-4 py-2 rounded-md transition-colors duration-200"
                      >
                        Dashboard
                      </Link>
                    </motion.li>
                    <motion.li variants={menuItemVariants}>
                      <button
                        onClick={handleLogout}
                        className="inline-block bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-800 cursor-pointer text-lg font-medium px-4 py-2 rounded-md transition-colors duration-200"
                      >
                        Logout
                      </button>
                    </motion.li>
                  </>
                )}
              </motion.ul>
              
              {!user && (
                <motion.div 
                  variants={menuItemVariants} 
                  className="flex max-lg:hidden items-center gap-4"
                >
                  {/* User Login Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="bg-white hover:bg-[#3B5EB7] hover:text-white transition-colors duration-300 flex items-center gap-2"
                      >
                        <UserCircle className="h-4 w-4" />
                        User Login
                        <ChevronDown className="h-3 w-3 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel className="text-xs font-normal text-gray-500">
                        For Clients
                      </DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link to="/login" className="cursor-pointer flex items-center gap-2">
                          <LogIn className="h-4 w-4" />
                          <div>
                            <div className="font-medium">Login</div>
                            <div className="text-xs text-gray-500">Access your account</div>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/register" className="cursor-pointer flex items-center gap-2">
                          <UserPlus className="h-4 w-4" />
                          <div>
                            <div className="font-medium">Register</div>
                            <div className="text-xs text-gray-500">Create new account</div>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Psychic Login Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="bg-white hover:bg-[#10b981] hover:text-white transition-colors duration-300 flex items-center gap-2"
                      >
                        <Users className="h-4 w-4" />
                        Coach Login
                        <ChevronDown className="h-3 w-3 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel className="text-xs font-normal text-gray-500">
                        For Psychic Coaches
                      </DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link to="/psychic/login" className="cursor-pointer flex items-center gap-2">
                          <LogIn className="h-4 w-4" />
                          <div>
                            <div className="font-medium">Coach Login</div>
                            <div className="text-xs text-gray-500">Access coach panel</div>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/psychic/register" className="cursor-pointer flex items-center gap-2">
                          <UserPlus className="h-4 w-4" />
                          <div>
                            <div className="font-medium">Coach Register</div>
                            <div className="text-xs text-gray-500">Join as psychic</div>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>
              )}
              
              <div className="lg:hidden z-[50]">
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <AlignJustify onClick={handleMenu} className="cursor-pointer text-[#3B5EB7]" />
                </motion.div>
              </div>
              
              {user && (
                <div className="flex items-center gap-4">
                  <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
                    <DialogTrigger asChild>
                      <motion.div
                        className="inline-block bg-[#3B5EB7] hover:bg-[#2d4a9b] text-white text-sm font-medium px-3 py-2 rounded-md transition-colors duration-200 flex items-center gap-2 cursor-pointer"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Wallet className="h-5 w-5" />
                        {authLoading || isLoadingBalance ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Loading...</span>
                          </div>
                        ) : (
                          <motion.span
                            key={walletBalance}
                            variants={balanceVariants}
                            initial="initial"
                            animate="animate"
                          >
                            Credits: {walletBalance.toFixed(2)}
                          </motion.span>
                        )}
                      </motion.div>
                    </DialogTrigger>
                    <DialogContent className="max-w-[90vw] sm:max-w-[400px] max-h-[80vh] overflow-y-auto p-4">
                      <DialogHeader>
                        <DialogTitle className="text-lg">Buy Chat Credits</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <h3 className="text-base font-medium text-center">
                            Choose a credit package
                          </h3>
                          <div className="grid gap-3">
                            {[
                              {
                                name: "Starter Plan",
                                credits: 10,
                                price: 6.99,
                                pricePerMinute: 0.70,
                              },
                              {
                                name: "Popular Plan",
                                credits: 20,
                                price: 11.99,
                                pricePerMinute: 0.60,
                                isPopular: true,
                              },
                              {
                                name: "Deep Dive Plan",
                                credits: 30,
                                price: 16.99,
                                pricePerMinute: 0.57,
                              },
                            ].map((plan) => (
                              <motion.div
                                key={plan.name}
                                className={`border rounded-lg p-3 cursor-pointer transition-all relative ${
                                  selectedPlan?.name === plan.name
                                    ? "border-blue-500 bg-blue-50"
                                    : "border-gray-200"
                                }`}
                                onClick={() => setSelectedPlan(plan)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                {plan.isPopular && (
                                  <div className="absolute top-0 right-0 bg-yellow-400 text-xs font-bold px-1.5 py-0.5 rounded-bl-md rounded-tr-md">
                                    POPULAR
                                  </div>
                                )}
                                <div className="flex justify-between items-center">
                                  <div>
                                    <h4 className="font-medium text-base">{plan.name}</h4>
                                    <p className="text-sm text-gray-500">
                                      {plan.credits} credits ({plan.credits} minutes)
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold text-base">€{plan.price.toFixed(2)}</p>
                                    <p className="text-xs text-gray-500">
                                      €{plan.pricePerMinute.toFixed(2)}/min
                                    </p>
                                  </div>
                                </div>
                                {selectedPlan?.name === plan.name && (
                                  <div className="mt-1 text-right">
                                    <Check className="w-5 h-5 text-blue-500 inline" />
                                  </div>
                                )}
                              </motion.div>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-base font-medium text-center">
                            Select Payment Method
                          </h3>
                          <div className="space-y-1">
                            {[
                              { id: "ideal", name: "iDEAL", icon: "https://www.mollie.com/external/icons/payment-methods/ideal.png" },
                              { id: "creditcard", name: "Credit Card", icon: "https://www.mollie.com/external/icons/payment-methods/creditcard.png" },
                              { id: "bancontact", name: "Bancontact", icon: "https://www.mollie.com/external/icons/payment-methods/bancontact.png" },
                            ].map((method) => (
                              <motion.button
                                key={method.id}
                                className={`w-full flex justify-between items-center py-2 px-3 border rounded-md text-base ${
                                  selectedPaymentMethod === method.id
                                    ? "border-blue-500 bg-blue-50"
                                    : "border-gray-200"
                                }`}
                                onClick={() => handlePaymentMethodSelect(method.id)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <div className="flex items-center space-x-2">
                                  <img src={method.icon} alt={method.name} className="h-5" />
                                  <span className="font-medium">{method.name}</span>
                                </div>
                                {selectedPaymentMethod === method.id && (
                                  <Check className="w-5 h-5 text-blue-500" />
                                )}
                              </motion.button>
                            ))}
                          </div>
                        </div>
                        <motion.button
                          className="w-full bg-[#3B5EB7] hover:bg-[#2d4a9b] text-white text-base font-medium py-2 rounded-md"
                          disabled={!selectedPaymentMethod || !selectedPlan || isProcessing}
                          onClick={handlePayment}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {isProcessing ? (
                            <div className="flex items-center gap-2 justify-center">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Processing...</span>
                            </div>
                          ) : (
                            `Pay €${selectedPlan?.price?.toFixed(2) || "0.00"}`
                          )}
                        </motion.button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
