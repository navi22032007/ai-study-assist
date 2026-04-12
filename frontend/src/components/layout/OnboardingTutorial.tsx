import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ChevronRight, ChevronLeft, Sparkles, Upload, 
  BookOpen, Brain, Zap, BarChart3, GraduationCap 
} from 'lucide-react';

interface Step {
  title: string;
  description: string;
  icon: any;
  color: string;
}

const steps: Step[] = [
  {
    title: "Welcome to StudyAI",
    description: "Your personalized AI study companion. Let's show you how to transform your documents into smart learning materials.",
    icon: GraduationCap,
    color: "text-sky-400 bg-sky-500/10"
  },
  {
    title: "Upload & Organize",
    description: "Start by uploading your PDFs or notes. We'll automatically organize them and prepare them for AI analysis.",
    icon: Upload,
    color: "text-violet-400 bg-violet-500/10"
  },
  {
    title: "Get AI Insights",
    description: "Instantly generate concise summaries and extract crucial key points from even the longest academic papers.",
    icon: Sparkles,
    color: "text-amber-400 bg-amber-500/10"
  },
  {
    title: "Master the Content",
    description: "Use auto-generated flashcards for active recall and our Mind Map tool to visualize complex relationships.",
    icon: Brain,
    color: "text-emerald-400 bg-emerald-500/10"
  },
  {
    title: "Visual AI Analysis",
    description: "Our AI Vision scans your PDFs for diagrams and charts, providing detailed explanations and interactive component quizzes.",
    icon: Zap,
    color: "text-rose-400 bg-rose-500/10"
  },
  {
    title: "Track Your Growth",
    description: "Test your knowledge with AI-quizzes and monitor your progress through our detailed analytics dashboard.",
    icon: BarChart3,
    color: "text-indigo-400 bg-indigo-500/10"
  }
];

export default function OnboardingTutorial() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('studyai_tutorial_seen');
    if (!hasSeenTutorial) {
      // Delay slightly for better UX
      const timer = setTimeout(() => setIsOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const closeTutorial = () => {
    setIsOpen(false);
    localStorage.setItem('studyai_tutorial_seen', 'true');
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      closeTutorial();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const StepIcon = steps[currentStep].icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeTutorial}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-card border border-border/50 rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Progress Bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-muted/30">
              <motion.div 
                className="h-full bg-gradient-to-r from-sky-500 to-violet-600"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>

            <button 
              onClick={closeTutorial}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted/50 text-muted-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-8 sm:p-10 pt-12">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center text-center"
                >
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-8 ${steps[currentStep].color}`}>
                    <StepIcon className="w-10 h-10" />
                  </div>
                  
                  <h2 className="text-2xl font-bold text-foreground mb-4">
                    {steps[currentStep].title}
                  </h2>
                  
                  <p className="text-muted-foreground leading-relaxed">
                    {steps[currentStep].description}
                  </p>
                </motion.div>
              </AnimatePresence>

              <div className="mt-12 flex items-center justify-between">
                <button
                  onClick={prevStep}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    currentStep === 0 
                      ? 'opacity-0 pointer-events-none' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>

                <div className="flex gap-1.5">
                  {steps.map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                        i === currentStep ? 'w-4 bg-sky-500' : 'bg-muted-foreground/30'
                      }`} 
                    />
                  ))}
                </div>

                <button
                  onClick={nextStep}
                  className="btn-primary flex items-center gap-2 px-6"
                >
                  {currentStep === steps.length - 1 ? 'Get Started' : 'Next'} 
                  {currentStep !== steps.length - 1 && <ChevronRight className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
