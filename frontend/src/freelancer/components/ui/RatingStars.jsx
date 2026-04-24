import React from 'react';
import { Star } from 'lucide-react';
import { classNames } from '../../data/helpers';

const RatingStars = ({ rating, count, showCount = true, size = 'sm' }) => {
  const starSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5';
  return (
    <div className="flex items-center">
      <Star className={classNames(starSize, "text-yellow-400 fill-current")} />
      <span className={classNames("font-bold text-gray-900 ml-1", size === 'sm' ? 'text-sm' : 'text-base')}>{rating}</span>
      {showCount && <span className={classNames("text-gray-500 ml-1", size === 'sm' ? 'text-xs' : 'text-sm')}>({count})</span>}
    </div>
  );
};

export default RatingStars;