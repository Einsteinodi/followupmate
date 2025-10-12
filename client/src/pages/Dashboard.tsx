import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Mail, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Users,
  Calendar
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
}

interface DashboardStats {
  total_followups: number;
  pending_followups: number;
  replied_followups: number;
  overdue_followups: number;
}

export default function Dashboard() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total_followups: 0,
    pending_followups: 0,
    replied_followups: 0,
    overdue_followups: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [followUpsResponse] = await Promise.all([
        api.get('/followups')
      ]);

      const followUpsData = followUpsResponse.data.followups;
      setFollowUps(followUpsData);

      // Calculate stats
      const newStats = {
        total_followups: followUpsData.length,
        pending_followups: followUpsData.filter((f: FollowUp) => f.status_display === 'scheduled' || f.status_display === 'ready').length,
        replied_followups: followUpsData.filter((f: FollowUp) => f.status_display === 'replied').length,
        overdue_followups: followUpsData.filter((f: FollowUp) => 
          f.status_display === 'ready' && isBefore(new Date(f.next_follow_up_date), new Date())
        ).length
      };
      setStats(newStats);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
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
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600">Track your follow-up campaigns</p>
        </div>
        <Link
          to="/followups/new"
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Follow-up
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Users className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">Total Follow-ups</p>
              <p className="text-2xl font-bold text-slate-900">{stats.total_followups}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">Pending</p>
              <p className="text-2xl font-bold text-slate-900">{stats.pending_followups}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">Replied</p>
              <p className="text-2xl font-bold text-slate-900">{stats.replied_followups}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">Overdue</p>
              <p className="text-2xl font-bold text-slate-900">{stats.overdue_followups}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Follow-ups */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Recent Follow-ups</h2>
        </div>
        <div className="divide-y divide-slate-200">
          {followUps.slice(0, 5).map((followUp) => (
            <div key={followUp.id} className="px-6 py-4 hover:bg-slate-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {getStatusIcon(followUp.status_display)}
                  <div>
                    <p className="font-medium text-slate-900">{followUp.client_name}</p>
                    <p className="text-sm text-slate-600">{followUp.client_email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(followUp.status_display)}`}>
                    {followUp.status_display}
                  </span>
                  <div className="text-right">
                    <p className="text-sm text-slate-600">
                      {followUp.emails_sent} emails sent
                    </p>
                    <p className="text-xs text-slate-500">
                      {followUp.next_follow_up_date && format(new Date(followUp.next_follow_up_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {followUps.length > 5 && (
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-200">
            <Link
              to="/followups"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View all follow-ups →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}