import React from 'react';
import { classNames } from '../../data/helpers';

const Card = ({ children, className = '', noPadding = false, onClick }) => (
  <div
    className={classNames("bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden", onClick ? "cursor-pointer transition-shadow hover:shadow-md" : "", className)}
    onClick={onClick}
  >
    <div className={noPadding ? "" : "p-6"}>
      {children}
    </div>
  </div>
);

export default Card;