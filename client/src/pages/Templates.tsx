import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Mail, 
  FileText, 
  Send,
  Eye,
  EyeOff
} from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

interface Template {
  id: number;
  name: string;
  subject: string;
  body: string;
  is_default: boolean;
  created_at: string;
}

interface TemplateForm {
  name: string;
  subject: string;
  body: string;
}

export default function Templates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [showPreview, setShowPreview] = useState<number | null>(null);
  const [testEmail, setTestEmail] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<TemplateForm>();

  const formData = watch();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/templates');
      setTemplates(response.data.templates);
    } catch (error) {
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: TemplateForm) => {
    try {
      if (editingTemplate) {
        await api.put(`/templates/${editingTemplate.id}`, data);
        toast.success('Template updated successfully');
      } else {
        await api.post('/templates', data);
        toast.success('Template created successfully');
      }
      fetchTemplates();
      reset();
      setShowForm(false);
      setEditingTemplate(null);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save template');
    }
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setValue('name', template.name);
    setValue('subject', template.subject);
    setValue('body', template.body);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await api.delete(`/templates/${id}`);
        toast.success('Template deleted successfully');
        fetchTemplates();
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Failed to delete template');
      }
    }
  };

  const handleTestEmail = async (templateId: number) => {
    if (!testEmail) {
      toast.error('Please enter a test email address');
      return;
    }

    try {
      await api.post(`/templates/${templateId}/test`, { test_email: testEmail });
      toast.success('Test email sent successfully');
      setTestEmail('');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send test email');
    }
  };

  const resetForm = () => {
    reset();
    setShowForm(false);
    setEditingTemplate(null);
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
          <h1 className="text-2xl font-bold text-slate-900">Email Templates</h1>
          <p className="text-slate-600">Create and manage your follow-up email templates</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </button>
      </div>

      {/* Template Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            {editingTemplate ? 'Edit Template' : 'Create New Template'}
          </h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Template Name *
              </label>
              <input
                {...register('name', { required: 'Template name is required' })}
                type="text"
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Follow-up 1 (3 days)"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Subject Line *
              </label>
              <input
                {...register('subject', { required: 'Subject is required' })}
                type="text"
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Following up on your {{project_type}}"
              />
              {errors.subject && (
                <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email Body *
              </label>
              <textarea
                {...register('body', { required: 'Email body is required' })}
                rows={8}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Hi {{client_name}},&#10;&#10;I wanted to follow up on the {{project_type}} I sent you..."
              />
              {errors.body && (
                <p className="mt-1 text-sm text-red-600">{errors.body.message}</p>
              )}
              <p className="mt-1 text-xs text-slate-500">
                Use variables like {{client_name}}, {{project_type}}, {{your_name}} in your template
              </p>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                {editingTemplate ? 'Update Template' : 'Create Template'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-slate-400" />
                  <h3 className="text-lg font-medium text-slate-900">{template.name}</h3>
                  {template.is_default && (
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      Default
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setShowPreview(showPreview === template.id ? null : template.id)}
                    className="p-1 text-slate-400 hover:text-slate-600"
                  >
                    {showPreview === template.id ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                  {!template.is_default && (
                    <>
                      <button
                        onClick={() => handleEdit(template)}
                        className="p-1 text-slate-400 hover:text-slate-600"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="p-1 text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-slate-700">Subject:</p>
                  <p className="text-sm text-slate-600 truncate">{template.subject}</p>
                </div>

                {showPreview === template.id ? (
                  <div className="bg-slate-50 p-3 rounded-md">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{template.body}</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-slate-700">Preview:</p>
                    <p className="text-sm text-slate-600 line-clamp-3">{template.body}</p>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-200">
                  <div className="flex items-center space-x-2">
                    <input
                      type="email"
                      placeholder="Test email address"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      className="flex-1 px-3 py-1 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                    <button
                      onClick={() => handleTestEmail(template.id)}
                      className="p-1 text-primary-600 hover:text-primary-700"
                      title="Send test email"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-2 text-sm font-medium text-slate-900">No templates</h3>
          <p className="mt-1 text-sm text-slate-500">
            Get started by creating your first email template.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </button>
          </div>
        </div>
      )}
    </div>
  );
}