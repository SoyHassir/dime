import React from 'react';
import robotIcon from '../../assets/robot-icon.png';

export const DimeRobotIcon = ({ className = "w-8 h-8" }) => {
  return (
    <img 
      src={robotIcon} 
      alt="DIME Robot" 
      className={className}
      style={{ objectFit: 'contain' }}
    />
  );
};

