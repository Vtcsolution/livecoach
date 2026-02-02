import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
  Timer,
  Users,
  Calendar,
  Wallet
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import axios from 'axios';
import { usePsychicAuth } from "@/context/PsychicAuthContext";

const PsychicChatRequestModal = ({ request, user, psychic, isOpen, onClose, onAccepted, onRejected }) => {
  const { psychic: currentPsychic } = usePsychicAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [action, setAction] = useState(null); // 'accept' or 'reject'

  // API instance
  const api = axios.create({
    baseURL: import.meta.env.VITE_BASE_URL || 'http://localhost:5001',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('psychicToken')}`
    }
  });

  const handleAccept = async () => {
    if (!request || !currentPsychic) return;
    
    setIsLoading(true);
    setAction('accept');
    
    try {
      // Send acceptance to backend
      const response = await api.post('/api/chatrequest/accept-request', {
        requestId: request._id,
        psychicId: currentPsychic._id
      });
      
      if (response.data.success) {
        console.log('✅ Request accepted, response:', response.data);
        
        // IMPORTANT: Return ALL data from response, not just request
        const responseData = response.data.data;
        
        // Create optimistic session data for immediate UI update
        const optimisticSessionData = {
          ...request,
          ...responseData,
          status: 'active',
          user: user || { _id: request.userId },
          psychic: currentPsychic,
          paidSession: {
            remainingSeconds: (request.totalMinutesAllowed || 0) * 60,
            isPaused: false
          }
        };
        
        // Show success toast
        toast({
          title: "Request Accepted!",
          description: "Paid session started! Timer is running.",
          variant: "default"
        });
        
        // Call onAccepted with BOTH the original request AND response data
        if (onAccepted) {
          onAccepted(optimisticSessionData);
        }
        
        // Close modal
        onClose();
      } else {
        throw new Error(response.data.message || 'Failed to accept request');
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to accept request';
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setAction(null);
    }
  };

  const handleReject = async () => {
    if (!request || !currentPsychic) return;
    
    setIsLoading(true);
    setAction('reject');
    
    try {
      const response = await api.post('/api/chatrequest/reject-request', {
        requestId: request._id,
        psychicId: currentPsychic._id
      });
      
      if (response.data.success) {
        toast({
          title: "Request Rejected",
          description: "Chat request rejected",
          variant: "default"
        });
        
        if (onRejected) {
          onRejected(request._id);
        }
        
        onClose();
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      const errorMsg = error.response?.data?.message || 'Failed to reject request';
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setAction(null);
    }
  };

  // Handle close with cleanup
  const handleClose = () => {
    setIsLoading(false);
    setAction(null);
    onClose();
  };

  if (!request || !user || !currentPsychic) return null;

  const calculateEarnings = () => {
    const ratePerMin = request.ratePerMin || psychic?.ratePerMin || 1;
    const allowedMinutes = request.totalMinutesAllowed || 0;
    return (ratePerMin * allowedMinutes).toFixed(2);
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            New Chat Request
          </DialogTitle>
          <DialogDescription>
            Review and respond to chat request from {user.firstName}
          </DialogDescription>
        </DialogHeader>

        {/* User Info */}
        <Card className="border-0 shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.image} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                  {user.firstName?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{user.username} {user.lastName}</h3>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    <User className="h-3 w-3 mr-1" />
                    Client
                  </Badge>
                </div>
               
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Request Details */}
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Request Details</CardTitle>
          </CardHeader>
          <CardContent className="pb-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-600">Rate</span>
                </div>
                <div className="text-xl font-bold text-purple-600">
                  Credit {request.ratePerMin || psychic?.ratePerMin || 1}/min
                </div>
              </div>
              
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-1">
                  <Timer className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">Time Available</span>
                </div>
                <div className="text-xl font-bold text-green-600">
{Number(request.totalMinutesAllowed || 0).toFixed(2)} min
                </div>
              </div>
            </div>
           
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">Client Balance</span>
              </div>
              <div className="text-lg font-bold text-blue-600">
                {(request.initialBalance || 0).toFixed(2)}
              </div>
              <div className="text-xs text-blue-600 mt-1">
                Available for this session
              </div>
            </div>
            
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-600">Potential Earnings</span>
              </div>
              <div className="text-xl font-bold text-amber-600">
                {calculateEarnings()}
              </div>
              <div className="text-xs text-amber-600 mt-1">
                If session runs full time
              </div>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-xs text-gray-500 mb-1">Requested At</div>
              <div className="text-sm font-medium text-gray-700">
                {formatTime(request.requestedAt || request.createdAt)}
              </div>
            </div>
            
            {/* Session Info Note */}
            <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-indigo-600 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-indigo-600 mb-1">
                    Session Information
                  </div>
                  <p className="text-xs text-indigo-600">
                    Accepting will start a paid session immediately. Timer will begin counting down from {(request.totalMinutesAllowed || 0).toFixed(2)} minutes.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <Button
            onClick={handleAccept}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            {isLoading && action === 'accept' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Accepting...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Accept & Start Session
              </>
            )}
          </Button>
         
          <Button
            onClick={handleReject}
            disabled={isLoading}
            variant="outline"
            className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            {isLoading && action === 'reject' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Rejecting...
              </>
            ) : (
              <>
                <XCircle className="mr-2 h-4 w-4" />
                Reject Request
              </>
            )}
          </Button>
          
          <Button
            onClick={handleClose}
            variant="ghost"
            className="w-full"
            disabled={isLoading}
          >
            Close
          </Button>
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">
                {action === 'accept' ? 'Starting paid session...' : 'Processing request...'}
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PsychicChatRequestModal;