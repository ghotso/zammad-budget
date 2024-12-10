import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../components/ui/card';
import { BudgetDialog } from '../components/BudgetDialog';
import { formatMinutes } from '../lib/utils';
import { getOrganizations, updateOrganizationBudget, getBudgetHistory, getMonthlyTracking } from '../lib/api';
import { ArrowLeftIcon, WalletIcon, ClockIcon, AlertCircleIcon, PlusIcon, MinusIcon } from 'lucide-react';

export function OrganizationDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const organizationId = id ? parseInt(id, 10) : 0;

  const { data: organizations, isLoading: isLoadingOrg } = useQuery({
    queryKey: ['organizations'],
    queryFn: getOrganizations
  });

  const { data: budgetHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['budgetHistory', id],
    queryFn: () => getBudgetHistory(id || '0')
  });

  const { data: monthlyTracking, isLoading: isLoadingTracking } = useQuery({
    queryKey: ['monthlyTracking', id],
    queryFn: () => getMonthlyTracking(id || '0')
  });

  const updateBudgetMutation = useMutation({
    mutationFn: async (params: { minutes: number; description: string }) => {
      const result = await updateOrganizationBudget(
        id || '0',
        params.minutes,
        params.description
      );
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['budgetHistory', id] });
    }
  });

  const organization = organizations?.find(org => org.id === organizationId);

  if (isLoadingOrg || isLoadingHistory || isLoadingTracking) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-destructive gap-4">
          <AlertCircleIcon className="w-12 h-12" />
          <h2 className="text-xl font-semibold">Organization not found</h2>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-primary hover:underline"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Organizations
          </button>
        </div>
      </div>
    );
  }

  const remainingBudget = organization.totalBudget === 0 
    ? -organization.trackedMinutes 
    : organization.totalBudget - organization.trackedMinutes;
  const isNegative = remainingBudget < 0;

  const handleBudgetUpdate = (minutes: number, description: string) => {
    updateBudgetMutation.mutate({ minutes, description });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatMonth = (monthString: string) => {
    const [year, month] = monthString.split('-');
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-primary hover:underline"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Organizations
        </button>
        <h1 className="text-3xl font-bold">{organization.name}</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card
          title="Total Budget"
          value={formatMinutes(organization.totalBudget)}
          icon={<WalletIcon className="w-5 h-5" />}
        />
        <Card
          title="Tracked Time"
          value={formatMinutes(organization.trackedMinutes)}
          icon={<ClockIcon className="w-5 h-5" />}
        />
        <Card
          title="Remaining Budget"
          value={formatMinutes(remainingBudget)}
          variant={isNegative ? "negative" : "default"}
          icon={isNegative ? <AlertCircleIcon className="w-5 h-5" /> : <WalletIcon className="w-5 h-5" />}
        />
      </div>

      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Budget Management</h2>
          <BudgetDialog 
            organizationName={organization.name}
            onSubmit={handleBudgetUpdate}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="glass rounded-lg">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Budget History</h3>
              <div className="space-y-3">
                {updateBudgetMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span>Updating budget...</span>
                  </div>
                ) : null}
                
                {budgetHistory?.map((entry) => (
                  <div
                    key={entry.id}
                    className="glass p-4 rounded-lg transition-all duration-300 hover:scale-[1.02]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {entry.minutes >= 0 ? (
                          <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                            <PlusIcon className="w-5 h-5 text-green-500" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                            <MinusIcon className="w-5 h-5 text-red-500" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{formatMinutes(entry.minutes)}</div>
                          <div className="text-sm text-muted-foreground">{entry.description}</div>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(entry.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="glass rounded-lg">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Monthly Tracked Time</h3>
              <div className="space-y-3">
                {monthlyTracking?.map((month) => (
                  <div
                    key={month.month}
                    className="glass p-4 rounded-lg transition-all duration-300 hover:scale-[1.02]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <ClockIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="font-medium">{formatMonth(month.month)}</div>
                      </div>
                      <div className="text-muted-foreground">
                        {formatMinutes(month.minutes)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}