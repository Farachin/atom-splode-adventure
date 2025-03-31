
import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface ExplanationProps {
  text: string;
  className?: string;
}

export const Explanation = ({ text, className }: ExplanationProps) => {
  return (
    <Card className={cn('bg-blue-100 border-blue-300', className)}>
      <CardContent className="p-4">
        <p className="text-lg font-medium leading-relaxed">{text}</p>
      </CardContent>
    </Card>
  );
};

export default Explanation;
