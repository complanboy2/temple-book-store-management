
import React from "react";
import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteBookDialogProps {
  isOpen: boolean;
  onOpenChange?: (open: boolean) => void;
  onConfirm?: () => void;
  // Additional props used in BooksPage.tsx
  bookName?: string;
  onClose?: () => void;
  onDelete?: () => Promise<void> | void;
}

const DeleteBookDialog: React.FC<DeleteBookDialogProps> = ({
  isOpen,
  onOpenChange,
  onConfirm,
  bookName,
  onClose,
  onDelete
}) => {
  const { t } = useTranslation();

  // Support multiple callback patterns
  const handleOpenChange = (open: boolean) => {
    if (onOpenChange) onOpenChange(open);
    if (!open && onClose) onClose();
  };

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    if (onDelete) onDelete();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("common.confirmDelete")}</AlertDialogTitle>
          <AlertDialogDescription>
            {bookName 
              ? t("common.deleteSpecificBookConfirmation", { bookName }) 
              : t("common.deleteBookConfirmation")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} className="bg-red-500 hover:bg-red-600">
            {t("common.delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteBookDialog;
