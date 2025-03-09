
const NoResultsState = () => {
  return (
    <div className="text-center py-8">
      <p className="text-muted-foreground">No events match your current filters.</p>
      <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters to see more results.</p>
    </div>
  );
};

export default NoResultsState;
