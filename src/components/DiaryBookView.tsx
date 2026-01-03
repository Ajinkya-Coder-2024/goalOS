import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface DiaryEntry {
  id: string;
  date: Date;
  content: string;
  goodThings: string[];
  badThings: string[];
}

interface DiaryBookViewProps {
  entries: DiaryEntry[];
  onBack: () => void;
}

export function DiaryBookView({ entries, onBack }: DiaryBookViewProps) {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-amber-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Button 
          variant="ghost" 
          className="mb-6" 
          onClick={onBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Diary
        </Button>
        
        <div className="space-y-8">
          {entries.map((entry, index) => (
            <div 
              key={entry.id} 
              className="bg-white p-8 rounded-lg shadow-lg border-l-8 border-amber-200 transform hover:scale-[1.01] transition-transform duration-200"
            >
              <div className="border-b border-amber-100 pb-4 mb-6">
                <h2 className="text-2xl font-serif text-amber-800">
                  {format(entry.date, 'EEEE, MMMM d, yyyy')}
                </h2>
              </div>
              
              <div className="prose max-w-none text-gray-700 leading-relaxed">
                <div className="space-y-4">
                  {entry.content.split('\n\n').map((paragraph, i) => (
                    <p key={`entry-${entry.id}-para-${i}`} className="text-lg">
                      {paragraph || <br />}
                    </p>
                  ))}
                </div>
                
                {(entry.goodThings.length > 0 || entry.badThings.length > 0) && (
                  <div className="mt-8 space-y-6">
                    {entry.goodThings.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium text-green-700 mb-2">
                          🌟 Positive Highlights
                        </h3>
                        <ul className="space-y-2 ml-4">
                          {entry.goodThings.map((item, i) => (
                            <li key={`good-${entry.id}-${i}`} className="text-green-800">
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {entry.badThings.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium text-blue-700 mb-2">
                          💭 Areas for Improvement
                        </h3>
                        <ul className="space-y-2 ml-4">
                          {entry.badThings.map((item, i) => (
                            <li key={`bad-${entry.id}-${i}`} className="text-blue-800">
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="mt-8 pt-4 border-t border-amber-100 text-right">
                  <span className="text-sm text-amber-600">
                    Written on {format(entry.date, 'MMMM d, yyyy')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
