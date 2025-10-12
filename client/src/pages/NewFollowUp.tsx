import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, FileText, Clock, Plus, Minus } from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

interface FollowUpForm {
  client_name: string;
  client_email: string;
  subject: string;
  initial_message: string;
  max_follow_ups: number;
  follow_up_delays: number[];
}

interface Template {
  id: number;
  name: string;
  subject: string;
  body: string;
}

export default function NewFollowUp() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<FollowUpForm>({
    defaultValues: {
      max_follow_ups: 3,
      follow_up_delays: [3, 7, 14]
    }
  });

  const maxFollowUps = watch('max_follow_ups');
  const followUpDelays = watch('follow_up_delays');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/templates');
      setTemplates(response.data.templates);
    } catch (error) {
      toast.error('Failed to load templates');
    }
  };

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    setValue('subject', template.subject);
    setValue('initial_message', template.body);
  };

  const addFollowUpDelay = () => {
    const newDelays = [...followUpDelays, 7];
    setValue('follow_up_delays', newDelays);
  };

  const removeFollowUpDelay = (index: number) => {
    if (followUpDelays.length > 1) {
      const newDelays = followUpDelays.filter((_, i) => i !== index);
      setValue('follow_up_delays', newDelays);
    }
  };

  const updateFollowUpDelay = (index: number, value: number) => {
    const newDelays = [...followUpDelays];
    newDelays[index] = Math.max(1, Math.min(30, value));
    setValue('follow_up_delays', newDelays);
  };

  const onSubmit = async (data: FollowUpForm) => {
    setIsLoading(true);
    try {
      await api.post('/followups', data);
      toast.success('Follow-up campaign created successfully!');
      navigate('/followups');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create follow-up');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/followups')}
          className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">New Follow-up Campaign</h1>
          <p className="text-slate-600">Set up automated follow-up emails for your client</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Client Information */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Client Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Client Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  {...register('client_name', { required: 'Client name is required' })}
                  type="text"
                  className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="John Doe"
                />
              </div>
              {errors.client_name && (
                <p className="mt-1 text-sm text-red-600">{errors.client_name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Client Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  {...register('client_email', {
                    required: 'Client email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  type="email"
                  className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="john@example.com"
                />
              </div>
              {errors.client_email && (
                <p className="mt-1 text-sm text-red-600">{errors.client_email.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Email Content */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Email Content</h2>
          
          {/* Template Selection */}
          {templates.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Choose a Template (Optional)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleTemplateSelect(template)}
                    className={`p-3 text-left border rounded-lg transition-colors ${
                      selectedTemplate?.id === template.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-900">{template.name}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 truncate">{template.subject}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email Subject *
              </label>
              <input
                {...register('subject', { required: 'Subject is required' })}
                type="text"
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Following up on your project proposal"
              />
              {errors.subject && (
                <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Initial Message (Optional)
              </label>
              <textarea
                {...register('initial_message')}
                rows={4}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter the initial message you sent to the client..."
              />
            </div>
          </div>
        </div>

        {/* Follow-up Schedule */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Follow-up Schedule</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Number of Follow-ups
              </label>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setValue('max_follow_ups', Math.max(1, maxFollowUps - 1))}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded border border-slate-300"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <input
                  {...register('max_follow_ups', {
                    min: { value: 1, message: 'At least 1 follow-up required' },
                    max: { value: 10, message: 'Maximum 10 follow-ups allowed' }
                  })}
                  type="number"
                  min="1"
                  max="10"
                  className="w-20 text-center px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
                <button
                  type="button"
                  onClick={() => setValue('max_follow_ups', Math.min(10, maxFollowUps + 1))}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded border border-slate-300"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {errors.max_follow_ups && (
                <p className="mt-1 text-sm text-red-600">{errors.max_follow_ups.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Follow-up Delays (Days)
              </label>
              <div className="space-y-2">
                {followUpDelays.map((delay, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="text-sm text-slate-600 w-8">#{index + 1}</span>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={delay}
                      onChange={(e) => updateFollowUpDelay(index, parseInt(e.target.value) || 1)}
                      className="w-20 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                    <span className="text-sm text-slate-600">days</span>
                    {followUpDelays.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFollowUpDelay(index)}
                        className="p-1 text-red-400 hover:text-red-600"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                {followUpDelays.length < 10 && (
                  <button
                    type="button"
                    onClick={addFollowUpDelay}
                    className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add follow-up</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/followups')}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Creating...</span>
              </div>
            ) : (
              'Create Follow-up Campaign'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}