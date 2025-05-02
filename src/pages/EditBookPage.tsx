
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useStallContext } from "@/contexts/StallContext";
import { useTranslation } from "react-i18next";
import { Book } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import MobileHeader from "@/components/MobileHeader";

const EditBookPage = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { currentStore } = useStallContext();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchBookDetails = async () => {
      if (!currentStore || !bookId) {
        navigate("/books");
        return;
      }

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("books")
          .select("*")
          .eq("id", bookId)
          .eq("stallid", currentStore)
          .single();

        if (error) {
          throw error;
        }

        if (!data) {
          toast({
            title: t("common.error"),
            description: t("common.bookNotFound"),
            variant: "destructive",
          });
          navigate("/books");
          return;
        }

        // Transform API result to local Book type
        const bookData: Book = {
          id: data.id,
          barcode: data.barcode ?? undefined,
          name: data.name,
          author: data.author,
          category: data.category ?? "",
          printingInstitute: data.printinginstitute ?? "",
          originalPrice: data.originalprice,
          salePrice: data.saleprice,
          quantity: data.quantity,
          stallId: data.stallid,
          imageUrl: data.imageurl,
          createdAt: data.createdat ? new Date(data.createdat) : new Date(),
          updatedAt: data.updatedat ? new Date(data.updatedat) : new Date()
        };

        setBook(bookData);
      } catch (error) {
        console.error("Error fetching book details:", error);
        toast({
          title: t("common.error"),
          description: t("common.failedToLoadBookDetails"),
          variant: "destructive",
        });
        navigate("/books");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookDetails();
  }, [bookId, currentStore, navigate, toast, t]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-temple-background flex items-center justify-center">
        <p className="text-lg text-muted-foreground">{t("common.loading")}...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-temple-background pb-20">
      <MobileHeader
        title={t("common.editBook")}
        showBackButton={true}
        backTo="/books"
      />
      
      <main className="container mx-auto px-4 py-6">
        {book ? (
          <>
            <h1 className="text-2xl font-bold text-temple-maroon mb-6">{t("common.editBook")}</h1>
            
            {/* This is where your book edit form would go */}
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(book, null, 2)}
            </pre>
            
            <div className="mt-6">
              <button
                onClick={() => navigate("/books")}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded mr-2"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={() => navigate("/books")}
                className="bg-temple-saffron hover:bg-temple-saffron/90 text-white px-4 py-2 rounded"
              >
                {t("common.save")}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">{t("common.bookNotFound")}</p>
            <button
              onClick={() => navigate("/books")}
              className="mt-4 text-temple-saffron hover:underline"
            >
              {t("common.backToBooks")}
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default EditBookPage;
