import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { scheduleService } from '../../services/api';

const dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const normalizeList = (response) => response.data?.results || response.data || [];

const BusinessSchedule = () => {
  const [hours, setHours] = useState([]);
  const [savingId, setSavingId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHours();
  }, []);

  const loadHours = async () => {
    try {
      setLoading(true);
      const response = await scheduleService.getBusinessHours();
      setHours(
        normalizeList(response).map((item) => ({
          ...item,
          opening_time: item.opening_time ? item.opening_time.slice(0, 5) : '09:00',
          closing_time: item.closing_time ? item.closing_time.slice(0, 5) : '18:00',
        }))
      );
    } catch (error) {
      console.error('Failed to load business hours:', error);
      toast.error('Failed to load business hours.');
    } finally {
      setLoading(false);
    }
  };

  const updateLocalHour = (id, patch) => {
    setHours((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const saveHour = async (hour) => {
    try {
      setSavingId(hour.id);
      const payload = {
        day_of_week: hour.day_of_week,
        is_open: hour.is_open,
        is_24_hours: hour.is_24_hours,
        opening_time: hour.is_open && !hour.is_24_hours ? hour.opening_time : null,
        closing_time: hour.is_open && !hour.is_24_hours ? hour.closing_time : null,
      };
      await scheduleService.updateBusinessHours(hour.id, payload);
      toast.success(`${dayLabels[hour.day_of_week]} updated.`);
    } catch (error) {
      console.error('Failed to update business hours:', error);
      toast.error('Failed to update business hours.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6f8] p-4 md:p-6">
      <div className="mx-auto max-w-5xl rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Business Hours</h1>
        <p className="mt-2 text-gray-500">Control which dates and times are available for booking.</p>

        <div className="mt-8 space-y-4">
          {loading ? (
            <div className="text-gray-500">Loading schedule...</div>
          ) : (
            hours.map((hour) => (
              <div key={hour.id} className="rounded-2xl border border-gray-200 p-5">
                <div className="grid gap-4 lg:grid-cols-[180px_1fr_auto] lg:items-center">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {dayLabels[hour.day_of_week]}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      {hour.is_open ? (hour.is_24_hours ? 'Open 24 hours' : 'Custom hours') : 'Closed'}
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <label className="inline-flex items-center gap-3 text-sm font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={hour.is_open}
                        onChange={(event) => updateLocalHour(hour.id, { is_open: event.target.checked })}
                        className="h-4 w-4 rounded border-gray-300 text-[#4a90b0]"
                      />
                      Open
                    </label>
                    <label className="inline-flex items-center gap-3 text-sm font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={hour.is_24_hours}
                        disabled={!hour.is_open}
                        onChange={(event) => updateLocalHour(hour.id, { is_24_hours: event.target.checked })}
                        className="h-4 w-4 rounded border-gray-300 text-[#4a90b0]"
                      />
                      24 hours
                    </label>
                    <input
                      type="time"
                      value={hour.opening_time || '09:00'}
                      disabled={!hour.is_open || hour.is_24_hours}
                      onChange={(event) => updateLocalHour(hour.id, { opening_time: event.target.value })}
                      className="rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-[#4a90b0] disabled:bg-gray-100"
                    />
                    <input
                      type="time"
                      value={hour.closing_time || '18:00'}
                      disabled={!hour.is_open || hour.is_24_hours}
                      onChange={(event) => updateLocalHour(hour.id, { closing_time: event.target.value })}
                      className="rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-[#4a90b0] disabled:bg-gray-100"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => saveHour(hour)}
                    disabled={savingId === hour.id}
                    className="rounded-2xl bg-[#4a90b0] px-5 py-3 font-semibold text-white disabled:opacity-60"
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

export default BusinessSchedule;
