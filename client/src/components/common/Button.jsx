import React from 'react';

export default function Button({ 
  children, 
  variant = 'primary', 
  loading = false, 
  disabled = false, 
  icon, 
  className = '', 
  ...props 
}) {
  const baseClass = () => {
    switch (variant) {
      case 'primary': return 'btn-trigger-cron';
      case 'secondary': return 'btn-channel';
      case 'search': return 'btn-search';
      case 'save': return 'btn-save-settings';
      case 'back': return 'btn-back';
      case 'proposal': return 'btn-proposal-generate';
      default: return 'btn-trigger-cron';
    }
  };

  return (
    <button 
      className={`${baseClass()} ${className} ${loading ? 'spin' : ''}`}
      disabled={loading || disabled}
      {...props}
    >
      {loading ? (
        <div className="loader-spinner" style={{ width: '12px', height: '12px', borderTopColor: 'inherit' }}></div>
      ) : (
        <>
          {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}
