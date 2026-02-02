// components/PaymentModal.jsx
import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { Check, Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { useAuth } from "@/All_Components/screen/AuthContext";

export default function PaymentModal({ isOpen, onOpenChange, onPaymentSuccess }) {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // Fetch wallet balance when modal opens
  useEffect(() => {
    if (isOpen && user) {
      fetchWalletBalance();
    }
  }, [isOpen, user]);

  const fetchWalletBalance = async () => {
    try {
      setIsLoadingBalance(true);
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/api/wallet/balance`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setWalletBalance(response.data.credits || 0);
    } catch (error) {
      console.error("Error fetching balance:", error);
      setWalletBalance(0);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const handlePaymentMethodSelect = useCallback((method) => {
    setSelectedPaymentMethod(method);
  }, []);

  const handlePayment = async () => {
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

      if (response.data.success) {
        localStorage.setItem("lastPaymentId", response.data.paymentId);
        toast.success("Redirecting to payment gateway...");
        
        // Open payment URL in new tab
        window.open(response.data.paymentUrl, '_blank');
        
        // Close modal after short delay
        setTimeout(() => {
          onOpenChange(false);
          if (onPaymentSuccess) {
            onPaymentSuccess();
          }
        }, 1500);
      } else {
        throw new Error(response.data.message || "Payment failed");
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state
    setSelectedPlan(null);
    setSelectedPaymentMethod(null);
    setIsProcessing(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[90vw] sm:max-w-[400px] max-h-[80vh] overflow-y-auto p-4">
        <DialogHeader>
          <DialogTitle className="text-lg flex items-center justify-between">
            <span>Buy Chat Credits</span>
            {user && (
              <div className="flex items-center gap-2 text-sm font-normal">
                <Wallet className="h-4 w-4" />
                {isLoadingBalance ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <span>{walletBalance.toFixed(2)} credits</span>
                )}
              </div>
            )}
          </DialogTitle>
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
            className="w-full bg-[#3B5EB7] hover:bg-[#2d4a9b] text-white text-base font-medium py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
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
  );
}   