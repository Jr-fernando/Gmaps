import React from 'react';

export default function Input({
  label,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  options = [],
  className = '',
  textarea = false,
  select = false,
  error = '',
  icon,
  mini = false,
  ...props
}) {
  const inputClass = mini ? 'input-field-mini' : 'input-field';
  const labelClass = mini ? 'input-label-mini' : 'input-label';
  const textareaClass = mini ? 'input-textarea-mini' : 'message-textarea';

  return (
    <div className={`input-group ${className}`} style={{ position: 'relative', width: '100%' }}>
      {label && <label className={labelClass}>{label}</label>}
      
      {textarea ? (
        <textarea
          className={textareaClass}
          placeholder={placeholder}
          value={value || ''}
          onChange={onChange}
          {...props}
        />
      ) : select ? (
        <select
          className={inputClass}
          value={value || ''}
          onChange={onChange}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <div style={{ position: 'relative', width: '100%' }}>
          {icon && <span className={mini ? 'input-icon-mini' : ''}>{icon}</span>}
          <input
            type={type}
            className={inputClass}
            placeholder={placeholder}
            value={value || ''}
            onChange={onChange}
            {...props}
          />
        </div>
      )}
      {error && <span style={{ color: 'var(--color-danger)', fontSize: '11px', marginTop: '2px' }}>{error}</span>}
    </div>
  );
}
