import React from 'react';

const StaticInfoPage = ({ title, description, details = [] }) => {
  return (
    <div className="bg-white">
      <section className="mx-auto flex min-h-[52vh] max-w-3xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
        <p className="mt-5 text-base leading-7 text-slate-600">{description}</p>
        {details.length > 0 && (
          <div className="mt-6 space-y-4 text-left text-sm leading-6 text-slate-600">
            {details.map((detail) => (
              <p key={detail}>{detail}</p>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default StaticInfoPage;
