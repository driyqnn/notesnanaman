import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ImageUpload } from './ImageUpload';
import { sendFeedbackToDiscord, FeedbackData } from '@/services/discord';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send } from 'lucide-react';

interface FormData {
  subjectCategory: string;
  problemSetNumber: number;
  problemNumber: number;
  issueDescription: string;
  correctAnswer?: string;
}

export const FeedbackForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [solutionImages, setSolutionImages] = useState<File[]>([]);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset
  } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    
    try {
      const feedbackData: FeedbackData = {
        ...data,
        solutionImages: solutionImages.length > 0 ? solutionImages : undefined
      };

      await sendFeedbackToDiscord(feedbackData);
      
      toast({
        title: "Feedback Submitted Successfully!",
        description: "Thank you for helping improve our problem sets. Your feedback has been sent to our team.",
      });

      // Reset form
      reset();
      setSolutionImages([]);
    } catch (error) {
      toast({
        title: "Failed to Submit Feedback",
        description: "Please try again later or contact support if the issue persists.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Send className="h-5 w-5" />
          <span>Problem Set Feedback</span>
        </CardTitle>
        <CardDescription>
          Help us improve our problem sets by reporting errors or suggesting corrections.
          All feedback is reviewed by our team.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Subject Category */}
          <div className="space-y-2">
            <Label htmlFor="subjectCategory">Subject Category *</Label>
            <Input
              id="subjectCategory"
              placeholder="e.g., Differential Calculus, Linear Algebra, Statistics, etc."
              {...register('subjectCategory', {
                required: 'Subject category is required',
                minLength: { value: 2, message: 'Please enter at least 2 characters' }
              })}
            />
            {errors.subjectCategory && (
              <p className="text-sm text-destructive">{errors.subjectCategory.message}</p>
            )}
          </div>

          {/* Problem Set Number */}
          <div className="space-y-2">
            <Label htmlFor="problemSetNumber">Problem Set Number *</Label>
            <Input
              id="problemSetNumber"
              type="number"
              min="1"
              placeholder="e.g., 3"
              {...register('problemSetNumber', {
                required: 'Problem set number is required',
                min: { value: 1, message: 'Must be at least 1' }
              })}
            />
            {errors.problemSetNumber && (
              <p className="text-sm text-destructive">{errors.problemSetNumber.message}</p>
            )}
          </div>

          {/* Problem Number */}
          <div className="space-y-2">
            <Label htmlFor="problemNumber">Problem Number *</Label>
            <Input
              id="problemNumber"
              type="number"
              min="1"
              placeholder="e.g., 15"
              {...register('problemNumber', {
                required: 'Problem number is required',
                min: { value: 1, message: 'Must be at least 1' }
              })}
            />
            {errors.problemNumber && (
              <p className="text-sm text-destructive">{errors.problemNumber.message}</p>
            )}
          </div>

          {/* Issue Description */}
          <div className="space-y-2">
            <Label htmlFor="issueDescription">What's wrong? *</Label>
            <Textarea
              id="issueDescription"
              placeholder="Describe the issue you found. Be as specific as possible..."
              rows={4}
              {...register('issueDescription', {
                required: 'Issue description is required',
                minLength: { value: 10, message: 'Please provide more detail (at least 10 characters)' }
              })}
            />
            {errors.issueDescription && (
              <p className="text-sm text-destructive">{errors.issueDescription.message}</p>
            )}
          </div>

          {/* Correct Answer */}
          <div className="space-y-2">
            <Label htmlFor="correctAnswer">What should it be? (Optional)</Label>
            <Textarea
              id="correctAnswer"
              placeholder="Provide the correct answer or solution if you know it..."
              rows={3}
              {...register('correctAnswer')}
            />
          </div>

          {/* Solution Images */}
          <div className="space-y-2">
            <Label>Solution Images (Optional)</Label>
            <ImageUpload
              files={solutionImages}
              onFilesChange={setSolutionImages}
              maxFiles={5}
              maxFileSize={10}
            />
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting Feedback...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit Feedback
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Your feedback helps us maintain high-quality educational content.
            Thank you for contributing to the community!
          </p>
        </form>
      </CardContent>
    </Card>
  );
};