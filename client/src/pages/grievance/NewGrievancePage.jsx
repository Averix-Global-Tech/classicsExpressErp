import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

import grievanceService from '../../services/grievanceService';
import { useToast } from '../../context/ToastContext';
import { Button, Input, Spinner, Select } from '../../components/ui';

const schema = yup.object().shape({
  subject: yup.string().required('Subject is required').max(100, 'Too long'),
  category: yup.string().required('Category is required'),
  priority: yup.string().required('Priority is required'),
  description: yup.string().required('Description is required').min(20, 'Please provide more details'),
});

export default function NewGrievancePage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState([]);

  const { register, handleSubmit, control, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      priority: 'Medium',
      description: ''
    }
  });

  useEffect(() => {
    grievanceService.getSettings()
      .then(res => setCategories(res.categories || []))
      .catch(() => showToast('Failed to load categories', 'error'))
      .finally(() => setLoading(false));
  }, [showToast]);

  const handleFileChange = (e) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      if (selected.length > 5) {
        showToast('Maximum 5 files allowed', 'error');
        return;
      }
      setFiles(selected);
    }
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('subject', data.subject);
      formData.append('category', data.category);
      formData.append('priority', data.priority);
      formData.append('description', data.description);
      
      files.forEach(file => {
        formData.append('attachments', file);
      });

      const res = await grievanceService.createGrievance(formData);
      showToast('Grievance submitted successfully!', 'success');
      navigate(`/grievance/${res.grievance._id}`);
    } catch (err) {
      showToast(err.message || 'Failed to submit grievance', 'error');
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner /></div>;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Raise a Grievance</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Please provide detailed information about your issue.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-navy-900 p-6 sm:p-8 rounded-lg shadow-sm border space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="sm:col-span-2">
            <label htmlFor="subject" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subject</label>
            <Input
              id="subject"
              placeholder="Brief summary of the issue"
              {...register('subject')}
              error={errors.subject?.message}
            />
          </div>

          <div>
            <Select
              id="category"
              label="Category"
              placeholder="Select Category"
              options={categories}
              error={errors.category?.message}
              {...register('category')}
            />
          </div>

          <div>
            <Select
              id="priority"
              label="Priority"
              options={[
                { value: 'Low', label: 'Low' },
                { value: 'Medium', label: 'Medium' },
                { value: 'High', label: 'High' },
                { value: 'Critical', label: 'Critical' }
              ]}
              error={errors.priority?.message}
              {...register('priority')}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
            <div className="h-64 mb-12">
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <ReactQuill 
                    theme="snow" 
                    value={field.value} 
                    onChange={field.onChange} 
                    className="h-full"
                  />
                )}
              />
            </div>
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="attachments" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Attachments (Optional)</label>
            <input
              type="file"
              id="attachments"
              multiple
              onChange={handleFileChange}
              className="block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Maximum 5 files. Max size 10MB per file.</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" type="button" onClick={() => navigate('/grievance/dashboard')}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? <Spinner size={16} /> : 'Submit Ticket'}
          </Button>
        </div>
      </form>
    </div>
  );
}
