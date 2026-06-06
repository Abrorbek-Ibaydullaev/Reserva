import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { serviceService } from '../../services/api';
import { responseList } from '../../utils/data';

const emptyForm = {
  name: '',
  description: '',
  price: '',
  duration: 60,
  category: '',
  is_active: true,
};

const normalizeList = responseList;

const BusinessServices = () => {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [servicesResponse, categoriesResponse] = await Promise.all([
        serviceService.getMyServices(),
        serviceService.getCategories(),
      ]);
      setServices(normalizeList(servicesResponse));
      setCategories(normalizeList(categoriesResponse));
    } catch {
      toast.error('Failed to load services.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      const payload = {
        ...form,
        price: Number(form.price),
        category: form.category || null,
      };

      if (editingId) {
        await serviceService.updateService(editingId, payload);
        toast.success('Service updated.');
      } else {
        await serviceService.createService(payload);
        toast.success('Service created.');
      }

      resetForm();
      await loadData();
    } catch {
      toast.error('Failed to save service.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (service) => {
    setEditingId(service.id);
    setForm({
      name: service.name || '',
      description: service.description || '',
      price: service.price || '',
      duration: service.duration || 60,
      category: service.category || '',
      is_active: Boolean(service.is_active),
    });
  };

  const handleDelete = async (serviceId) => {
    if (!window.confirm('Delete this service?')) {
      return;
    }

    try {
      await serviceService.deleteService(serviceId);
      toast.success('Service deleted.');
      if (editingId === serviceId) {
        resetForm();
      }
      await loadData();
    } catch {
      toast.error('Failed to delete service.');
    }
  };

  return (
    <div className="app-page">
      <div className="app-container grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="app-card-pad">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="app-title">Services</h1>
              <p className="app-subtitle">Manage what customers can book.</p>
            </div>
            <button
              type="button"
              onClick={resetForm}
              className="btn-primary"
            >
              <PlusIcon className="mr-2 h-5 w-5" />
              New service
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Service name"
              className="w-full"
              required
            />
            <textarea
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Description"
              rows={4}
              className="w-full"
              required
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
                placeholder="Price"
                className="w-full"
                required
              />
              <select
                value={form.duration}
                onChange={(event) => setForm((prev) => ({ ...prev, duration: Number(event.target.value) }))}
                className="w-full"
              >
                {[15, 30, 45, 60, 90, 120, 180].map((duration) => (
                  <option key={duration} value={duration}>
                    {duration} min
                  </option>
                ))}
              </select>
              <select
                value={form.category}
                onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                className="w-full"
              >
                <option value="">No category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <label className="inline-flex items-center gap-3 text-sm font-medium text-soft">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(event) => setForm((prev) => ({ ...prev, is_active: event.target.checked }))}
                className="h-4 w-4 rounded border-token text-brand focus:ring-primary"
              />
              Service is active and bookable
            </label>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary"
              >
                {saving ? 'Saving...' : editingId ? 'Update service' : 'Create service'}
              </button>
              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        </section>

        <section className="app-card-pad">
          <h2 className="text-xl font-semibold tracking-tight text-token">Your Services</h2>
          <p className="app-subtitle">Everything below is loaded from your live data.</p>
          <div className="mt-6 space-y-4">
            {loading ? (
              <div className="text-sm text-muted">Loading services...</div>
            ) : services.length === 0 ? (
              <div className="ui-empty">No services yet.</div>
            ) : (
              services.map((service) => (
                <div key={service.id} className="rounded-xl border border-token bg-surface-token p-5 transition hover:border-token hover:shadow-sm">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-token">{service.name}</h3>
                        <span className={`ui-chip ${service.is_active ? 'bg-muted-token text-success' : 'bg-muted-token text-soft'}`}>
                          {service.is_active ? 'Active' : 'Paused'}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-muted">{service.description}</p>
                      <div className="mt-3 flex flex-wrap gap-4 text-sm text-soft">
                        <span>${Number(service.price || 0).toFixed(2)}</span>
                        <span>{service.duration} min</span>
                        <span>{service.category_name || 'Uncategorized'}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(service)}
                        className="btn-secondary"
                      >
                        <PencilSquareIcon className="mr-2 h-4 w-4" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(service.id)}
                        className="btn-danger"
                      >
                        <TrashIcon className="mr-2 h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default BusinessServices;
