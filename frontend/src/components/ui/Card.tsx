import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'default' | 'glass' | 'outline' | 'flat';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
    children,
    className = '',
    variant = 'default',
    padding = 'md',
    onClick
}) => {
    const baseClasses = 'rounded-2xl transition-all duration-200';

    const variantClasses = {
        default: 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md',
        glass: 'bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 shadow-lg',
        outline: 'bg-transparent border-2 border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500',
        flat: 'bg-gray-50 dark:bg-gray-800/50 border-none'
    };

    const paddingClasses = {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8'
    };

    const interactiveClasses = onClick ? 'cursor-pointer transform hover:-translate-y-1 active:scale-[0.99]' : '';

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${interactiveClasses} ${className}`}
            onClick={onClick}
        >
            {children}
        </div>
    );
};

export default Card;
