
import { useFormData } from "./hooks/useFormData";
import { useSubmitBroker } from "./hooks/useSubmitBroker";
import type { BrokerConnection } from "./types";

export const useBrokerConnection = (
  connectionToEdit: BrokerConnection | null | undefined,
  open: boolean,
  onOpenChange: (open: boolean) => void
) => {
  const { formData, setFormData } = useFormData(connectionToEdit, open);
  const { isSubmitting, handleSubmit } = useSubmitBroker(
    connectionToEdit,
    onOpenChange,
    setFormData
  );

  return {
    formData,
    setFormData,
    isSubmitting,
    handleSubmit: (e: React.FormEvent) => handleSubmit(e, formData),
  };
};
