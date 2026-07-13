import React from 'react';

export default function Card({ children, className = '', onClick, ...props }) {
  return (
    <div 
      className={`glass-card ${className}`} 
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : {}}
      {...props}
    >
      {children}
    </div>
  );
}
