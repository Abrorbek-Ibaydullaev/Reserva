import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { categoryKey } from '../../../../shared/categories.js';
import { PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { serviceService } from '../../services/api';

const emptyForm = {
  name: '',
  description: '',
  price: '',
  duration: 60,
  category: '',
  is_active: true,
};

const normalizeList = (response) => response.data?.results || response.data || [];

const BusinessServices = () => {
  const { t } = useTranslation();
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
    } catch (error) {
      console.error('Failed to load services:', error);
      toast.error(t('business_services.failed_load'));
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
        toast.success(t('business_services.service_updated'));
      } else {
        await serviceService.createService(payload);
        toast.success(t('business_services.service_created'));
      }

      resetForm();
      await loadData();
    } catch (error) {
      console.error('Failed to save service:', error);
      toast.error(t('business_services.failed_save'));
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
    if (!window.confirm(t('business_services.confirm_delete'))) {
      return;
    }

    try {
      await serviceService.deleteService(serviceId);
      toast.success(t('business_services.service_deleted'));
      if (editingId === serviceId) {
        resetForm();
      }
      await loadData();
    } catch (error) {
      console.error('Failed to delete service:', error);
      toast.error(t('business_services.failed_delete'));
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6f8] dark:bg-[#0f1118] p-4 md:p-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-3xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('business_services.title')}</h1>
              <p className="mt-1 text-gray-500 dark:text-slate-400">{t('business_services.subtitle')}</p>
            </div>
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex w-fit items-center rounded-2xl bg-[#4a90b0] px-4 py-2 text-sm font-semibold text-white"
            >
              <PlusIcon className="mr-2 h-5 w-5" />
              {t('business_services.new_service')}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder={t('business_services.name_placeholder')}
              className="w-full rounded-2xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 px-4 py-3 outline-none focus:border-[#4a90b0]"
              required
            />
            <textarea
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder={t('business_services.description_placeholder')}
              rows={4}
              className="w-full rounded-2xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 px-4 py-3 outline-none focus:border-[#4a90b0]"
              required
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
                placeholder={t('business_services.price_placeholder')}
                className="rounded-2xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 px-4 py-3 outline-none focus:border-[#4a90b0]"
                required
              />
              <select
                value={form.duration}
                onChange={(event) => setForm((prev) => ({ ...prev, duration: Number(event.target.value) }))}
                className="rounded-2xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white px-4 py-3 outline-none focus:border-[#4a90b0]"
              >
                {[15, 30, 45, 60, 90, 120, 180].map((duration) => (
                  <option key={duration} value={duration}>
                    {duration} {t('common.min')}
                  </option>
                ))}
              </select>
              <select
                value={form.category}
                onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                className="rounded-2xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white px-4 py-3 outline-none focus:border-[#4a90b0]"
              >
                <option value="">{t('business_services.no_category')}</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <label className="inline-flex items-center gap-3 text-sm font-medium text-gray-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(event) => setForm((prev) => ({ ...prev, is_active: event.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 dark:border-slate-600 text-[#4a90b0]"
              />
              {t('business_services.active_label')}
            </label>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-2xl bg-[#4a90b0] px-5 py-3 font-semibold text-white disabled:opacity-60"
              >
                {saving
                  ? t('business_services.saving')
                  : editingId
                  ? t('business_services.update_service')
                  : t('business_services.create_service')}
              </button>
              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-2xl border border-gray-300 dark:border-slate-600 px-5 py-3 font-semibold text-gray-700 dark:text-slate-300"
                >
                  {t('business_services.cancel')}
                </button>
              ) : null}
            </div>
          </form>
        </section>

        <section className="rounded-3xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('business_services.your_services')}</h2>
          <p className="mt-2 text-gray-500 dark:text-slate-400">{t('business_services.your_services_subtitle')}</p>
          <div className="mt-6 space-y-4">
            {loading ? (
              <div className="text-gray-500 dark:text-slate-400">{t('business_services.loading')}</div>
            ) : services.length === 0 ? (
              <div className="rounded-2xl bg-gray-50 dark:bg-slate-700 p-6 text-gray-500 dark:text-slate-400">
                {t('business_services.no_services')}
              </div>
            ) : (
              services.map((service) => (
                <div key={service.id} className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{service.name}</h3>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${service.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 dark:bg-slate-600 text-gray-600 dark:text-slate-400'}`}>
                          {service.is_active ? t('business_services.active') : t('business_services.paused')}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">{service.description}</p>
                      <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600 dark:text-slate-300">
                        <span>${Number(service.price || 0).toFixed(2)}</span>
                        <span>{service.duration} {t('common.min')}</span>
                        <span>{service.category_name ? t(categoryKey(service.category_name), { defaultValue: service.category_name }) : t('business_services.uncategorized')}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(service)}
                        className="inline-flex items-center rounded-2xl border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-slate-300"
                      >
                        <PencilSquareIcon className="mr-2 h-4 w-4" />
                        {t('business_services.edit')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(service.id)}
                        className="inline-flex items-center rounded-2xl border border-red-200 dark:border-red-800 px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400"
                      >
                        <TrashIcon className="mr-2 h-4 w-4" />
                        {t('business_services.delete')}
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
