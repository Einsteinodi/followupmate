import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Mail, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Edit,
  Trash2,
  Reply
} from 'lucide-react';
import { api } from '../services/api';
import { format, isAfter, isBefore } from 'date-fns';
import toast from 'react-hot-toast';

interface FollowUp {
  id: number;
  client_name: string;
  client_email: string;
  subject: string;
  status_display: string;
  next_follow_up_date: string;
  emails_sent: number;
  created_at: string;
  follow_up_count: number;
  max_follow_ups: number;
}

export default function FollowUps() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [filteredFollowUps, setFilteredFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showActions, setShowActions] = useState<number | null>(null);

  useEffect(() => {
    fetchFollowUps();
  }, []);

  useEffect(() => {
    filterFollowUps();
  }, [followUps, searchTerm, statusFilter]);

  const fetchFollowUps = async () => {
    try {
      const response = await api.get('/followups');
      setFollowUps(response.data.followups);
    } catch (error) {
      toast.error('Failed to load follow-ups');
    } finally {
      setLoading(false);
    }
  };

  const filterFollowUps = () => {
    let filtered = followUps;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(followUp =>
        followUp.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        followUp.client_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        followUp.subject.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(followUp => followUp.status_display === statusFilter);
    }

    setFilteredFollowUps(filtered);
  };

  const handleMarkAsReplied = async (id: number) => {
    try {
      await api.patch(`/followups/${id}/reply`);
      toast.success('Marked as replied');
      fetchFollowUps();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this follow-up?')) {
      try {
        await api.delete(`/followups/${id}`);
        toast.success('Follow-up deleted');
        fetchFollowUps();
      } catch (error) {
        toast.error('Failed to delete follow-up');
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'replied':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'ready':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case 'scheduled':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'sent':
        return <Mail className="h-5 w-5 text-slate-500" />;
      default:
        return <Clock className="h-5 w-5 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'replied':
        return 'bg-green-100 text-green-800';
      case 'ready':
        return 'bg-orange-100 text-orange-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'sent':
        return 'bg-slate-100 text-slate-800';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'replied':
        return 'Client Replied';
      case 'ready':
        return 'Ready to Send';
      case 'scheduled':
        return 'Scheduled';
      case 'sent':
        return 'Email Sent';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Follow-ups</h1>
          <p className="text-slate-600">Manage your client follow-up campaigns</p>
        </div>
        <Link
          to="/followups/new"
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Follow-up
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search follow-ups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="ready">Ready to Send</option>
              <option value="sent">Email Sent</option>
              <option value="replied">Client Replied</option>
            </select>
          </div>
        </div>
      </div>

      {/* Follow-ups List */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        {filteredFollowUps.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-2 text-sm font-medium text-slate-900">No follow-ups</h3>
            <p className="mt-1 text-sm text-slate-500">
              {searchTerm || statusFilter !== 'all' 
                ? 'No follow-ups match your filters.' 
                : 'Get started by creating a new follow-up campaign.'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <div className="mt-6">
                <Link
                  to="/followups/new"
                  className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Follow-up
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredFollowUps.map((followUp) => (
              <div key={followUp.id} className="p-6 hover:bg-slate-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(followUp.status_display)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {followUp.client_name}
                        </p>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(followUp.status_display)}`}>
                          {getStatusText(followUp.status_display)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 truncate">{followUp.client_email}</p>
                      <p className="text-sm text-slate-500 truncate">{followUp.subject}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm text-slate-600">
                        {followUp.emails_sent} of {followUp.max_follow_ups} sent
                      </p>
                      <p className="text-xs text-slate-500">
                        {followUp.next_follow_up_date && format(new Date(followUp.next_follow_up_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                    
                    <div className="relative">
                      <button
                        onClick={() => setShowActions(showActions === followUp.id ? null : followUp.id)}
                        className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      
                      {showActions === followUp.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-slate-200 z-10">
                          <div className="py-1">
                            {followUp.status_display !== 'replied' && (
                              <button
                                onClick={() => {
                                  handleMarkAsReplied(followUp.id);
                                  setShowActions(null);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                              >
                                <Reply className="h-4 w-4 mr-2" />
                                Mark as Replied
                              </button>
                            )}
                            <button
                              onClick={() => {
                                // Edit functionality would go here
                                setShowActions(null);
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                handleDelete(followUp.id);
                                setShowActions(null);
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}