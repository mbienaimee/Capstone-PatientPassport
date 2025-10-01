import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  children: React.ReactNode;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className = '', variant = 'default', children, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    const variants = {
      default: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
      secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
      destructive: 'bg-red-100 text-red-800 hover:bg-red-200',
      outline: 'border border-gray-200 text-gray-800 hover:bg-gray-50'
    };
    
    const classes = `${baseClasses} ${variants[variant]} ${className}`;
    
    return (
      <div
        ref={ref}
        className={classes}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Badge.displayName = 'Badge';

export { Badge };
