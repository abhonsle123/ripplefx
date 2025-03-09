
const LoadingState = () => {
  return (
    <div className="bg-card/30 backdrop-blur-sm rounded-xl p-6 border border-accent/10 shadow-md">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-48 bg-muted/60 animate-pulse rounded-lg"
          />
        ))}
      </div>
    </div>
  );
};

export default LoadingState;
