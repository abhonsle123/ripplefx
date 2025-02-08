
export const formatConfidence = (score: number) => {
  return `${Math.round(score * 100)}%`;
};

export const getConfidenceColor = (score: number) => {
  if (score >= 0.8) return 'text-green-600';
  if (score >= 0.6) return 'text-yellow-600';
  return 'text-red-600';
};
