import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import SEO from '../components/SEO';
import {
  EnvelopeIcon,
  GlobeAltIcon,
  MapPinIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

const CONTACT_EMAIL = 'support@reserva.services';
const CONTACT_WEBSITE = 'reserva.services';

// ── FAQ item (collapsible) ───────────────────────────────────────────────────
const FaqItem = ({ question, answer }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 dark:border-slate-700">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-5 text-left"
      >
        <span className="font-semibold text-slate-900 dark:text-white">{question}</span>
        <ChevronDownIcon
          className={`h-5 w-5 flex-shrink-0 text-slate-400 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      {open && (
        <p className="pb-5 text-sm leading-7 text-slate-600 dark:text-slate-400">{answer}</p>
      )}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const Contact = () => {
  const { t } = useTranslation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const body = [
      name.trim() ? `Name: ${name.trim()}` : '',
      email.trim() ? `Email: ${email.trim()}` : '',
      '',
      message.trim(),
    ]
      .filter((line, i) => i < 2 || line !== '' || i === 2)
      .join('\n');

    const mailto = [
      `mailto:${CONTACT_EMAIL}`,
      `?subject=${encodeURIComponent(subject.trim() || 'Message from reserva.services')}`,
      `&body=${encodeURIComponent(body)}`,
    ].join('');

    window.location.href = mailto;
  };

  const CONTACT_CARDS = [
    {
      key: 'email',
      Icon: EnvelopeIcon,
      accent: 'text-[#2eadd0]',
      bg: 'bg-[#e8f7fb] dark:bg-[#0e2e38]',
      value: CONTACT_EMAIL,
      href: `mailto:${CONTACT_EMAIL}`,
    },
    {
      key: 'website',
      Icon: GlobeAltIcon,
      accent: 'text-violet-500',
      bg: 'bg-violet-50 dark:bg-violet-900/20',
      value: CONTACT_WEBSITE,
      href: `https://${CONTACT_WEBSITE}`,
    },
    {
      key: 'location',
      Icon: MapPinIcon,
      accent: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      value: t('contact_page.location_value'),
      href: null,
    },
  ];

  const FAQ_KEYS = ['booking', 'business', 'cancel'];

  return (
    <>
      <SEO
        title="Contact Us"
        description="Get in touch with the Reserva team. We're here to help businesses and customers across Uzbekistan with any questions about our booking platform."
        path="/contact"
      />

      <div className="bg-white dark:bg-[#0f1118]">

        {/* ── HERO ───────────────────────────────────────────────────────── */}
        <section className="bg-[#1a1a2e] px-4 py-20 text-center sm:py-28">
          <h1 className="text-3xl font-extrabold text-white sm:text-5xl">
            {t('contact_page.hero_title')}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-400 sm:text-lg">
            {t('contact_page.hero_subtitle')}
          </p>
        </section>

        {/* ── CONTACT CARDS ──────────────────────────────────────────────── */}
        <section className="px-4 py-14 sm:px-6">
          <div className="mx-auto grid max-w-4xl gap-5 sm:grid-cols-3">
            {CONTACT_CARDS.map(({ key, Icon, accent, bg, value, href }) => (
              <div
                key={key}
                className="flex flex-col items-center rounded-2xl bg-white p-7 text-center shadow-sm ring-1 ring-slate-100 transition hover:shadow-md dark:bg-slate-800 dark:ring-slate-700/50"
              >
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${bg}`}>
                  <Icon className={`h-6 w-6 ${accent}`} />
                </div>
                <p className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-400">
                  {t(`contact_page.${key}_label`)}
                </p>
                {href ? (
                  <a
                    href={href}
                    target={href.startsWith('http') ? '_blank' : undefined}
                    rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className={`mb-2 text-sm font-semibold break-all ${accent} hover:underline`}
                  >
                    {value}
                  </a>
                ) : (
                  <p className={`mb-2 text-sm font-semibold ${accent}`}>{value}</p>
                )}
                <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
                  {t(`contact_page.${key}_desc`)}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CONTACT FORM ───────────────────────────────────────────────── */}
        <section className="bg-[#f7f8fa] px-4 py-14 dark:bg-[#111827] sm:px-6">
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-2 text-xl font-extrabold text-slate-900 dark:text-white sm:text-2xl">
              {t('contact_page.form_title')}
            </h2>
            <p className="mb-8 text-sm leading-6 text-slate-500 dark:text-slate-400">
              {t('contact_page.form_subtitle')}
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name + Email side by side on desktop */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    {t('contact_page.form_name')}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('contact_page.form_name_placeholder')}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#2eadd0] focus:outline-none focus:ring-2 focus:ring-[#2eadd0]/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-[#2eadd0]"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    {t('contact_page.form_email')}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('contact_page.form_email_placeholder')}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#2eadd0] focus:outline-none focus:ring-2 focus:ring-[#2eadd0]/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-[#2eadd0]"
                  />
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t('contact_page.form_subject')}
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={t('contact_page.form_subject_placeholder')}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#2eadd0] focus:outline-none focus:ring-2 focus:ring-[#2eadd0]/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-[#2eadd0]"
                />
              </div>

              {/* Message */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t('contact_page.form_message')}
                </label>
                <textarea
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t('contact_page.form_message_placeholder')}
                  className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#2eadd0] focus:outline-none focus:ring-2 focus:ring-[#2eadd0]/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-[#2eadd0]"
                />
              </div>

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2eadd0] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#29a0c0] sm:w-auto"
              >
                <EnvelopeIcon className="h-4 w-4" />
                {t('contact_page.form_submit')}
              </button>
            </form>

            <p className="mt-5 text-xs leading-5 text-slate-400 dark:text-slate-500">
              {t('contact_page.form_note')}
            </p>
          </div>
        </section>

        {/* ── FAQ ────────────────────────────────────────────────────────── */}
        <section className="px-4 py-14 sm:px-6">
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-8 text-xl font-extrabold text-slate-900 dark:text-white sm:text-2xl">
              {t('contact_page.faq_title')}
            </h2>
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {FAQ_KEYS.map((key) => (
                <FaqItem
                  key={key}
                  question={t(`contact_page.faq_${key}_q`)}
                  answer={t(`contact_page.faq_${key}_a`)}
                />
              ))}
            </div>
          </div>
        </section>

      </div>
    </>
  );
};

export default Contact;
