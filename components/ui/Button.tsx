// components/ui/Button.tsx
import React from 'react';
import clsx from 'clsx';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
}

export default function Button({ children, variant = 'primary', className, ...props }: Props) {
  const base = "px-4 py-2 rounded font-medium transition focus:outline-none";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
    outline: "border border-gray-400 text-gray-700 hover:bg-gray-100"
  };

  return (
    <button className={clsx(base, variants[variant], className)} {...props}>
      {children}
    </button>
  );
}