import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  ArrowLeft, 
  Home, 
  Search, 
  Star, 
  Menu, 
  Flame, 
  FileText, 
  Folder, 
  Share,
  ExternalLink,
  RefreshCw,
  Tag,
  BarChart3,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SEOHead } from '@/components/SEOHead';

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  tips?: string[];
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to notesnicharles hahahaha',
    description: 'Your comprehensive academic resource browser',
    icon: <Home className="w-6 h-6" />,
    content: (
      <div className="space-y-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">
            Browse thousands of academic files
          </h3>
          <p className="text-muted-foreground">
            Access organized study materials, lecture notes, and educational resources 
            all in one place. Navigate through folders, search for specific content.
          </p>
        </div>
      </div>
    ),
    tips: [
      'Files are organized by year, semester, and subject',
      'All content is synced with Google Drive',
      'New files are added regularly - check the changelog!'
    ]
  },
  {
    id: 'navigation',
    title: 'Navigation & Search',
    description: 'Find what you need quickly',
    icon: <Search className="w-6 h-6" />,
    content: (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Search className="w-4 h-4 text-primary" />
                Smart Search
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Use the search bar to find files and folders instantly. 
              Press <kbd className="bg-muted px-1 rounded">/</kbd> to focus search from anywhere.
            </CardContent>
          </Card>
          
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Menu className="w-4 h-4 text-primary" />
                Sidebar Menu
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Access dashboard stats and quick actions. 
              Click the menu button or use the hamburger icon.
            </CardContent>
          </Card>
        </div>
        
        <div className="bg-accent/30 rounded-lg p-4">
          <h4 className="font-medium text-foreground mb-2">Navigation Tips:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Click folders to navigate deeper</li>
            <li>• Use breadcrumbs to go back to parent folders</li>
            <li>• URLs are shareable - copy and send to friends</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    id: 'search',
    title: 'Search & Filters',
    description: 'Find content quickly',
    icon: <Search className="w-6 h-6" />,
    content: (
      <div className="space-y-6">
        <div className="p-4 rounded-lg border border-border/40 bg-card/30">
          <h3 className="font-semibold text-foreground mb-2">Find what you need</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Use the search functionality to quickly find files and folders. 
            The search works across file names and paths.
          </p>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-primary" />
              <span className="text-sm">Type to search instantly</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-sm">Search across all file types</span>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'sharing',
    title: 'Sharing & Collaboration',
    description: 'Share files and folders with others',
    icon: <Share className="w-6 h-6" />,
    content: (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Share className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h3 className="font-semibold text-foreground mb-1">Enhanced sharing</h3>
              <p className="text-sm text-muted-foreground">
                Share any file or folder with a single click. The share function automatically 
                creates properly formatted links that others can use to navigate directly to your content.
              </p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Share options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Share className="w-3 h-3" />
                Native sharing (mobile/desktop)
              </div>
              <div className="flex items-center gap-2">
                <ExternalLink className="w-3 h-3" />
                Direct Google Drive access
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-3 h-3" />
                Formatted link with context
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Link format</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <div className="bg-muted rounded p-2 font-mono text-xs break-all">
                example.com?target=xyz&path=first-year/calculus
              </div>
              <p className="mt-2 text-xs">
                Links include the full path and target file, making navigation seamless for recipients.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  },
  {
    id: 'features',
    title: 'Advanced Features',
    description: 'Discover powerful tools and shortcuts',
    icon: <Flame className="w-6 h-6" />,
    content: (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                Streak Tracking
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Track daily visit streaks and maintain study consistency.
            </CardContent>
          </Card>
          
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Tag className="w-4 h-4 text-primary" />
                Version Control
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              See what's new with version badges and changelog tracking.
            </CardContent>
          </Card>
          
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              View file counts, sizes, and last scan information.
            </CardContent>
          </Card>
        </div>
        
        <div className="bg-accent/30 rounded-lg p-4">
          <h4 className="font-medium text-foreground mb-3">Keyboard Shortcuts:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Focus search</span>
              <kbd className="bg-muted px-2 py-1 rounded text-xs">/</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">What's New modal</span>
              <kbd className="bg-muted px-2 py-1 rounded text-xs">Ctrl+W</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Close modals</span>
              <kbd className="bg-muted px-2 py-1 rounded text-xs">Esc</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Help & Tour</span>
              <kbd className="bg-muted px-2 py-1 rounded text-xs">F1</kbd>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'complete',
    title: 'You\'re all set!',
    description: 'Start exploring your academic resources',
    icon: <CheckCircle className="w-6 h-6" />,
    content: (
      <div className="text-center space-y-6">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>
        
        <div>
          <h3 className="text-xl font-bold text-foreground mb-2">
            Ready to explore!
          </h3>
          <p className="text-muted-foreground mb-6">
            You now know how to navigate, search, and share academic resources. 
            Start browsing and make the most of your study materials.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-border bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-4 text-center">
              <FileText className="w-8 h-8 text-primary mx-auto mb-2" />
              <h4 className="font-semibold text-foreground mb-1">Browse Files</h4>
              <p className="text-sm text-muted-foreground">
                Start exploring academic materials
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-border bg-gradient-to-br from-blue/5 to-blue/10">
            <CardContent className="p-4 text-center">
              <Tag className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h4 className="font-semibold text-foreground mb-1">Check Updates</h4>
              <p className="text-sm text-muted-foreground">
                See what's new in the changelog
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="pt-4">
          <Button asChild size="lg" className="w-full md:w-auto">
            <Link to="/">
              <Home className="w-4 h-4 mr-2" />
              Start Browsing
            </Link>
          </Button>
        </div>
      </div>
    )
  }
];

export const Tour: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
  };

  const currentTourStep = tourSteps[currentStep];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        currentFolder={null}
        currentPath="/tour"
        pageType="drive"
        customTitle="Site Tour & Guide"
        customDescription="Learn how to navigate notesnicharles hahahaha, discover features like sharing, search functionality, and advanced tools for academic resource browsing."
      />
      
      {/* Header */}
      <header className="border-b border-border/30 bg-background/95 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link to="/" className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Back to Drive</span>
              </Link>
            </div>
            <Badge variant="outline" className="text-xs">
              {currentStep + 1} of {tourSteps.length}
            </Badge>
          </div>
          
          <div className="mt-4">
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* Step Header */}
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <div className="text-primary">
                  {currentTourStep.icon}
                </div>
              </div>
              
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {currentTourStep.title}
                </h1>
                <p className="text-lg text-muted-foreground">
                  {currentTourStep.description}
                </p>
              </div>
            </div>

            {/* Step Content */}
            <Card className="border-border">
              <CardContent className="p-8">
                {currentTourStep.content}
                
                {currentTourStep.tips && (
                  <div className="mt-8 pt-6 border-t border-border">
                    <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                      Pro Tips
                    </h4>
                    <ul className="space-y-2">
                      {currentTourStep.tips.map((tip, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                          <div className="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></div>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </Button>

              {/* Step indicators */}
              <div className="flex items-center space-x-2">
                {tourSteps.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToStep(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentStep
                        ? 'bg-primary'
                        : index < currentStep
                        ? 'bg-primary/50'
                        : 'bg-muted-foreground/30'
                    }`}
                    aria-label={`Go to step ${index + 1}`}
                  />
                ))}
              </div>

              {currentStep < tourSteps.length - 1 ? (
                <Button onClick={nextStep} className="flex items-center space-x-2">
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button asChild className="flex items-center space-x-2">
                  <Link to="/">
                    <Home className="w-4 h-4" />
                    <span>Start Browsing</span>
                  </Link>
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 mt-16">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justfiy-between text-sm text-muted-foreground">
            <div className="flex items-center space-x-4">
              <Link to="/feedback" className="hover:text-foreground transition-colors">
                Feedback
              </Link>
              <Link to="/changelog" className="hover:text-foreground transition-colors">
                Changelog
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};