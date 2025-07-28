import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { findUserByEmail } from '../data/mock'; // Assuming this is still used for initial user lookup

const AuthContext = createContext();
const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8000/ws/';


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const webSocketRef = useRef(null);
  const [userStatuses, setUserStatuses] = useState({}); // Store statuses of all users

  // Function to connect to WebSocket
  const connectWebSocket = (userId) => {
    if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
      console.log("WebSocket already connected for user:", userId);
      return;
    }

    console.log("Attempting to connect WebSocket for user:", userId);
    const ws = new WebSocket(`${WS_URL}${encodeURIComponent(userId)}`);

    ws.onopen = () => {
      console.log('WebSocket connected for user:', userId);
      webSocketRef.current = ws;
      // Optimistically set the user's own status to online
      setUserStatuses(prevStatuses => {
        const newStatuses = { ...prevStatuses, [userId]: 'online' };
        console.log('Optimistically set user status:', newStatuses);
        return newStatuses;
      });
      // Fetch all current statuses upon connection
      console.log('Requesting all user statuses...');
      ws.send(JSON.stringify({ type: "get_all_statuses" }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('WebSocket message received:', message);
        if (message.type === 'status_update') {
          setUserStatuses(prevStatuses => {
            const newStatuses = { ...prevStatuses, [message.user_id]: message.status };
            console.log('Updated user statuses after status_update:', newStatuses);
            return newStatuses;
          });
        } else if (message.type === 'all_statuses') {
          console.log('Received all user statuses:', message.statuses);
          setUserStatuses(message.statuses);
        }
        // Handle other message types like chat messages if AuthContext is responsible
        // For now, assuming chat components will handle their own WebSocket for messages
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error for user:', userId, error);
    };

    ws.onclose = (event) => {
      console.log('WebSocket disconnected for user:', userId, 'Reason:', event.reason, 'Code:', event.code);
      webSocketRef.current = null;
      // Backend handles broadcasting "offline" on disconnect
    };
  };

  // Function to disconnect WebSocket
  const disconnectWebSocket = () => {
    if (webSocketRef.current) {
      console.log("Attempting to disconnect WebSocket for user:", user?.id);
      // Inform backend about going offline *before* closing, if necessary
      // (though backend's on_disconnect for the socket should handle this)
      // webSocketRef.current.send(JSON.stringify({ type: "set_status", status: "offline" }));
      webSocketRef.current.close();
      webSocketRef.current = null;
    }
  };

  // Effect to manage WebSocket connection based on user state
  useEffect(() => {
    if (user && user.id) {
      connectWebSocket(user.id);
    } else {
      disconnectWebSocket();
    }
    // Cleanup function for when the AuthProvider unmounts or user changes
    return () => {
      disconnectWebSocket();
    };
  }, [user]);


  useEffect(() => {
    const savedUser = localStorage.getItem('showtimeUser');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      // No automatic WebSocket connection here until login() is called explicitly
      // or if we decide to auto-connect if a valid user is found in localStorage
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      // Check for admin login
      if (email === 'admin@showtimeconsulting.in' && password === 'Welcome@123') {
        const userData = {
          id: 'admin@showtimeconsulting.in', // Ensure 'id' is the standard field
          name: 'System Administrator',
          email: 'admin@showtimeconsulting.in',
          designation: 'System Admin',
          department: 'Admin',
          subDepartment: 'System Admin',
          reviewer: 'Management',
          isAdmin: true,
          loginTime: new Date().toISOString()
        };
        setUser(userData);
        localStorage.setItem('showtimeUser', JSON.stringify(userData));
        // connectWebSocket(userData.id); // WebSocket connection handled by useEffect on `user`
        return userData;
      }

      const foundUser = findUserByEmail(email);
      if (!foundUser) {
        throw new Error('User not found');
      }

      if (password !== 'Welcome@123') { // Using a hardcoded password as per existing logic
        throw new Error('Invalid password');
      }

      const userData = {
        id: foundUser["Email ID"], // Ensure 'id' is the standard field
        name: foundUser.Name,
        email: foundUser["Email ID"],
        designation: foundUser.Designation,
        department: foundUser.Department,
        subDepartment: foundUser.SubDepartment,
        reviewer: foundUser.Reviewer,
        isAdmin: false,
        loginTime: new Date().toISOString()
      };

      setUser(userData);
      localStorage.setItem('showtimeUser', JSON.stringify(userData));
      // connectWebSocket(userData.id); // WebSocket connection handled by useEffect on `user`
      return userData;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const logout = () => {
    // disconnectWebSocket(); // WebSocket disconnection handled by useEffect on `user`
    setUser(null);
    localStorage.removeItem('showtimeUser');
    setUserStatuses({}); // Clear user statuses on logout
    console.log("User logged out, WebSocket should disconnect via useEffect.");
  };

  const sendWebSocketMessage = (message) => {
    if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
      webSocketRef.current.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected or not open. Message not sent:', message);
      // Optionally, queue the message or attempt to reconnect
    }
  };


  const updateProfile = (profileData) => {
    const updatedUser = { ...user, ...profileData };
    setUser(updatedUser);
    localStorage.setItem('showtimeUser', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    login,
    logout,
    updateProfile,
    loading,
    webSocketRef, // Expose WebSocket ref if needed by other components, though prefer methods
    sendWebSocketMessage, // Provide a method to send messages
    userStatuses, // Provide statuses to consumers
    setUserStatuses // Allow components to update statuses if needed (e.g. chat component gets a message)
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};