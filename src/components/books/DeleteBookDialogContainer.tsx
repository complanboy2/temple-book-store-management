
import React from "react";
import { Book } from "@/types";
import DeleteBookDialog from "@/components/DeleteBookDialog";

interface DeleteBookDialogContainerProps {
  isOpen: boolean;
  selectedBook: Book | null;
  onClose: () => void;
  onDelete: () => Promise<void>;
}

const DeleteBookDialogContainer: React.FC<DeleteBookDialogContainerProps> = ({
  isOpen,
  selectedBook,
  onClose,
  onDelete
}) => {
  return (
    <DeleteBookDialog
      isOpen={isOpen}
      bookTitle={selectedBook?.name || ""}
      onClose={onClose}
      onDelete={onDelete}
    />
  );
};

export default DeleteBookDialogContainer;
