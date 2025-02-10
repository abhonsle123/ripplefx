
import { useState, useEffect } from "react";
import type { BrokerConnection, BrokerFormData } from "../types";

export const useFormData = (
  connectionToEdit: BrokerConnection | null | undefined,
  open: boolean
) => {
  const [formData, setFormData] = useState<BrokerFormData>({
    broker_name: "",
    api_key: "",
    api_secret: "",
  });

  useEffect(() => {
    if (connectionToEdit) {
      setFormData({
        broker_name: connectionToEdit.broker_name,
        api_key: connectionToEdit.api_key,
        api_secret: connectionToEdit.api_secret,
      });
    } else {
      setFormData({
        broker_name: "",
        api_key: "",
        api_secret: "",
      });
    }
  }, [connectionToEdit, open]);

  return {
    formData,
    setFormData,
  };
};
