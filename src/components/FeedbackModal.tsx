import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ImageUpload } from './ImageUpload';
import { MessageSquare, Camera, Send, AlertTriangle, Info, Bug } from 'lucide-react';
import { motion } from 'framer-motion';
import { sendFeedbackToDiscord } from '../services/discord';
import { useToast } from '@/hooks/use-toast';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

const severityConfig = {
  low: { label: 'Low', icon: Info, color: 'text-blue-500' },
  medium: { label: 'Medium', icon: AlertTriangle, color: 'text-yellow-500' },
  high: { label: 'High', icon: AlertTriangle, color: 'text-orange-500' },
  critical: { label: 'Critical', icon: Bug, color: 'text-red-500' }
};

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: '' as SeverityLevel | '',
    category: '',
    email: ''
  });
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const categories = [
    'Bug Report',
    'Feature Request',
    'Performance Issue',
    'UI/UX Feedback',
    'Security Concern',
    'Documentation',
    'Other'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim() || !formData.severity) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Prepare feedback data for Discord
      const feedbackData = {
        subjectCategory: formData.category || 'General Feedback',
        problemSetNumber: 1,
        problemNumber: Date.now(), // Use timestamp as unique ID
        issueDescription: `**${formData.title}**\n\n${formData.description}\n\n**Severity:** ${formData.severity}\n**Category:** ${formData.category}\n**Page:** ${window.location.href}\n**User Agent:** ${navigator.userAgent}${formData.email ? `\n**Contact:** ${formData.email}` : ''}`,
        correctAnswer: '',
        solutionImages: screenshots
      };

      await sendFeedbackToDiscord(feedbackData);
      
      toast({
        title: "Feedback sent!",
        description: "Thank you for your feedback. We'll review it soon."
      });
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        severity: '' as SeverityLevel | '',
        category: '',
        email: ''
      });
      setScreenshots([]);
      onClose();
    } catch (error) {
      console.error('Failed to send feedback:', error);
      toast({
        title: "Failed to send feedback",
        description: "Please try again later or contact support directly",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScreenshotUpload = (files: File[]) => {
    setScreenshots(prev => [...prev, ...files]);
  };

  const removeScreenshot = (index: number) => {
    setScreenshots(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Send Feedback
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Title *
            </label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Brief summary of your feedback"
              required
            />
          </div>

          {/* Category and Severity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Category
              </label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Severity *
              </label>
              <Select value={formData.severity} onValueChange={(value) => setFormData(prev => ({ ...prev, severity: value as SeverityLevel }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(severityConfig).map(([key, config]) => {
                    const Icon = config.icon;
                    return (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${config.color}`} />
                          {config.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Description *
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Detailed description of your feedback, including steps to reproduce if it's a bug"
              rows={4}
              required
            />
          </div>

          {/* Screenshots */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Screenshots (optional)
            </label>
            <ImageUpload
              files={screenshots}
              onFilesChange={setScreenshots}
              maxFiles={3}
              maxFileSize={5}
            />
            {screenshots.length > 0 && (
              <div className="mt-3 space-y-2">
                {screenshots.map((file, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-2 bg-accent rounded-md"
                  >
                    <span className="text-sm text-foreground">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeScreenshot(index)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      Remove
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Email (optional) */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Email (optional)
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Your email if you'd like a response"
            />
          </div>

          {/* Context info */}
          <div className="p-3 bg-muted rounded-lg">
            <h4 className="text-sm font-medium text-foreground mb-2">Automatically included:</h4>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Current page: {window.location.pathname}</p>
              <p>• Browser: {navigator.userAgent.split(' ').pop()}</p>
              <p>• Timestamp: {new Date().toLocaleString()}</p>
            </div>
          </div>

          {/* Submit buttons */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>Sending...</>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Feedback
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};