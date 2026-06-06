import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { scheduleService, serviceService } from '../../services/api';
import { asArray, responseList } from '../../utils/data';

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

const normalizeList = responseList;

const BusinessEmployees = () => {
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
    } catch {
      toast.error('Failed to load employees.');
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
        toast.success('Employee updated.');
      } else {
        await scheduleService.createEmployee(payload);
        toast.success('Employee created.');
      }

      resetForm();
      await loadData();
    } catch {
      toast.error('Failed to save employee.');
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
      service_ids: asArray(employee.services_details).map((service) => service.id),
    });
  };

  const handleDelete = async (employeeId) => {
    if (!window.confirm('Delete this employee profile?')) {
      return;
    }

    try {
      await scheduleService.deleteEmployee(employeeId);
      toast.success('Employee deleted.');
      if (editingId === employeeId) {
        resetForm();
      }
      await loadData();
    } catch {
      toast.error('Failed to delete employee.');
    }
  };

  return (
    <div className="app-page">
      <div className="app-container grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="app-card-pad">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="app-title">Employees</h1>
              <p className="app-subtitle">Create staff accounts and assign services.</p>
            </div>
            <button
              type="button"
              onClick={resetForm}
              className="btn-primary"
            >
              <PlusIcon className="mr-2 h-5 w-5" />
              New employee
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                value={form.first_name}
                onChange={(event) => setForm((prev) => ({ ...prev, first_name: event.target.value }))}
                placeholder="First name"
                className="w-full"
                required
              />
              <input
                value={form.last_name}
                onChange={(event) => setForm((prev) => ({ ...prev, last_name: event.target.value }))}
                placeholder="Last name"
                className="w-full"
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="Email"
                className="w-full"
                required
              />
              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                placeholder={editingId ? 'New password (optional)' : 'Password'}
                className="w-full"
                required={!editingId}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                value={form.phone_number}
                onChange={(event) => setForm((prev) => ({ ...prev, phone_number: event.target.value }))}
                placeholder="Phone number"
                className="w-full"
              />
              <input
                value={form.position}
                onChange={(event) => setForm((prev) => ({ ...prev, position: event.target.value }))}
                placeholder="Position"
                className="w-full"
                required
              />
            </div>
            <textarea
              value={form.bio}
              onChange={(event) => setForm((prev) => ({ ...prev, bio: event.target.value }))}
              placeholder="Bio"
              rows={3}
              className="w-full"
            />
            <div>
              <p className="mb-3 text-sm font-semibold text-token">Services</p>
              <div className="flex flex-wrap gap-2">
                {services.map((service) => {
                  const active = form.service_ids.includes(service.id);
                  return (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => handleServiceToggle(service.id)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        active ? 'bg-primary text-white shadow-sm' : 'bg-muted-token text-soft hover:bg-muted-token'
                      }`}
                    >
                      {service.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <label className="inline-flex items-center gap-3 text-sm font-medium text-soft">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(event) => setForm((prev) => ({ ...prev, is_active: event.target.checked }))}
                className="h-4 w-4 rounded border-token text-brand focus:ring-primary"
              />
              Employee is active
            </label>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary"
              >
                {saving ? 'Saving...' : editingId ? 'Update employee' : 'Create employee'}
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
          <h2 className="text-xl font-semibold tracking-tight text-token">Team</h2>
          <p className="app-subtitle">Staff members synced from your business workspace.</p>
          <div className="mt-6 space-y-4">
            {loading ? (
              <div className="text-sm text-muted">Loading employees...</div>
            ) : employees.length === 0 ? (
              <div className="ui-empty">No employees yet.</div>
            ) : (
              employees.map((employee) => (
                <div key={employee.id} className="rounded-xl border border-token bg-surface-token p-5 transition hover:border-token hover:shadow-sm">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-token">
                          {employee.user_details?.first_name} {employee.user_details?.last_name}
                        </h3>
                        <span className={`ui-chip ${employee.is_active ? 'bg-muted-token text-success' : 'bg-muted-token text-soft'}`}>
                          {employee.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-medium text-soft">{employee.position}</p>
                      <p className="mt-2 text-sm text-muted">{employee.user_details?.email}</p>
                      {employee.bio ? <p className="mt-3 text-sm text-muted">{employee.bio}</p> : null}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {asArray(employee.services_details).map((service) => (
                          <span key={service.id} className="ui-chip bg-muted-token text-brand">
                            {service.name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(employee)}
                        className="btn-secondary"
                      >
                        <PencilSquareIcon className="mr-2 h-4 w-4" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(employee.id)}
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

export default BusinessEmployees;
