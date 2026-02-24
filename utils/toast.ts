
export const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  console.log(`[Toast] [${type.toUpperCase()}] ${message}`);
  // In a real app, use a proper toast library. Stubbing with alert for now.
  // alert(message); 
};
