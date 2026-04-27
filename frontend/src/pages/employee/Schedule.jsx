import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { scheduleService } from '../../services/api';

const dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const normalizeList = (response) => response.data?.results || response.data || [];

const EmployeeSchedule = () => {
  const [hours, setHours] = useState([]);
  const [savingId, setSavingId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHours();
  }, []);

  const loadHours = async () => {
    try {
      setLoading(true);
      const response = await scheduleService.getMyWeeklyHours();
      setHours(
        normalizeList(response).map((item) => ({
          ...item,
          opening_time: item.opening_time ? item.opening_time.slice(0, 5) : '09:00',
          closing_time: item.closing_time ? item.closing_time.slice(0, 5) : '18:00',
        }))
      );
    } catch (error) {
      console.error('Failed to load schedule:', error);
      toast.error('Failed to load your schedule.');
    } finally {
      setLoading(false);
    }
  };

  const updateLocal = (id, patch) => {
    setHours((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const save = async (hour) => {
    try {
      setSavingId(hour.id);
      const payload = {
        day_of_week: hour.day_of_week,
        is_working: hour.is_working,
        opening_time: hour.is_working ? hour.opening_time : null,
        closing_time: hour.is_working ? hour.closing_time : null,
      };
      await scheduleService.updateMyWeeklyHour(hour.id, payload);
      toast.success(`${dayLabels[hour.day_of_week]} saved.`);
    } catch (error) {
      console.error('Failed to save schedule:', error);
      toast.error('Failed to save schedule.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f3ff] p-4 md:p-6">
      <div className="mx-auto max-w-5xl rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">My Schedule</h1>
        <p className="mt-2 text-gray-500">
          Set the days and hours you are available to take appointments.
        </p>

        <div className="mt-8 space-y-4">
          {loading ? (
            <div className="text-gray-500">Loading schedule...</div>
          ) : hours.length === 0 ? (
            <div className="rounded-2xl bg-gray-50 p-8 text-gray-500">
              No schedule found. Ask your employer to set up your schedule first.
            </div>
          ) : (
            hours.map((hour) => (
              <div key={hour.id} className="rounded-2xl border border-gray-200 p-5">
                <div className="grid gap-4 lg:grid-cols-[180px_1fr_auto] lg:items-center">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {dayLabels[hour.day_of_week]}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      {hour.is_working ? 'Working' : 'Day off'}
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <label className="inline-flex items-center gap-3 text-sm font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={Boolean(hour.is_working)}
                        onChange={(e) => updateLocal(hour.id, { is_working: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300 text-violet-600"
                      />
                      Working
                    </label>
                    <input
                      type="time"
                      value={hour.opening_time || '09:00'}
                      disabled={!hour.is_working}
                      onChange={(e) => updateLocal(hour.id, { opening_time: e.target.value })}
                      className="rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-violet-500 disabled:bg-gray-100"
                    />
                    <input
                      type="time"
                      value={hour.closing_time || '18:00'}
                      disabled={!hour.is_working}
                      onChange={(e) => updateLocal(hour.id, { closing_time: e.target.value })}
                      className="rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-violet-500 disabled:bg-gray-100"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => save(hour)}
                    disabled={savingId === hour.id}
                    className="rounded-2xl bg-violet-600 px-5 py-3 font-semibold text-white disabled:opacity-60"
                  >
                    {savingId === hour.id ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeSchedule;
