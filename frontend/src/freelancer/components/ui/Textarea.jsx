import React from 'react';
import { classNames } from '../../data/helpers';

const Textarea = ({ label, id, error, className = '', ...props }) => (
  <div className={classNames("mb-4", className)}>
    {label && <label htmlFor={id} className="block text-sm font-bold text-gray-700 mb-1.5">{label}</label>}
    <textarea
      id={id}
      className={classNames(
        "block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm px-4 py-2 border transition-colors resize-y",
        error ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""
      )}
      {...props}
    />
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);

export default Textarea;