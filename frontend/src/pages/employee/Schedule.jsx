import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import SEO from '../../components/SEO';
import { scheduleService } from '../../services/api';

const normalizeList = (response) => response.data?.results || response.data || [];

const EmployeeSchedule = () => {
  const { t } = useTranslation();
  const [hours, setHours] = useState([]);
  const [savingId, setSavingId] = useState(null);
  const [loading, setLoading] = useState(true);

  const dayLabels = [
    t('common.days.monday'),
    t('common.days.tuesday'),
    t('common.days.wednesday'),
    t('common.days.thursday'),
    t('common.days.friday'),
    t('common.days.saturday'),
    t('common.days.sunday'),
  ];

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
      toast.error(t('employee_schedule.failed_load'));
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
      toast.success(t('employee_schedule.saved', { day: dayLabels[hour.day_of_week] }));
    } catch (error) {
      console.error('Failed to save schedule:', error);
      toast.error(t('employee_schedule.failed_save'));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <>
      <SEO title="My Schedule" noindex />
      <div className="min-h-screen bg-[#f5f3ff] dark:bg-[#0f1118] p-4 md:p-6">
      <div className="mx-auto max-w-5xl rounded-3xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('employee_schedule.title')}</h1>
        <p className="mt-2 text-gray-500 dark:text-slate-400">
          {t('employee_schedule.subtitle')}
        </p>

        <div className="mt-8 space-y-4">
          {loading ? (
            <div className="text-gray-500 dark:text-slate-400">{t('employee_schedule.loading')}</div>
          ) : hours.length === 0 ? (
            <div className="rounded-2xl bg-gray-50 dark:bg-slate-700 p-8 text-gray-500 dark:text-slate-400">
              {t('employee_schedule.no_schedule')}
            </div>
          ) : (
            hours.map((hour) => (
              <div key={hour.id} className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-5">
                <div className="grid gap-4 lg:grid-cols-[180px_1fr_auto] lg:items-center">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {dayLabels[hour.day_of_week]}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                      {hour.is_working ? t('employee_schedule.working') : t('employee_schedule.day_off')}
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <label className="inline-flex items-center gap-3 text-sm font-medium text-gray-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={Boolean(hour.is_working)}
                        onChange={(e) => updateLocal(hour.id, { is_working: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300 dark:border-slate-600 text-violet-600"
                      />
                      {t('employee_schedule.working')}
                    </label>
                    <input
                      type="time"
                      value={hour.opening_time || '09:00'}
                      disabled={!hour.is_working}
                      onChange={(e) => updateLocal(hour.id, { opening_time: e.target.value })}
                      className="rounded-2xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white px-4 py-3 outline-none focus:border-violet-500 disabled:bg-gray-100 dark:disabled:bg-slate-600/50"
                    />
                    <input
                      type="time"
                      value={hour.closing_time || '18:00'}
                      disabled={!hour.is_working}
                      onChange={(e) => updateLocal(hour.id, { closing_time: e.target.value })}
                      className="rounded-2xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white px-4 py-3 outline-none focus:border-violet-500 disabled:bg-gray-100 dark:disabled:bg-slate-600/50"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => save(hour)}
                    disabled={savingId === hour.id}
                    className="rounded-2xl bg-violet-600 px-5 py-3 font-semibold text-white disabled:opacity-60"
                  >
                    {savingId === hour.id ? t('employee_schedule.saving') : t('employee_schedule.save')}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default EmployeeSchedule;
