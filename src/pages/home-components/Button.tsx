import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    ...props
}) => {
    const baseStyles = 'inline-flex items-center justify-center font-bold tracking-tight transition-all duration-300 rounded-2xl focus:outline-none active:scale-95 disabled:opacity-50';

    const variants = {
        primary: 'bg-[#2E5E99] text-white hover:bg-[#2E5E99]/90 shadow-[0_10px_40px_-10px_rgba(46,94,153,0.5)]',
        secondary: 'bg-[#7BA4D0] text-white hover:bg-[#7BA4D0]/90 shadow-sm',
        outline: 'bg-transparent border border-[#2E5E99]/20 text-[#2E5E99] hover:bg-[#2E5E99]/5',
        ghost: 'bg-transparent text-[#2E5E99] hover:bg-[#2E5E99]/10'
    };

    const sizes = {
        sm: 'px-5 py-2.5 text-xs',
        md: 'px-8 py-4 text-sm',
        lg: 'px-12 py-6 text-base',
        icon: 'p-3'
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};
