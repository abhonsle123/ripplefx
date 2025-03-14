
import { useNavigate } from "react-router-dom";
import { useAuthentication } from "@/hooks/useAuthentication";
import { useBrokerConnections } from "@/hooks/useBrokerConnections";
import BrokerConnectionForm from "@/components/broker/BrokerConnectionForm";
import BrokerConnectionsList from "@/components/broker/BrokerConnectionsList";
import ApiKeyInstructions from "@/components/broker/ApiKeyInstructions";

const ConnectBroker = () => {
  const navigate = useNavigate();
  const { userId } = useAuthentication();
  const { 
    brokerConnections, 
    isLoading, 
    isSaving, 
    addBrokerConnection, 
    deleteBrokerConnection, 
    setActiveBroker 
  } = useBrokerConnections(userId);

  const handleSubmit = async (formData: {
    broker_name: string;
    api_key: string;
    api_secret: string;
  }) => {
    if (!userId) {
      navigate('/auth');
      return false;
    }
    return await addBrokerConnection(formData);
  };

  return (
    <div className="container px-4 pt-24 pb-20">
      <h1 className="text-3xl font-bold mb-8">Connect Broker</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Form to add new broker */}
        <BrokerConnectionForm 
          onSubmit={handleSubmit} 
          isSaving={isSaving} 
        />

        {/* List of existing connections */}
        <BrokerConnectionsList 
          connections={brokerConnections} 
          isLoading={isLoading}
          onDelete={deleteBrokerConnection}
          onSetActive={setActiveBroker}
        />
      </div>

      <ApiKeyInstructions />
    </div>
  );
};

export default ConnectBroker;
