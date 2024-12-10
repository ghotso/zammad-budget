import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { formatMinutes } from '../lib/utils';
import { useTranslation } from '../lib/useTranslation';
import { PlusIcon, MinusIcon } from 'lucide-react';

interface BudgetDialogProps {
  organizationName: string;
  onSubmit: (minutes: number, description: string) => void;
}

export function BudgetDialog({ organizationName, onSubmit }: BudgetDialogProps) {
  const [minutes, setMinutes] = useState('');
  const [description, setDescription] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedMinutes = parseInt(minutes, 10);
    if (!isNaN(parsedMinutes) && description.trim()) {
      onSubmit(parsedMinutes, description.trim());
      setMinutes('');
      setDescription('');
      setIsOpen(false);
    }
  };

  const parsedMinutes = parseInt(minutes, 10);
  const isPositive = !isNaN(parsedMinutes) && parsedMinutes >= 0;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary/90 text-primary-foreground hover:bg-primary/80 h-10 px-4 py-2 glass">
          <PlusIcon className="w-4 h-4" />
          {t.budget.addRemoveBudget}
        </button>
      </DialogTrigger>
      <DialogContent className="glass-dialog sm:max-w-[425px] border-white/10">
        <DialogHeader>
          <DialogTitle className="text-xl bg-gradient-to-r from-white via-white/90 to-white/80 bg-clip-text text-transparent">
            {t.budget.addRemoveBudget}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {organizationName}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-6 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="minutes" className="text-right text-muted-foreground text-sm">
              {t.budget.trackedTime}
            </label>
            <div className="col-span-3 relative">
              <input
                id="minutes"
                type="number"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className="w-full h-10 pl-10 rounded-md border bg-background/30 backdrop-blur-sm px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300"
                placeholder="60 or -30"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                {isPositive ? (
                  <PlusIcon className="w-4 h-4 text-green-500" />
                ) : (
                  <MinusIcon className="w-4 h-4 text-red-500" />
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="description" className="text-right text-muted-foreground text-sm">
              {t.common.description}
            </label>
            <input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3 flex h-10 w-full rounded-md border bg-background/30 backdrop-blur-sm px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300"
              placeholder={t.common.enterDescription}
            />
          </div>
          {minutes && !isNaN(parsedMinutes) && (
            <div className={`text-sm p-4 rounded-md backdrop-blur-sm transition-all duration-300 ${
              isPositive ? 'bg-green-500/10 text-green-300' : 'bg-red-500/10 text-red-300'
            }`}>
              {isPositive ? t.budget.willAdd : t.budget.willRemove}{' '}
              <span className="font-medium">
                {formatMinutes(Math.abs(parsedMinutes))}
              </span>
            </div>
          )}
        </form>
        <DialogFooter className="gap-2">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border bg-background/30 backdrop-blur-sm hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 glass"
          >
            {t.common.cancel}
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={!minutes || isNaN(parsedMinutes) || !description.trim()}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary/90 text-primary-foreground hover:bg-primary/80 h-10 px-4 py-2 glass disabled:bg-muted"
          >
            {t.common.save}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}