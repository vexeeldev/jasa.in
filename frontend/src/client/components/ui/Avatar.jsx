import React from 'react';
import { CheckCircle } from 'lucide-react';
import { classNames } from '../../data/helpers';

const Avatar = ({ src, alt, size = 'md', verified = false }) => {
  const sizes = { sm: "w-8 h-8", md: "w-10 h-10", lg: "w-16 h-16", xl: "w-24 h-24", xxl: "w-32 h-32" };
  return (
    <div className="relative inline-block">
      <img
        src={src || 'https://via.placeholder.com/150'}
        alt={alt || 'Avatar'}
        className={classNames("rounded-full object-cover border border-gray-200", sizes[size])}
      />
      {verified && (
        <div className="absolute bottom-0 right-0 bg-white rounded-full p-0.5 shadow-sm transform translate-x-1/4 translate-y-1/4">
          <CheckCircle className="w-4 h-4 text-blue-500 fill-current bg-white rounded-full" />
        </div>
      )}
    </div>
  );
};

export default Avatar;