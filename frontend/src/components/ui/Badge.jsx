import React from 'react';
import { classNames } from '../../data/helpers';

const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: "bg-gray-100 text-gray-800 border border-gray-200",
    success: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    warning: "bg-orange-100 text-orange-800 border border-orange-200",
    danger:  "bg-red-100 text-red-800 border border-red-200",
    info:    "bg-blue-100 text-blue-800 border border-blue-200",
    purple:  "bg-purple-100 text-purple-800 border border-purple-200"
  };
  return (
    <span className={classNames("inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider", variants[variant], className)}>
      {children}
    </span>
  );
};

export default Badge;