import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps {
  title: string;
  value: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'negative';
  className?: string;
  children?: React.ReactNode;
}

export function Card({
  title,
  value,
  icon,
  variant = 'default',
  className,
  children
}: CardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg transition-all duration-300',
        variant === 'negative' 
          ? 'bg-gradient-to-br from-red-950/40 via-red-900/30 to-red-950/20 border-red-900/20 backdrop-blur-md' 
          : 'glass',
        className
      )}
    >
      <div className="flex flex-col space-y-2.5 p-6">
        <div className="flex items-center gap-2">
          {icon && (
            <span className={cn(
              'transition-colors duration-300',
              variant === 'negative' ? 'text-red-400' : 'text-primary'
            )}>
              {icon}
            </span>
          )}
          <h3 className={cn(
            'text-sm font-medium leading-none',
            variant === 'negative' ? 'text-red-200' : 'text-muted-foreground'
          )}>
            {title}
          </h3>
        </div>
        <div className={cn(
          'text-2xl font-bold tracking-tight',
          variant === 'negative' ? 'text-red-400' : 'text-foreground'
        )}>
          {value}
        </div>
        {children && (
          <div className={cn(
            'text-sm',
            variant === 'negative' ? 'text-red-300/80' : 'text-muted-foreground'
          )}>
            {children}
          </div>
        )}
      </div>
      {variant === 'negative' && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-red-950/10 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-red-900/5" />
        </div>
      )}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white/[0.02]" />
      </div>
      <div className="absolute inset-px rounded-[7px] pointer-events-none">
        <div className={cn(
          "absolute inset-0 rounded-[7px] transition-opacity duration-300",
          variant === 'negative' 
            ? 'bg-gradient-to-br from-red-900/20 to-transparent opacity-0 group-hover:opacity-100'
            : 'bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100'
        )} />
      </div>
    </div>
  );
}