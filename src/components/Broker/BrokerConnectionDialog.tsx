
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useBrokerConnection } from "./useBrokerConnection";
import BrokerConnectionForm from "./BrokerConnectionForm";
import type { BrokerConnectionDialogProps } from "./types";

const BrokerConnectionDialog = ({
  open,
  onOpenChange,
  connectionToEdit,
}: BrokerConnectionDialogProps) => {
  const { formData, setFormData, isSubmitting, handleSubmit } = useBrokerConnection(
    connectionToEdit,
    open,
    onOpenChange
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {connectionToEdit ? "Edit Broker Connection" : "Connect Broker"}
          </DialogTitle>
        </DialogHeader>
        <BrokerConnectionForm
          formData={formData}
          setFormData={setFormData}
          isSubmitting={isSubmitting}
          handleSubmit={handleSubmit}
          isEditing={!!connectionToEdit}
        />
      </DialogContent>
    </Dialog>
  );
};

export default BrokerConnectionDialog;

