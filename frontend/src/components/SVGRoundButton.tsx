import React from 'react';

interface SvgRoundButtonProps {
  onClick: () => void;
  direction?: 'left' | 'right' | 'up' | 'down';
  size?: number;
  color?: string;
  className?: string;
}

const SvgRoundButton: React.FC<SvgRoundButtonProps> = ({
  onClick,
  direction = 'left',
  size = 60,
  color = '#3e6cecff',
  className = ''
}) => {
  const getRotation = () => {
    switch (direction) {
      case 'left': return '0';
      case 'right': return '180';
      case 'up': return '270';
      case 'down': return '90';
      default: return '0';
    }
  };

  return (
    <button
      className={`${className}`}
      onClick={onClick}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: '50%', // ← ДОБАВЬТЕ ЭТО К КНОПКЕ, а не к SVG!
      }}
    >
      <svg
        width={size * 0.5}
        height={size * 0.5}
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ 
          transform: `rotate(${getRotation()}deg)`,
          transition: 'transform 0.3s ease',
        }}
      >
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
      </svg>
    </button>
  );
};

export default SvgRoundButton;
