import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  showText = true, 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Logo Icon */}
      <div className={`${sizeClasses[size]} bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center shadow-md`}>
        <svg 
          className={`${size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : size === 'lg' ? 'w-7 h-7' : 'w-9 h-9'} text-white`} 
          fill="currentColor" 
          viewBox="0 0 24 24"
        >
          {/* Medical Cross with Shield */}
          <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" fill="currentColor"/>
          <path d="M12 4.5c-3.86 0-7 3.14-7 7s3.14 7 7 7 7-3.14 7-7-3.14-7-7-7zm0 12c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" fill="white"/>
          <path d="M12 8h-2v4H8v2h4v4h2v-4h4v-2h-4V8z" fill="currentColor"/>
        </svg>
      </div>
      
      {/* Logo Text */}
      {showText && (
        <span className={`${textSizeClasses[size]} font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent`}>
          PatientPassport
        </span>
      )}
    </div>
  );
};

export default Logo;

