import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [followUps, setFollowUps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);

  // API base URL
const API_BASE = process.env.REACT_APP_API_BASE_URL;



  // Load user from localStorage on app start
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      loadFollowUps(JSON.parse(savedUser).id);
    } else {
      setIsLoading(false);
    }
  }, []);

  // Load follow-ups from API
  const loadFollowUps = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/followups`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFollowUps(data);
      }
    } catch (error) {
      console.error('Error loading follow-ups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Login function
  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        await loadFollowUps(data.user.id);
        await checkSubscription(data.user.id);
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.error };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  // Register function
  const register = async (name, email, password) => {
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password })
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        await loadFollowUps(data.user.id);
        await checkSubscription(data.user.id);
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.error };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  // Add follow-up function
  const addFollowUp = async (followUpData) => {
    try {
      // Check subscription limits
      if (subscription?.plan === 'free' && followUps.length >= 10) {
        return { 
          success: false, 
          error: 'Free plan limited to 10 follow-ups. Upgrade to Pro for unlimited follow-ups.' 
        };
      }

      // Only send the fields that are allowed by the backend
      const allowedFields = {
        client_name: followUpData.client_name,
        client_email: followUpData.client_email,
        subject: followUpData.subject,
        message: followUpData.message || '',
        follow_up_date: followUpData.follow_up_date || null,
        follow_up_time: followUpData.follow_up_time || null
      };

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/followups`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(allowedFields) // ← Only send allowed fields
      });

      if (response.ok) {
        const newFollowUp = await response.json();
        setFollowUps([...followUps, newFollowUp]);
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.error };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  // Update follow-up status
  const updateFollowUpStatus = async (id, status) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/followups/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        setFollowUps(followUps.map(followUp => 
          followUp.id === id ? { ...followUp, status } : followUp
        ));
        return { success: true };
      } else {
        return { success: false, error: 'Failed to update status' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  // Delete follow-up
  const deleteFollowUp = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/followups/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setFollowUps(followUps.filter(followUp => followUp.id !== id));
        return { success: true };
      } else {
        return { success: false, error: 'Failed to delete follow-up' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  // Check subscription
  const checkSubscription = async (userId) => {
    try {
      const response = await fetch(`${API_BASE}/subscription/status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setFollowUps([]);
    setSubscription(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const value = {
    user,
    followUps,
    isLoading,
    subscription,
    login,
    register,
    addFollowUp,
    updateFollowUpStatus,
    deleteFollowUp,
    checkSubscription,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}