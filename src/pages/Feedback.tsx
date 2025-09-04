import React from 'react';
import { FeedbackForm } from '@/components/FeedbackForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SEOHead } from '@/components/SEOHead';

const Feedback: React.FC = () => {
  const navigate = useNavigate();

  return (
    <>
      <SEOHead 
        currentFolder={null}
        currentPath="/feedback"
        pageType="feedback"
        customTitle="Problem Set Feedback"
        customDescription="Report errors and provide feedback on academic problem sets. Help us maintain accurate and high-quality educational content for all students."
      />
      <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Drive Explorer
          </Button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              Problem Set Feedback
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              If you see something wrong or a mistake in our problem sets, feel free to correct it here.
              Your feedback helps us maintain accurate and high-quality educational content.
            </p>
          </div>
        </div>

        {/* Feedback Form */}
        <FeedbackForm />
      </div>
    </div>
    </>
  );
};

export default Feedback;