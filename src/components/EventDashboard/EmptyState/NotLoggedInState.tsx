
const NotLoggedInState = () => {
  return (
    <div className="text-center py-12 bg-card/30 backdrop-blur-sm rounded-xl p-8 border border-accent/10 shadow-lg">
      <p className="text-muted-foreground">
        Please sign in to view your dashboard content.
      </p>
    </div>
  );
};

export default NotLoggedInState;
