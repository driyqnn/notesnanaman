import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const FeedbackLink: React.FC = () => {
  return (
    <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <MessageSquare className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-amber-800 dark:text-amber-200 mb-2">
              If you see something wrong or a mistake with our problem sets, feel free to correct it here
            </p>
            <Button asChild size="sm" variant="outline" className="h-8">
              <Link to="/feedback" className="inline-flex items-center space-x-1">
                <span>Report Issue</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};