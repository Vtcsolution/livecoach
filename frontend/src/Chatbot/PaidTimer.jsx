import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Clock, PauseCircle, PlayCircle, StopCircle, AlertCircle, CreditCard, Zap } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import axios from 'axios';

const PaidTimer = ({ chatRequestId, psychic, onSessionEnd, onBalanceUpdate }) => {
  const { toast } = useToast();
  const [timerData, setTimerData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const socketRef = useRef(null);
  const timerInterval = useRef(null);

  // API instance
  const api = axios.create({
    baseURL: import.meta.env.VITE_BASE_URL || 'http://localhost:5001',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    }
  });

  // Initialize WebSocket connection
  const initializeSocket = () => {
    const token = localStorage.getItem('accessToken');
    if (!token || !chatRequestId) return;

    try {
      socketRef.current = io(import.meta.env.VITE_BASE_URL || 'http://localhost:5001', {
        auth: { token },
        transports: ['websocket', 'polling']
      });

      // Socket event handlers
      socketRef.current.on('connect', () => {
        console.log('✅ Timer socket connected');
        // Join timer room
        socketRef.current.emit('join_timer_room', {
          requestId: chatRequestId,
          userId: JSON.parse(localStorage.getItem('user'))._id,
          userRole: 'user'
        });
      });

      socketRef.current.on('timer_state', (data) => {
        console.log('📊 Received timer state:', data);
        setTimerData(data);
        setRemainingSeconds(data.remainingSeconds);
        setElapsedSeconds(data.totalSeconds - data.remainingSeconds);
        setIsPaused(data.status === 'paused');
        
        if (data.status === 'active' && !data.isPaused) {
          startLocalTimer(data.remainingSeconds);
        }
      });

      socketRef.current.on('timer_tick', (data) => {
        console.log('⏰ Timer tick:', data);
        setRemainingSeconds(data.remainingSeconds);
        setElapsedSeconds(data.elapsedSeconds);
      });

      socketRef.current.on('balance_updated', (data) => {
        console.log('💰 Balance updated:', data);
        setTimerData(prev => ({
          ...prev,
          remainingBalance: data.newBalance
        }));
        
        if (onBalanceUpdate) {
          onBalanceUpdate(data.newBalance);
        }
        
        toast({
          title: "Balance Updated",
          description: `$${data.deductedAmount.toFixed(2)} deducted`,
          variant: "default"
        });
      });

      socketRef.current.on('timer_paused', (data) => {
        console.log('⏸️ Timer paused:', data);
        setIsPaused(true);
        clearInterval(timerInterval.current);
        toast({
          title: "Timer Paused",
          description: "Session paused",
          variant: "default"
        });
      });

      socketRef.current.on('timer_resumed', (data) => {
        console.log('▶️ Timer resumed:', data);
        setIsPaused(false);
        startLocalTimer(remainingSeconds);
        toast({
          title: "Timer Resumed",
          description: "Session resumed",
          variant: "default"
        });
      });

      socketRef.current.on('session_ended', (data) => {
        console.log('🛑 Session ended:', data);
        clearInterval(timerInterval.current);
        toast({
          title: "Session Ended",
          description: "Paid session has ended",
          variant: "default"
        });
        
        if (onSessionEnd) {
          onSessionEnd(data);
        }
      });

      socketRef.current.on('balance_low', (data) => {
        toast({
          title: "Low Balance",
          description: data.message,
          variant: "warning"
        });
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

    } catch (error) {
      console.error('Socket initialization error:', error);
    }
  };

  // Start local timer for real-time countdown
  const startLocalTimer = (initialSeconds) => {
    clearInterval(timerInterval.current);
    
    setRemainingSeconds(initialSeconds);
    
    timerInterval.current = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timerInterval.current);
          return 0;
        }
        return prev - 1;
      });
      
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
  };

  // Fetch initial timer data
  const fetchTimerData = async () => {
    if (!chatRequestId) return;

    try {
      setIsLoading(true);
      const response = await api.get(`/api/chatrequest/active-session`);
      
      if (response.data.success && response.data.data) {
        const session = response.data.data;
        const timer = {
          remainingSeconds: session.paidSession?.remainingSeconds || 0,
          remainingBalance: session.remainingBalance || 0,
          ratePerMin: session.ratePerMin || 0,
          status: session.status || 'active',
          isPaused: session.paidSession?.isPaused || false,
          totalSeconds: session.paidSession?.totalSeconds || 0
        };
        
        setTimerData(timer);
        setRemainingSeconds(timer.remainingSeconds);
        setElapsedSeconds(timer.totalSeconds - timer.remainingSeconds);
        setIsPaused(timer.isPaused);
        
        if (timer.status === 'active' && !timer.isPaused) {
          startLocalTimer(timer.remainingSeconds);
        }
      }
    } catch (error) {
      console.error('Error fetching timer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Control functions
  const handlePauseTimer = async () => {
    if (!chatRequestId) return;

    try {
      setIsUpdating(true);
      const response = await api.post('/api/chatrequest/pause-timer', {
        requestId: chatRequestId
      });

      if (response.data.success) {
        if (socketRef.current?.connected) {
          socketRef.current.emit('pause_timer', {
            requestId: chatRequestId,
            userId: JSON.parse(localStorage.getItem('user'))._id
          });
        }
      }
    } catch (error) {
      console.error('Error pausing timer:', error);
      toast({
        title: "Error",
        description: "Failed to pause timer",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResumeTimer = async () => {
    if (!chatRequestId) return;

    try {
      setIsUpdating(true);
      const response = await api.post('/api/chatrequest/resume-timer', {
        requestId: chatRequestId
      });

      if (response.data.success) {
        if (socketRef.current?.connected) {
          socketRef.current.emit('resume_timer', {
            requestId: chatRequestId,
            userId: JSON.parse(localStorage.getItem('user'))._id
          });
        }
      }
    } catch (error) {
      console.error('Error resuming timer:', error);
      toast({
        title: "Error",
        description: "Failed to resume timer",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStopTimer = async () => {
    if (!chatRequestId) return;

    if (!window.confirm('Are you sure you want to end the session? This will stop the timer.')) {
      return;
    }

    try {
      setIsUpdating(true);
      const response = await api.post('/api/chatrequest/stop-timer', {
        requestId: chatRequestId
      });

      if (response.data.success) {
        if (socketRef.current?.connected) {
          socketRef.current.emit('stop_timer', {
            requestId: chatRequestId,
            userId: JSON.parse(localStorage.getItem('user'))._id
          });
        }
      }
    } catch (error) {
      console.error('Error stopping timer:', error);
      toast({
        title: "Error",
        description: "Failed to stop session",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate remaining minutes
  const calculateRemainingMinutes = () => {
    if (!timerData?.remainingBalance || !timerData?.ratePerMin) return 0;
    return Math.floor(timerData.remainingBalance / timerData.ratePerMin);
  };

  // Calculate progress percentage
  const calculateProgress = () => {
    if (!timerData?.totalSeconds || timerData.totalSeconds === 0) return 0;
    return ((elapsedSeconds / timerData.totalSeconds) * 100);
  };

  // Calculate total cost
  const calculateTotalCost = () => {
    if (!timerData?.ratePerMin) return 0;
    return (elapsedSeconds / 60) * timerData.ratePerMin;
  };

  // Initialize
  useEffect(() => {
    fetchTimerData();
    initializeSocket();

    return () => {
      clearInterval(timerInterval.current);
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [chatRequestId]);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            <span className="ml-2">Loading timer...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!timerData) return null;

  const remainingMinutes = calculateRemainingMinutes();
  const progress = calculateProgress();
  const totalCost = calculateTotalCost();
  const isActive = timerData.status === 'active' && !isPaused;

  return (
    <Card className="w-full border-purple-200 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-purple-600 animate-pulse" />
            <span>Live Timer</span>
          </div>
          <Badge 
            variant={isActive ? "default" : 
                    isPaused ? "secondary" : 
                    timerData.status === 'expired' ? "destructive" : "outline"}
            className="capitalize"
          >
            {isPaused ? 'paused' : timerData.status}
          </Badge>
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          <span>Chatting with {psychic?.name || 'Psychic'}</span>
          <span>•</span>
          <span className="font-semibold">${timerData.ratePerMin}/min</span>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Timer Display */}
        <div className="text-center py-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
          <div className="text-4xl font-bold text-gray-900 mb-2 font-mono">
            {formatTime(remainingSeconds)}
          </div>
          <div className="text-sm text-gray-500">
            {isActive ? 'Counting down...' : 'Timer paused'}
          </div>
          <div className="text-xs text-gray-400 mt-2">
            {elapsedSeconds} seconds elapsed
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Session Progress</span>
            <span>{progress.toFixed(1)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Balance Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg border">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-600">Remaining</span>
            </div>
            <div className="text-xl font-bold text-green-600">
              ${timerData.remainingBalance?.toFixed(2) || '0.00'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {remainingMinutes} min available
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg border">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-600">Spent</span>
            </div>
            <div className="text-xl font-bold text-amber-600">
              ${totalCost.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {formatTime(elapsedSeconds)} used
            </div>
          </div>
        </div>

        {/* Warnings */}
        {remainingMinutes < 2 && remainingMinutes > 0 && isActive && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg animate-pulse">
            <div className="flex items-center gap-2 text-amber-700">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Low Balance</span>
            </div>
            <p className="text-xs text-amber-600 mt-1">
              Only {remainingMinutes} minute{remainingMinutes !== 1 ? 's' : ''} remaining
            </p>
          </div>
        )}

        {remainingMinutes === 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Balance Depleted</span>
            </div>
            <p className="text-xs text-red-600 mt-1">
              Session will end when timer reaches zero
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-2">
        {/* Control Buttons */}
        {isActive && remainingSeconds > 0 && (
          <div className="flex gap-2 w-full">
            <Button
              onClick={handlePauseTimer}
              disabled={isUpdating}
              variant="outline"
              className="flex-1"
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <PauseCircle className="mr-2 h-4 w-4" />
                  Pause
                </>
              )}
            </Button>
            <Button
              onClick={handleStopTimer}
              disabled={isUpdating}
              variant="destructive"
              className="flex-1"
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <StopCircle className="mr-2 h-4 w-4" />
                  End Session
                </>
              )}
            </Button>
          </div>
        )}

        {isPaused && remainingSeconds > 0 && (
          <div className="flex gap-2 w-full">
            <Button
              onClick={handleResumeTimer}
              disabled={isUpdating}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Resume
                </>
              )}
            </Button>
            <Button
              onClick={handleStopTimer}
              disabled={isUpdating}
              variant="destructive"
              className="flex-1"
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <StopCircle className="mr-2 h-4 w-4" />
                  End Session
                </>
              )}
            </Button>
          </div>
        )}

        {/* Add Balance Button */}
        {remainingMinutes < 5 && (
          <Button
            onClick={() => window.location.href = '/wallet'}
            variant="outline"
            className="w-full"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Add More Credits
          </Button>
        )}

        {/* Connection Status */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500 pt-2">
          <div className={`h-2 w-2 rounded-full ${socketRef.current?.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span>{socketRef.current?.connected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </CardFooter>
    </Card>
  );
};

export default PaidTimer;