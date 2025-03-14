
import React from 'react';

const ApiKeyInstructions = () => {
  return (
    <div className="mt-8 bg-card/40 backdrop-blur-sm rounded-xl p-6 border border-accent/10">
      <h2 className="text-xl font-semibold mb-4">How to Get Your Alpaca API Keys</h2>
      <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
        <li>Go to <a href="https://app.alpaca.markets/signup" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Alpaca</a> and create an account if you don't have one.</li>
        <li>After logging in, navigate to your Paper Trading dashboard.</li>
        <li>Click on your profile icon and select "API Keys".</li>
        <li>Generate a new key pair if you don't have one.</li>
        <li>Copy the Key ID and Secret Key into the form above.</li>
        <li>Make sure to keep your Secret Key secure - it gives access to your account.</li>
      </ol>
    </div>
  );
};

export default ApiKeyInstructions;
