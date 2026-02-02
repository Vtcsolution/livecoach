
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  CreditCard,
  User,
  Star,
  Sparkles,
  DollarSign,
  Zap,
  Shield,
  Timer
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import axios from 'axios';
import { useAuth } from '@/All_Components/screen/AuthContext';
const ChatRequestModal = ({ psychic, isOpen, onClose, onRequestSent, userBalance = 0, userCredits = 0 }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [chatRequest, setChatRequest] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  // API instance
  const api = axios.create({
    baseURL: import.meta.env.VITE_BASE_URL || 'http://localhost:5001',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    }
  });
  // Check for existing pending request
  useEffect(() => {
    if (isOpen && psychic?._id && user) {
      checkExistingRequest();
    }
  }, [isOpen, psychic, user]);
  const checkExistingRequest = async () => {
    try {
      setIsChecking(true);
      const response = await api.get(`/api/chatrequest/pending/${psychic._id}`);
      
      if (response.data.success && response.data.data) {
        setChatRequest(response.data.data);
      } else {
        setChatRequest(null);
      }
    } catch (error) {
      console.error('Error checking existing request:', error);
      setChatRequest(null);
    } finally {
      setIsChecking(false);
    }
  };
  // Calculate allowed minutes
  const calculateAllowedMinutes = () => {
    if (!psychic?.ratePerMin || userCredits === 0) return 0;
    return Math.floor(userCredits / psychic.ratePerMin);
  };
  // Check if user can send request
  const canSendRequest = () => {
    return userCredits >= psychic?.ratePerMin;
  };
  // Send chat request
  const handleSendRequest = async () => {
    if (!canSendRequest()) {
      toast({
        title: "Insufficient Credits",
        description: `You need at least ${psychic.ratePerMin} credits to request a chat.`,
        variant: "destructive"
      });
      return;
    }
    setIsLoading(true);
    try {
      const response = await api.post('/api/chatrequest/send-request', {
        psychicId: psychic._id
      });
      if (response.data.success) {
        setChatRequest(response.data.data);
        toast({
          title: "Request Sent!",
          description: "Your chat request has been sent to the psychic.",
          variant: "default"
        });
        
        if (onRequestSent) {
          onRequestSent(response.data.data);
        }
      }
    } catch (error) {
      console.error('Error sending request:', error);
      const errorMsg = error.response?.data?.message || 'Failed to send chat request';
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  // Accept psychic's acceptance
  const handleAcceptSession = async () => {
    if (!chatRequest) return;
    setIsLoading(true);
    try {
      const response = await api.post('/api/chatrequest/start-session', {
        requestId: chatRequest._id
      });
      if (response.data.success) {
        toast({
          title: "Session Started!",
          description: `Paid session started. You have ${response.data.data.totalMinutes} minutes.`,
          variant: "default"
        });
        onClose();
      }
    } catch (error) {
      console.error('Error starting session:', error);
      const errorMsg = error.response?.data?.message || 'Failed to start session';
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  // Cancel request
  const handleCancelRequest = async () => {
    if (!chatRequest) return;
    setIsLoading(true);
    try {
      const response = await api.delete(`/api/chatrequest/requests/${chatRequest._id}`);
      
      if (response.data.success) {
        setChatRequest(null);
        toast({
          title: "Request Cancelled",
          description: "Your chat request has been cancelled.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error cancelling request:', error);
      toast({
        title: "Error",
        description: "Failed to cancel request",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  if (!psychic) return null;
  const allowedMinutes = calculateAllowedMinutes();
  const insufficientBalance = !canSendRequest();
  const missingAmount = psychic.ratePerMin - userCredits;
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
Chatsessie aanvragen
          </DialogTitle>
          <DialogDescription>
            Stuur een chatverzoek naar {psychic.name}
          </DialogDescription>
        </DialogHeader>
        {/* Psychic Info */}
        <Card className="border-0 shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={psychic.image} />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                  {psychic.name?.[0] || 'P'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{psychic.name}</h3>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    <Star className="h-3 w-3 mr-1 fill-purple-500" />
                    {psychic.rating || 4.8}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{psychic.bio}</p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1">
                    <CreditCard className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">
                      ${psychic.ratePerMin}/min
                    </span>
                  </div>
                  {psychic.isVerified && (
                    <Badge variant="success" className="bg-green-50 text-green-700 border-green-200">
                      <Shield className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Balance Info */}
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Je portemonnee
              </div>
              <Badge variant="outline" className="text-xs">
Realtime              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="space-y-3">
           
<div className="p-3 bg-blue-50 rounded-lg border border-blue-200 mb-3">
  <div className="flex items-center justify-between">
    <span className="text-sm text-gray-600">Je credits</span>
    <span className="text-lg font-bold text-blue-600">
      {userCredits.toFixed(2)} credits {/* Show credits */}
    </span>
  </div>
  <div className="text-xs text-gray-500 mt-1">
    Balance: ${userBalance.toFixed(2)}
  </div>
</div>
              
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-600">Chattijd</span>
                  </div>
                  <div className="text-lg font-bold text-gray-800">
                    {allowedMinutes} minutes
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
Gebaseerd op huidige credits                </div>
              </div>
              {insufficientBalance && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Onvoldoende credits</span>
                  </div>
                  <p className="text-xs text-red-600 mt-1">
                    Je hebt nog ${missingAmount.toFixed(2)} nodig voor 1 minuut chat
                  </p>
                </div>
              )}
              {allowedMinutes > 0 && !insufficientBalance && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Klaar om te chatten!</span>
                  </div>
                  <p className="text-xs text-green-600 mt-1">
Je kunt {allowedMinutes} minuut{allowedMinutes !== 1 ? 'en' : ''} chatten                
  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        {/* Chat Request Status */}
        {isChecking ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-purple-600 mr-2" />
            <span className="text-sm text-gray-600">Checking request status...</span>
          </div>
        ) : chatRequest && (
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Status van aanvraag</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className={`p-3 rounded-lg ${
                chatRequest.status === 'pending' ? 'bg-yellow-50 border border-yellow-200' :
                chatRequest.status === 'accepted' ? 'bg-green-50 border border-green-200' :
                chatRequest.status === 'rejected' ? 'bg-red-50 border border-red-200' :
                'bg-gray-50 border border-gray-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {chatRequest.status === 'pending' && <Clock className="h-4 w-4 text-yellow-600" />}
                    {chatRequest.status === 'accepted' && <CheckCircle className="h-4 w-4 text-green-600" />}
                    {chatRequest.status === 'rejected' && <XCircle className="h-4 w-4 text-red-600" />}
                    <span className={`text-sm font-medium capitalize ${
                      chatRequest.status === 'pending' ? 'text-yellow-600' :
                      chatRequest.status === 'accepted' ? 'text-green-600' :
                      chatRequest.status === 'rejected' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {chatRequest.status}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(chatRequest.requestedAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                
                {chatRequest.status === 'accepted' && (
                  <p className="text-xs text-green-600 mt-2">
Medium geaccepteerd! Klik op  Start sessie  om de betaalde chat te starten.                  </p>
                )}
                
                {chatRequest.status === 'rejected' && (
                  <p className="text-xs text-red-600 mt-2">
Het medium heeft je verzoek afgewezen.                  </p>
                )}
                {chatRequest.status === 'pending' && (
                  <p className="text-xs text-yellow-600 mt-2">
Wachten op reactie van het medium…”                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        {/* Action Buttons */}
      <div className="flex flex-col gap-2">
  {!chatRequest ? (
    <Button
      onClick={handleSendRequest}
      disabled={isLoading || insufficientBalance || isChecking}
      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Verzoek verzenden...
        </>
      ) : (
        <>
Klik op het chatverzoek hieronder om de chat te starten        </>
      )}
    </Button>
  ) : chatRequest.status === 'pending' ? (
    <div className="flex gap-2">
      <Button
        onClick={handleCancelRequest}
        disabled={isLoading}
        variant="outline"
        className="flex-1"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          'Verzoek annuleren'
        )}
      </Button>
      <Button
        disabled
        className="flex-1 bg-yellow-100 text-yellow-700 hover:bg-yellow-100"
      >
        <Clock className="mr-2 h-4 w-4" />
        Wachten op reactie
      </Button>
    </div>
  ) : chatRequest.status === 'accepted' ? (
    <div className="space-y-2">
      <Button
        onClick={handleAcceptSession}
        disabled={isLoading || insufficientBalance}
        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sessie starten...
          </>
        ) : (
          <>
            <CheckCircle className="mr-2 h-4 w-4" />
            Betaalde sessie starten ({allowedMinutes} min beschikbaar)
          </>
        )}
      </Button>
      <Button
        onClick={handleCancelRequest}
        disabled={isLoading}
        variant="outline"
        className="w-full"
      >
        Sessie weigeren
      </Button>
    </div>
  ) : chatRequest.status === 'rejected' ? (
    <div className="space-y-2">
      <Button
        onClick={() => setChatRequest(null)}
        className="w-full"
      >
        Opnieuw proberen
      </Button>
      <Button
        onClick={onClose}
        variant="outline"
        className="w-full"
      >
        Sluiten
      </Button>
    </div>
  ) : null}
  {!chatRequest && insufficientBalance && (
    <Button
      onClick={() => window.location.href = '/wallet'}
      variant="outline"
      className="w-full"
    >
      <CreditCard className="mr-2 h-4 w-4" />
      Voeg ${missingAmount.toFixed(2)} toe aan Wallet
    </Button>
  )}
  <Button
    onClick={onClose}
    variant="ghost"
    className="w-full"
  >
    Sluiten
  </Button>
</div>
</DialogContent>
</Dialog>
);
};
export default ChatRequestModal;
