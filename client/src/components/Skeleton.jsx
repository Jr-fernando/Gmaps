import React from 'react';

export default function Skeleton({ width = '100%', height = '16px', borderRadius = '4px', className = '', style = {} }) {
  const styles = {
    width,
    height,
    borderRadius,
    background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.03) 25%, rgba(255, 255, 255, 0.08) 50%, rgba(255, 255, 255, 0.03) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite linear',
    ...style
  };

  return <div className={`skeleton-shimmer ${className}`} style={styles} />;
}

export function SkeletonCard() {
  return (
    <div className="glass-card animate-fade-in" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <Skeleton width="40%" height="12px" />
      <Skeleton width="80%" height="18px" />
      <Skeleton width="100%" height="32px" />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
        <Skeleton width="30%" height="14px" />
        <Skeleton width="30%" height="14px" />
      </div>
    </div>
  );
}

export function SkeletonListRow() {
  return (
    <div className="glass-card animate-fade-in" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexGrow: 1 }}>
        <Skeleton width="35%" height="16px" />
        <Skeleton width="20%" height="12px" />
      </div>
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <Skeleton width="40px" height="16px" />
        <Skeleton width="60px" height="30px" />
      </div>
    </div>
  );
}
