import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SEO from '../components/SEO';
import {
  ClockIcon,
  BuildingStorefrontIcon,
  PaperAirplaneIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserCircleIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';

const FEATURES = [
  {
    key: 'booking',
    Icon: ClockIcon,
    color: 'text-[#2eadd0]',
    bg: 'bg-[#e8f7fb] dark:bg-[#0e2e38]',
  },
  {
    key: 'profiles',
    Icon: BuildingStorefrontIcon,
    color: 'text-violet-500',
    bg: 'bg-violet-50 dark:bg-violet-900/20',
  },
  {
    key: 'telegram',
    Icon: PaperAirplaneIcon,
    color: 'text-sky-500',
    bg: 'bg-sky-50 dark:bg-sky-900/20',
  },
  {
    key: 'trilingual',
    Icon: GlobeAltIcon,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
  },
  {
    key: 'security',
    Icon: ShieldCheckIcon,
    color: 'text-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
  },
  {
    key: 'analytics',
    Icon: ChartBarIcon,
    color: 'text-rose-500',
    bg: 'bg-rose-50 dark:bg-rose-900/20',
  },
];

const PROBLEM_KEYS = ['problem_item1', 'problem_item2', 'problem_item3', 'problem_item4'];
const SOLUTION_KEYS = ['solution_item1', 'solution_item2', 'solution_item3', 'solution_item4'];

const About = () => {
  const { t } = useTranslation();

  return (
    <>
      <SEO
        title="About Reserva"
        description="Learn about Reserva — the team, mission, and vision behind Uzbekistan's leading online booking platform for service businesses."
        path="/about"
      />

      <div className="bg-white dark:bg-[#0f1118]">

        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <section className="bg-[#1a1a2e] px-4 py-20 text-center sm:py-28">
          <span className="inline-block rounded-full bg-[#2eadd0]/20 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#2eadd0]">
            {t('about_page.mission_label')}
          </span>
          <h1 className="mx-auto mt-4 max-w-2xl text-3xl font-extrabold leading-tight text-white sm:text-5xl">
            {t('about_page.hero_title')}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-400 sm:text-lg">
            {t('about_page.hero_subtitle')}
          </p>
        </section>

        {/* ── INTRO ────────────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-6">
          <p className="text-lg leading-8 text-slate-600 dark:text-slate-300">
            {t('about_page.intro_text')}
          </p>
        </section>

        {/* ── MISSION / PROBLEM + SOLUTION ─────────────────────────────────── */}
        <section className="bg-[#f7f8fa] dark:bg-[#111827] px-4 py-14 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="mb-10 text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-[#2eadd0]">
                {t('about_page.mission_label')}
              </span>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white sm:text-3xl">
                {t('about_page.mission_title')}
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-400">
                {t('about_page.mission_text')}
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {/* Problems */}
              <div className="rounded-2xl border border-red-100 bg-white p-6 shadow-sm dark:border-red-900/20 dark:bg-slate-800">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-red-500">
                  <XCircleIcon className="h-5 w-5 flex-shrink-0" />
                  {t('about_page.problem_label')}
                </h3>
                <ul className="space-y-3">
                  {PROBLEM_KEYS.map((key) => (
                    <li key={key} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                      <span className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-red-400" />
                      {t(`about_page.${key}`)}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Solutions */}
              <div className="rounded-2xl border border-[#2eadd0]/20 bg-white p-6 shadow-sm dark:border-[#2eadd0]/20 dark:bg-slate-800">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[#2eadd0]">
                  <CheckCircleIcon className="h-5 w-5 flex-shrink-0" />
                  {t('about_page.solution_label')}
                </h3>
                <ul className="space-y-3">
                  {SOLUTION_KEYS.map((key) => (
                    <li key={key} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                      <span className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-[#2eadd0]" />
                      {t(`about_page.${key}`)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURES GRID ────────────────────────────────────────────────── */}
        <section className="px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="mb-10 text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-[#2eadd0]">
                {t('about_page.features_label')}
              </span>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white sm:text-3xl">
                {t('about_page.features_title')}
              </h2>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ key, Icon, color, bg }) => (
                <div
                  key={key}
                  className="flex flex-col gap-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 transition hover:shadow-md dark:bg-slate-800 dark:ring-slate-700/50"
                >
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${bg}`}>
                    <Icon className={`h-6 w-6 ${color}`} />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    {t(`about_page.feature_${key}_title`)}
                  </h3>
                  <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
                    {t(`about_page.feature_${key}_text`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FOUNDER ──────────────────────────────────────────────────────── */}
        <section className="bg-[#f7f8fa] dark:bg-[#111827] px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-[#2eadd0]">
              {t('about_page.founder_label')}
            </span>

            <div className="mt-8 flex flex-col items-center gap-5 rounded-2xl bg-white px-6 py-10 shadow-sm dark:bg-slate-800 sm:flex-row sm:text-left">
              {/* Avatar */}
              <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-[#1a1a2e] text-2xl font-extrabold text-[#2eadd0] sm:h-24 sm:w-24">
                AI
              </div>

              <div className="flex-1">
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  {t('about_page.founder_name')}
                </p>
                <p className="mt-0.5 text-sm font-medium text-[#2eadd0]">
                  {t('about_page.founder_role')}
                </p>
                <div className="mt-1 flex items-center justify-center gap-1 sm:justify-start">
                  <MapPinIcon className="h-4 w-4 text-slate-400" />
                  <span className="text-xs text-slate-400">{t('about_page.founder_location')}</span>
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {t('about_page.founder_bio')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────────────── */}
        <section className="bg-[#1a1a2e] px-4 py-16 text-center sm:px-6">
          <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
            {t('about_page.cta_title')}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-slate-400">
            {t('about_page.cta_text')}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/services"
              className="w-full rounded-xl bg-[#2eadd0] px-8 py-3 text-sm font-semibold text-white transition hover:bg-[#29a0c0] sm:w-auto"
            >
              {t('about_page.cta_explore')}
            </Link>
            <Link
              to="/register"
              className="w-full rounded-xl border border-white/20 px-8 py-3 text-sm font-semibold text-white transition hover:bg-white/10 sm:w-auto"
            >
              {t('about_page.cta_register')}
            </Link>
          </div>
        </section>

      </div>
    </>
  );
};

export default About;
