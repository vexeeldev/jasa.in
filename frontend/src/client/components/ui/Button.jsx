import React from 'react';
import { classNames } from '../../data/helpers';

const Button = ({ children, variant = 'primary', size = 'md', className = '', icon: Icon, fullWidth = false, disabled = false, ...props }) => {
  const baseStyle = "inline-flex items-center justify-center font-bold rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:  "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500",
    secondary:"bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-emerald-500",
    danger:   "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    ghost:    "bg-transparent text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 focus:ring-emerald-500",
    dark:     "bg-gray-900 text-white hover:bg-gray-800 focus:ring-gray-900",
    outline:  "border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 focus:ring-emerald-500"
  };

  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm", lg: "px-6 py-3 text-base" };

  return (
    <button
      className={classNames(baseStyle, variants[variant], sizes[size], fullWidth ? 'w-full' : '', className)}
      disabled={disabled}
      {...props}
    >
      {Icon && <Icon className={classNames("w-4 h-4", children ? "mr-2" : "")} />}
      {children}
    </button>
  );
};

export default Button;