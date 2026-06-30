import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import SEO from '../../components/SEO';
import { PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { scheduleService, serviceService } from '../../services/api';

const emptyForm = {
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  phone_number: '',
  position: '',
  bio: '',
  is_active: true,
  service_ids: [],
};

const normalizeList = (response) => response.data?.results || response.data || [];

const BusinessEmployees = () => {
  const { t } = useTranslation();
  const [employees, setEmployees] = useState([]);
  const [services, setServices] = useState([]);
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
      const [employeesResponse, servicesResponse] = await Promise.all([
        scheduleService.getEmployees(),
        serviceService.getMyServices(),
      ]);
      setEmployees(normalizeList(employeesResponse));
      setServices(normalizeList(servicesResponse));
    } catch (error) {
      console.error('Failed to load employees:', error);
      toast.error(t('business_employees.failed_load'));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleServiceToggle = (serviceId) => {
    setForm((prev) => ({
      ...prev,
      service_ids: prev.service_ids.includes(serviceId)
        ? prev.service_ids.filter((id) => id !== serviceId)
        : [...prev.service_ids, serviceId],
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      const payload = { ...form };

      if (editingId && !payload.password) {
        delete payload.password;
      }

      if (editingId) {
        await scheduleService.updateEmployee(editingId, payload);
        toast.success(t('business_employees.employee_updated'));
      } else {
        await scheduleService.createEmployee(payload);
        toast.success(t('business_employees.employee_created'));
      }

      resetForm();
      await loadData();
    } catch (error) {
      console.error('Failed to save employee:', error);
      toast.error(t('business_employees.failed_save'));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (employee) => {
    setEditingId(employee.id);
    setForm({
      first_name: employee.user_details?.first_name || '',
      last_name: employee.user_details?.last_name || '',
      email: employee.user_details?.email || '',
      password: '',
      phone_number: employee.user_details?.phone_number || '',
      position: employee.position || '',
      bio: employee.bio || '',
      is_active: Boolean(employee.is_active),
      service_ids: employee.services_details?.map((service) => service.id) || [],
    });
  };

  const handleDelete = async (employeeId) => {
    if (!window.confirm(t('business_employees.confirm_delete'))) {
      return;
    }

    try {
      await scheduleService.deleteEmployee(employeeId);
      toast.success(t('business_employees.employee_deleted'));
      if (editingId === employeeId) {
        resetForm();
      }
      await loadData();
    } catch (error) {
      console.error('Failed to delete employee:', error);
      toast.error(t('business_employees.failed_delete'));
    }
  };

  return (
    <>
      <SEO title="Manage Employees" noindex />
      <div className="min-h-screen bg-[#f4f6f8] dark:bg-[#0f1118] p-4 md:p-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-3xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('business_employees.title')}</h1>
              <p className="mt-2 text-gray-500 dark:text-slate-400">{t('business_employees.subtitle')}</p>
            </div>
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center rounded-2xl bg-[#4a90b0] px-4 py-2 text-sm font-semibold text-white"
            >
              <PlusIcon className="mr-2 h-5 w-5" />
              {t('business_employees.new_employee')}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                value={form.first_name}
                onChange={(event) => setForm((prev) => ({ ...prev, first_name: event.target.value }))}
                placeholder={t('business_employees.first_name_placeholder')}
                className="rounded-2xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 px-4 py-3 outline-none focus:border-[#4a90b0]"
                required
              />
              <input
                value={form.last_name}
                onChange={(event) => setForm((prev) => ({ ...prev, last_name: event.target.value }))}
                placeholder={t('business_employees.last_name_placeholder')}
                className="rounded-2xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 px-4 py-3 outline-none focus:border-[#4a90b0]"
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                placeholder={t('business_employees.email_placeholder')}
                className="rounded-2xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 px-4 py-3 outline-none focus:border-[#4a90b0]"
                required
              />
              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                placeholder={editingId ? t('business_employees.password_optional_placeholder') : t('business_employees.password_placeholder')}
                className="rounded-2xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 px-4 py-3 outline-none focus:border-[#4a90b0]"
                required={!editingId}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                value={form.phone_number}
                onChange={(event) => setForm((prev) => ({ ...prev, phone_number: event.target.value }))}
                placeholder={t('business_employees.phone_placeholder')}
                className="rounded-2xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 px-4 py-3 outline-none focus:border-[#4a90b0]"
              />
              <input
                value={form.position}
                onChange={(event) => setForm((prev) => ({ ...prev, position: event.target.value }))}
                placeholder={t('business_employees.position_placeholder')}
                className="rounded-2xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 px-4 py-3 outline-none focus:border-[#4a90b0]"
                required
              />
            </div>
            <textarea
              value={form.bio}
              onChange={(event) => setForm((prev) => ({ ...prev, bio: event.target.value }))}
              placeholder={t('business_employees.bio_placeholder')}
              rows={3}
              className="w-full rounded-2xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 px-4 py-3 outline-none focus:border-[#4a90b0]"
            />
            <div>
              <p className="mb-3 text-sm font-semibold text-gray-900 dark:text-slate-200">{t('business_employees.services_label')}</p>
              <div className="flex flex-wrap gap-2">
                {services.map((service) => {
                  const active = form.service_ids.includes(service.id);
                  return (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => handleServiceToggle(service.id)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        active ? 'bg-[#4a90b0] text-white' : 'bg-gray-100 dark:bg-slate-600 text-gray-700 dark:text-slate-200'
                      }`}
                    >
                      {service.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <label className="inline-flex items-center gap-3 text-sm font-medium text-gray-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(event) => setForm((prev) => ({ ...prev, is_active: event.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 dark:border-slate-600 text-[#4a90b0]"
              />
              {t('business_employees.active_label')}
            </label>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-2xl bg-[#4a90b0] px-5 py-3 font-semibold text-white disabled:opacity-60"
              >
                {saving
                  ? t('business_employees.saving')
                  : editingId
                  ? t('business_employees.update_employee')
                  : t('business_employees.create_employee')}
              </button>
              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-2xl border border-gray-300 dark:border-slate-600 px-5 py-3 font-semibold text-gray-700 dark:text-slate-300"
                >
                  {t('business_employees.cancel')}
                </button>
              ) : null}
            </div>
          </form>
        </section>

        <section className="rounded-3xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('business_employees.team_title')}</h2>
          <p className="mt-2 text-gray-500 dark:text-slate-400">{t('business_employees.team_subtitle')}</p>
          <div className="mt-6 space-y-4">
            {loading ? (
              <div className="text-gray-500 dark:text-slate-400">{t('business_employees.loading')}</div>
            ) : employees.length === 0 ? (
              <div className="rounded-2xl bg-gray-50 dark:bg-slate-700 p-6 text-gray-500 dark:text-slate-400">
                {t('business_employees.no_employees')}
              </div>
            ) : (
              employees.map((employee) => (
                <div key={employee.id} className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {employee.user_details?.first_name} {employee.user_details?.last_name}
                        </h3>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${employee.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 dark:bg-slate-600 text-gray-600 dark:text-slate-400'}`}>
                          {employee.is_active ? t('business_employees.active_badge') : t('business_employees.inactive_badge')}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-medium text-gray-700 dark:text-slate-300">{employee.position}</p>
                      <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">{employee.user_details?.email}</p>
                      {employee.bio ? <p className="mt-3 text-sm text-gray-500 dark:text-slate-400">{employee.bio}</p> : null}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {employee.services_details?.map((service) => (
                          <span key={service.id} className="rounded-full bg-[#e8f2f6] dark:bg-slate-600 px-3 py-1 text-xs font-semibold text-[#326e88] dark:text-slate-200">
                            {service.name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(employee)}
                        className="inline-flex items-center rounded-2xl border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-slate-300"
                      >
                        <PencilSquareIcon className="mr-2 h-4 w-4" />
                        {t('business_employees.edit')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(employee.id)}
                        className="inline-flex items-center rounded-2xl border border-red-200 dark:border-red-800 px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400"
                      >
                        <TrashIcon className="mr-2 h-4 w-4" />
                        {t('business_employees.delete')}
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
    </>
  );
};

export default BusinessEmployees;
