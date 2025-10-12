export const formatDate = (dateString) => {
  if (!dateString) return 'No date';
  
  try {
    let date;
    if (typeof dateString === 'string') {
      if (dateString.includes('T') || dateString.includes(' ')) {
        date = new Date(dateString);
      } else {
        date = new Date(dateString + 'T00:00:00');
      }
    } else {
      date = new Date(dateString);
    }
    
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    return date.toLocaleDateString();
  } catch (error) {
    return 'Invalid date';
  }
};

export const formatDateTime = (dateString) => {
  if (!dateString) return 'No date';
  
  try {
    let date;
    if (typeof dateString === 'string') {
      if (dateString.includes('T') || dateString.includes(' ')) {
        date = new Date(dateString);
      } else {
        date = new Date(dateString + 'T00:00:00');
      }
    } else {
      date = new Date(dateString);
    }
    
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    return date.toLocaleString();
  } catch (error) {
    return 'Invalid date';
  }
};