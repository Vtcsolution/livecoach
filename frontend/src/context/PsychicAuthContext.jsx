// src/context/PsychicAuthContext.jsx - FIXED VERSION
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const PsychicAuthContext = createContext();

export const usePsychicAuth = () => {
  const context = useContext(PsychicAuthContext);
  if (!context) {
    throw new Error("usePsychicAuth must be used within a PsychicAuthProvider");
  }
  return context;
};

export const PsychicAuthProvider = ({ children }) => {
  const [psychic, setPsychic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const navigate = useNavigate();

  // Create axios instance for psychic API
  const psychicApi = axios.create({
    baseURL: import.meta.env.VITE_BASE_URL || 'http://localhost:5001',
    timeout: 10000,
  });

  // Add token to requests
  psychicApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('psychicToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }, (error) => {
    return Promise.reject(error);
  });

  // Clear authentication data
  const clearAuthData = () => {
    console.log("🧹 Clearing psychic auth data");
    localStorage.removeItem('psychicToken');
    localStorage.removeItem('psychicData');
    localStorage.removeItem('psychicId');
    localStorage.removeItem('psychicName');
    setPsychic(null);
    setError("");
  };

  // Check auth status
  const checkAuthStatus = useCallback(async () => {
    const token = localStorage.getItem('psychicToken');
    
    console.log("🔍 Checking psychic auth status...");
    console.log("Token exists:", !!token);
    
    if (!token) {
      console.log("No token found");
      setPsychic(null);
      setLoading(false);
      setInitialCheckDone(true);
      return;
    }

    try {
      // Use the correct endpoint: /api/human-psychics/profile/me
      console.log("Calling /api/human-psychics/profile/me...");
      const response = await psychicApi.get('/api/human-psychics/profile/me');
      
      if (response.data.success) {
        const psychicData = response.data.psychic || response.data.data;
        console.log("✅ Psychic auth successful:", psychicData._id);
        
        setPsychic(psychicData);
        localStorage.setItem('psychicData', JSON.stringify(psychicData));
        
        if (psychicData._id) {
          localStorage.setItem('psychicId', psychicData._id);
        }
        if (psychicData.name) {
          localStorage.setItem('psychicName', psychicData.name);
        }
      } else {
        throw new Error(response.data.message || 'Invalid response');
      }
    } catch (error) {
      console.error('❌ Psychic auth check failed:', error.message);
      
      if (error.response?.status === 401) {
        console.log("401 error, clearing auth data");
        clearAuthData();
        
        if (initialCheckDone && !window.location.pathname.includes('/psychic/login')) {
          toast.error("Session expired. Please login again.");
          navigate('/psychic/login');
        }
      }
    } finally {
      setLoading(false);
      setInitialCheckDone(true);
    }
  }, [initialCheckDone, navigate]);

  // Initial auth check on mount
  useEffect(() => {
    console.log("🔄 PsychicAuthProvider mounting...");
    
    // Check local storage first for faster UI
    const storedPsychic = localStorage.getItem('psychicData');
    const token = localStorage.getItem('psychicToken');
    
    if (storedPsychic && token) {
      try {
        const parsedPsychic = JSON.parse(storedPsychic);
        console.log("Found stored psychic data:", parsedPsychic._id);
        setPsychic(parsedPsychic);
      } catch (error) {
        console.error('Error parsing stored psychic data:', error);
        clearAuthData();
      }
    }
    
    // Then verify with server
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Login function
  const login = async (credentials) => {
    setLoading(true);
    setError("");

    try {
      console.log("🔑 Attempting psychic login with:", credentials.email);
      
      // Use regular axios, not psychicApi (to avoid interceptors)
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL || 'http://localhost:5001'}/api/human-psychics/login`,
        credentials,
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log("✅ Login response:", response.data);
      
      if (response.data.success) {
        const { token, ...psychicData } = response.data;
        
        // Store token
        if (token) {
          localStorage.setItem('psychicToken', token);
          console.log("✅ Token stored");
        }
        
        // Store psychic data
        const psychicInfo = psychicData.psychic || psychicData.data || psychicData;
        if (psychicInfo) {
          setPsychic(psychicInfo);
          localStorage.setItem('psychicData', JSON.stringify(psychicInfo));
          
          if (psychicInfo._id) {
            localStorage.setItem('psychicId', psychicInfo._id);
          }
          if (psychicInfo.name) {
            localStorage.setItem('psychicName', psychicInfo.name);
          }
          
          console.log("✅ Psychic data stored:", psychicInfo._id);
        }
        
        toast.success(`Welcome back, ${psychicInfo?.name || "Psychic"}!`);
        
        // Check auth status to verify everything is working
        await checkAuthStatus();
        
        return { success: true, data: psychicInfo };
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Login failed';
      console.error("❌ Login error:", message);
      setError(message);
      toast.error(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      console.log("🚪 Logging out psychic...");
      
      // Try to call logout endpoint if it exists
      try {
        await psychicApi.post('/api/human-psychics/logout');
      } catch (apiError) {
        console.log("Logout API not available, proceeding with client-side logout");
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuthData();
      toast.info("You have been logged out");
      
      // Redirect to login page
      navigate('/psychic/login');
    }
  };

  // Register function
  const register = async (formData) => {
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL || 'http://localhost:5001'}/api/human-psychics/register`,
        formData,
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success) {
        toast.success("Registration successful! You can now login.");
        return { success: true, data: response.data };
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Registration failed';
      setError(message);
      toast.error(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  // Update profile
  const updateProfile = async (profileData) => {
    try {
      const response = await psychicApi.put('/api/human-psychics/profile/me', profileData);
      
      if (response.data.success) {
        const updatedPsychic = response.data.psychic || response.data.data;
        localStorage.setItem('psychicData', JSON.stringify(updatedPsychic));
        setPsychic(updatedPsychic);
        toast.success("Profile updated successfully!");
        return { success: true, data: updatedPsychic };
      } else {
        throw new Error(response.data.message || 'Update failed');
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Update failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Verify if psychic is authenticated
  const isAuthenticated = !!psychic && !!localStorage.getItem('psychicToken');

  console.log("🔄 PsychicAuthContext state:", {
    loading,
    initialCheckDone,
    psychic: psychic ? { _id: psychic._id, name: psychic.name } : null,
    hasToken: !!localStorage.getItem('psychicToken'),
    isAuthenticated
  });

  return (
    <PsychicAuthContext.Provider
      value={{
        psychic,
        login,
        register,
        logout,
        updateProfile,
        loading,
        error,
        isAuthenticated,
        initialCheckDone,
        checkAuthStatus
      }}
    >
      {children}
    </PsychicAuthContext.Provider>
  );
};