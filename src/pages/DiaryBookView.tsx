import { useEffect, useState } from "react";
import axios from "axios";
import { format } from "date-fns";
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

type DiaryEntry = {
  _id: string;
  id: string;
  date: string;
  content: string;
  goodThings: string[];
  badThings: string[];
};

// Animation variants for framer-motion
const pageVariants = {
  initial: { opacity: 0, x: 100 },
  in: { opacity: 1, x: 0 },
  out: { opacity: 0, x: -100 }
};

const pageTransition = {
  type: 'tween',
  ease: 'easeInOut',
  duration: 0.3
};

export function DiaryBookView() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const navigate = useNavigate();
  const API_BASE_URL = 'http://localhost:5000/api/diary/entries';
  
  const totalPages = entries.length;
  const currentEntry = entries[currentPage];

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        console.log('Fetching diary entries...');
        const token = localStorage.getItem('token');
        console.log('Token:', token ? 'Found' : 'Not found');
        
        const response = await axios.get(API_BASE_URL, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Response:', response);
        
        if (response.data && response.data.success && Array.isArray(response.data.data)) {
          console.log('Entries received:', response.data.data.length);
          setEntries(response.data.data);
        } else {
          console.error('Unexpected response format:', response.data);
          // Try to handle the data even if the format isn't exactly as expected
          if (Array.isArray(response.data)) {
            setEntries(response.data);
          } else if (response.data && Array.isArray(response.data.data)) {
            setEntries(response.data.data);
          }
        }
      } catch (error) {
        console.error('Error fetching diary entries:', error);
        if (axios.isAxiosError(error)) {
          console.error('Error details:', {
            status: error.response?.status,
            data: error.response?.data,
            headers: error.response?.headers
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchEntries();
  }, []);

  const handleBack = () => {
    navigate('/diary');
  };
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-amber-50 to-amber-100">
        <div className="animate-pulse flex flex-col items-center">
          <BookOpen className="h-16 w-16 text-amber-400 mb-4" />
          <div className="h-4 w-48 bg-amber-200 rounded-full mb-2"></div>
          <div className="h-4 w-32 bg-amber-200 rounded-full"></div>
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-amber-50 to-amber-100">
        <div className="text-center max-w-md p-8 bg-white/90 rounded-xl shadow-lg border border-amber-200 backdrop-blur-sm">
          <BookOpen className="h-16 w-16 mx-auto text-amber-400 mb-4" />
          <h2 className="text-2xl font-serif text-amber-800 mb-2">No Entries Yet</h2>
          <p className="text-amber-700 mb-6">Your diary is waiting for your first entry. Start writing your story!</p>
          <Button 
            onClick={handleBack} 
            className="bg-amber-500 hover:bg-amber-600 text-white transition-all duration-300 transform hover:scale-105"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Diary
          </Button>
        </div>
      </div>
    );
  }

  const handleNext = () => {
    setCurrentPage((prev) => (prev < totalPages - 1 ? prev + 1 : prev));
  };

  const handlePrev = () => {
    setCurrentPage((prev) => (prev > 0 ? prev - 1 : prev));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100 p-2 sm:p-3">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center mb-3">
          <Button 
            variant="ghost" 
            size="sm"
            className="group transition-all duration-300 hover:bg-amber-100/50 p-1.5"
            onClick={handleBack}
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" /> 
          </Button>
          <span className="text-sm text-amber-800 ml-1">Back to Diary</span>
        </div>
        
        <div className="relative">
          {/* Navigation Arrows - Desktop */}
          {currentPage > 0 && (
            <button 
              onClick={handlePrev}
              className="hidden sm:flex absolute -left-4 lg:-left-6 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-amber-700 p-2.5 sm:p-3 rounded-full shadow-lg z-10 transition-all duration-300 hover:scale-110"
              aria-label="Previous entry"
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          )}
          
          {currentPage < totalPages - 1 && (
            <button 
              onClick={handleNext}
              className="hidden sm:flex absolute -right-4 lg:-right-6 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-amber-700 p-2.5 sm:p-3 rounded-full shadow-lg z-10 transition-all duration-300 hover:scale-110"
              aria-label="Next entry"
            >
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          )}
          
          {/* Mobile Navigation Buttons */}
          <div className="sm:hidden flex justify-between mb-4 gap-3">
            <button 
              onClick={handlePrev}
              disabled={currentPage === 0}
              className={`flex-1 flex items-center justify-center py-2 px-4 rounded-lg ${
                currentPage === 0 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-white/90 text-amber-700 shadow-md hover:bg-white'
              }`}
              aria-label="Previous entry"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              <span className="text-sm">Previous</span>
            </button>
            <button 
              onClick={handleNext}
              disabled={currentPage === totalPages - 1}
              className={`flex-1 flex items-center justify-center py-2 px-4 rounded-lg ${
                currentPage === totalPages - 1 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-white/90 text-amber-700 shadow-md hover:bg-white'
              }`}
              aria-label="Next entry"
            >
              <span className="text-sm">Next</span>
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
          
          {/* Book Page */}
          <motion.div
            key={currentPage}
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl sm:shadow-2xl overflow-hidden border border-amber-200/50"
          >
            {/* Page Header */}
            <div className="bg-gradient-to-r from-amber-100 to-amber-50 p-3 border-b border-amber-200">
              <div className="flex justify-between items-center gap-2">
                <div>
                  <h2 className="text-base font-medium text-amber-800 leading-tight">
                    {format(new Date(currentEntry.date), 'EEE, MMM d, yyyy')}
                  </h2>
                  <p className="text-amber-600 text-xs">
                    Entry {currentPage + 1} of {totalPages}
                  </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-amber-200/50 flex items-center justify-center text-amber-700">
                  <BookOpen className="h-4 w-4" />
                </div>
              </div>
            </div>
            
            {/* Diary Content */}
            <div className="p-4">
              <div className="text-gray-700 leading-relaxed">
                <div className="space-y-3">
                  {currentEntry.content.split('\n\n').map((paragraph, i) => (
                    <motion.p 
                      key={`entry-${currentEntry.id}-para-${i}`}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * i }}
                      className="text-sm text-gray-800 leading-relaxed"
                    >
                      {paragraph || <br />}
                    </motion.p>
                  ))}
                </div>
                
                {/* Highlights Section */}
                {(currentEntry.goodThings.length > 0 || currentEntry.badThings.length > 0) && (
                  <motion.div 
                    className="mt-6 sm:mt-8 md:mt-10 space-y-4 sm:space-y-6 md:space-y-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {currentEntry.goodThings.length > 0 && (
                      <motion.div 
                        className="bg-green-50/70 p-3 rounded border border-green-100 text-sm"
                      >
                        <h3 className="font-medium text-green-700 mb-2 flex items-center">
                          <span className="bg-green-100 p-1 rounded-full mr-2">✨</span>
                          Today's Highlights
                        </h3>
                        <ul className="space-y-1.5 sm:space-y-2 ml-1 sm:ml-2">
                          {currentEntry.goodThings.map((item, i) => (
                            <motion.li 
                              key={`good-${currentEntry.id}-${i}`} 
                              className="text-green-800 flex items-start text-sm sm:text-base"
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.2 + (i * 0.05) }}
                            >
                              <span className="text-green-400 mr-1.5 sm:mr-2 mt-1.5">•</span>
                              {item}
                            </motion.li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                    
                    {currentEntry.badThings.length > 0 && (
                      <motion.div 
                        className="bg-blue-50/70 p-3 rounded border border-blue-100 text-sm mt-3"
                      >
                        <h3 className="font-medium text-blue-700 mb-2 flex items-center">
                          <span className="bg-blue-100 p-1 rounded-full mr-2">💭</span>
                          Areas for Growth
                        </h3>
                        <ul className="space-y-1.5 sm:space-y-2 ml-1 sm:ml-2">
                          {currentEntry.badThings.map((item, i) => (
                            <motion.li 
                              key={`bad-${currentEntry.id}-${i}`} 
                              className="text-blue-800 flex items-start text-sm sm:text-base"
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.3 + (i * 0.05) }}
                            >
                              <span className="text-blue-400 mr-1.5 sm:mr-2 mt-1.5">•</span>
                              {item}
                            </motion.li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </motion.div>
                )}
                
                {/* Page Footer */}
                <div className="mt-4 pt-3 border-t border-amber-100 text-xs text-amber-500">
                  Page {currentPage + 1} of {totalPages}
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Page Indicator */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-4 sm:mt-5 md:mt-6 space-x-1.5 sm:space-x-2">
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                let pageNum = i;
                if (totalPages > 5) {
                  if (currentPage < 2) pageNum = i;
                  else if (currentPage > totalPages - 3) pageNum = totalPages - 5 + i;
                  else pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`h-1.5 sm:h-2 w-1.5 sm:w-2 rounded-full transition-all duration-300 ${
                      currentPage === pageNum 
                        ? 'bg-amber-600 w-4 sm:w-6' 
                        : 'bg-amber-200 hover:bg-amber-300'
                    }`}
                    aria-label={`Go to page ${pageNum + 1}`}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
