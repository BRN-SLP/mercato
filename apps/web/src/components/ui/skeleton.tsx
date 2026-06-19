import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Loading placeholder. Pulses a muted block sized by `className`.
 * Used by the route-level loading.tsx files (basket, rewards, scan).
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  );
}

export { Skeleton };
