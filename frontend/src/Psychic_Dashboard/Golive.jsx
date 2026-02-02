import React, { useState, useEffect } from 'react';
import { usePsychicAuth } from "../context/PsychicAuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Wifi, WifiOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const Golive = () => {
  const { psychic, loading: authLoading, isAuthenticated } = usePsychicAuth();
  const navigate = useNavigate();
  
  const [status, setStatus] = useState('offline');
  const [updating, setUpdating] = useState(false);
  const [fetchingStatus, setFetchingStatus] = useState(false);

  // Add a timeout to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('Auth loading timeout check:', {
        authLoading,
        isAuthenticated,
        hasToken: !!localStorage.getItem('psychicToken')
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, [authLoading]);

  // Check authentication - FIXED
  useEffect(() => {
    console.log('Auth state:', { authLoading, isAuthenticated });
    
    if (authLoading) return; // Still loading, wait
    
    if (!isAuthenticated) {
      console.log('Not authenticated, redirecting');
      navigate("/psychic/login");
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Fetch current status from backend on component mount - SIMPLIFIED
  const fetchMyStatus = async () => {
    if (!isAuthenticated) return;
    
    setFetchingStatus(true);
    try {
      const token = localStorage.getItem("psychicToken");
      
      if (!token) {
        throw new Error('No token found');
      }

      // Try the endpoint
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/api/human-psychics/my-status`,
        {
          headers: {
            "Authorization": `Bearer ${token}`
          },
          timeout: 5000 // Add timeout
        }
      );

      console.log('Status response:', response.data);
      
      if (response.data.success) {
        setStatus(response.data.status);
      }
    } catch (error) {
      console.error('Failed to fetch status:', error.response?.data || error.message);
      // Use default status if fetch fails
      setStatus('offline');
    } finally {
      setFetchingStatus(false);
    }
  };

  // Fetch status when authenticated - FIXED
  useEffect(() => {
    if (isAuthenticated && !fetchingStatus) {
      fetchMyStatus();
    }
  }, [isAuthenticated]); // Remove fetchingStatus from dependencies

  // Set status from psychic context
  useEffect(() => {
    if (psychic?.status) {
      setStatus(psychic.status);
    }
  }, [psychic?.status]);

  const updateStatus = async (newStatus) => {
    if (!psychic) return;
    
    setUpdating(true);
    try {
      const token = localStorage.getItem("psychicToken");
      
      const response = await axios.put(
        `${import.meta.env.VITE_BASE_URL}/api/human-psychics/status`,
        { status: newStatus },
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setStatus(newStatus);
        toast.success(`You are now ${newStatus}`);
      }
    } catch (error) {
      console.error('Status update error:', error);
      toast.error("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const toggleStatus = () => {
    if (updating || fetchingStatus) return;
    const newStatus = status === 'online' ? 'offline' : 'online';
    updateStatus(newStatus);
  };

  // Show loading only when auth is loading OR fetching initial status
  if (authLoading || fetchingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  // If not authenticated after loading, return null (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Header with psychic name */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Go Live
          </h1>
          <p className="text-gray-600 mt-2">
            Control your availability for clients
          </p>
          {/* SHOW PSYCHIC NAME HERE */}
          {psychic?.name && (
            <div className="mt-4 p-3 bg-purple-50 rounded-lg inline-block">
              <p className="text-purple-700 font-medium">
                Logged in as: <span className="font-bold">{psychic.name}</span>
              </p>
            </div>
          )}
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 border">
          <div className="mb-6">
            <div className={`h-20 w-20 mx-auto rounded-full flex items-center justify-center mb-4 ${
              status === 'online' ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              {status === 'online' ? (
                <Wifi className="h-10 w-10 text-green-600" />
              ) : (
                <WifiOff className="h-10 w-10 text-gray-600" />
              )}
            </div>
            
            <h2 className="text-xl font-semibold mb-2">
              {status === 'online' ? 'You are Online' : 'You are Offline'}
            </h2>
            
            <p className="text-gray-600">
              {status === 'online' 
                ? 'Clients can see you and start chats'
                : 'You are not visible to clients'
              }
            </p>
          </div>

          {/* Toggle Button */}
          <Button
            onClick={toggleStatus}
            disabled={updating || fetchingStatus}
            size="lg"
            className={`w-full rounded-full text-lg font-medium ${
              status === 'online' 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {updating ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Updating...
              </>
            ) : status === 'online' ? (
              <>
                <WifiOff className="h-5 w-5 mr-2" />
                Go Offline
              </>
            ) : (
              <>
                <Wifi className="h-5 w-5 mr-2" />
                Go Online
              </>
            )}
          </Button>
          
          {/* Refresh button */}
          <Button
            onClick={fetchMyStatus}
            disabled={fetchingStatus}
            variant="outline"
            className="w-full mt-4"
          >
            {fetchingStatus ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Refreshing...
              </>
            ) : (
              'Refresh Status'
            )}
          </Button>
        </div>

        {/* Quick Info */}
        <div className="text-sm text-gray-500">
          <p>
            When online, you'll appear in search results and can receive chat requests.
          </p>
          <p className="mt-1">
            Last updated: {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Golive;