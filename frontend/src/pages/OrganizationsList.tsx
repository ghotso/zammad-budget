import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../components/ui/card';
import { formatMinutes } from '../lib/utils';
import { getOrganizations, type Organization } from '../lib/api';
import { ClockIcon, WalletIcon, AlertCircleIcon } from 'lucide-react';

export function OrganizationsList() {
  const navigate = useNavigate();
  const { data: organizations, isLoading, error } = useQuery<Organization[]>({
    queryKey: ['organizations'],
    queryFn: getOrganizations
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-destructive gap-4">
          <AlertCircleIcon className="w-12 h-12" />
          <h2 className="text-xl font-semibold">Error loading organizations</h2>
          <p className="text-muted-foreground">Please try again later</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="glass rounded-lg p-6 mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-white/90 to-white/80 bg-clip-text text-transparent">
          Organizations Budget Overview
        </h1>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {organizations?.map((org) => {
          // Calculate remaining budget as negative if no budget is set
          const remainingBudget = org.totalBudget === 0 
            ? -org.trackedMinutes 
            : org.totalBudget - org.trackedMinutes;
          const isNegative = remainingBudget < 0;
          
          return (
            <div
              key={org.id}
              onClick={() => navigate(`/organizations/${org.id}`)}
              className="group transition-all duration-300 hover:scale-[1.02] cursor-pointer"
            >
              <div className={cn(
                'rounded-lg transition-all duration-300',
                isNegative 
                  ? 'bg-gradient-to-br from-red-950/40 via-red-900/30 to-red-950/20 border-red-900/20' 
                  : 'glass'
              )}>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center',
                      isNegative ? 'bg-red-500/10' : 'bg-primary/10'
                    )}>
                      {isNegative ? (
                        <AlertCircleIcon className="w-6 h-6 text-red-400" />
                      ) : (
                        <WalletIcon className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    <h2 className={cn(
                      'text-xl font-semibold',
                      isNegative ? 'text-red-200' : 'text-foreground'
                    )}>
                      {org.name}
                    </h2>
                  </div>

                  <div className={cn(
                    'text-2xl font-bold mb-4',
                    isNegative ? 'text-red-400' : 'text-foreground'
                  )}>
                    {formatMinutes(remainingBudget)}
                  </div>

                  <div className="flex items-center text-sm text-muted-foreground">
                    <ClockIcon className="w-4 h-4 mr-1.5" />
                    <span>Tracked: {formatMinutes(org.trackedMinutes)}</span>
                  </div>
                </div>

                {/* Gradient overlays */}
                <div className="absolute inset-0 pointer-events-none rounded-lg">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white/[0.02]" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Utility function for class names
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}