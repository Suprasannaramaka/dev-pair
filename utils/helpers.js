export const updateTimestamp = () => {
  return new Date().toISOString();
};

export const generateFileName = (userId, originalName) => {
  const ext = originalName.split('.').pop();  // get file extension
  return `${userId}.${ext}`;
};





