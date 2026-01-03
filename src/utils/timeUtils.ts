/**
 * Converts 24-hour format time string to 12-hour format with AM/PM
 * @param timeString Time in 24-hour format (HH:mm)
 * @returns Formatted time in 12-hour format (h:mm AM/PM)
 */
export const formatTime12Hour = (timeString: string): string => {
  if (!timeString) return '';
  
  try {
    const [hours, minutes] = timeString.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
    
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  } catch (error) {
    console.error('Error formatting time:', error);
    return timeString; // Return original if there's an error
  }
};

/**
 * Formats a date string to a more readable format
 * @param dateString Date string in ISO format (YYYY-MM-DD)
 * @returns Formatted date string (e.g., "October 5, 2025")
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};
