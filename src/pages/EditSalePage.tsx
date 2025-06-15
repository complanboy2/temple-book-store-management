
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MobileHeader from "@/components/MobileHeader";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import BookImage from "@/components/BookImage";

interface SaleData {
  id: string;
  bookid: string;
  quantity: number;
  totalamount: number;
  paymentmethod: string;
  buyername?: string | null;
  buyerphone?: string | null;
  personnelid: string;
  createdat: string;
  stallid: string;
  // Book
  books?: {
    name: string;
    author: string;
    imageurl?: string;
  };
}

const EditSalePage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currentUser, isAdmin } = useAuth();
  const [sale, setSale] = useState<SaleData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editValues, setEditValues] = useState({
    buyername: "",
    buyerphone: "",
    paymentmethod: "",
  });
  const [error, setError] = useState<string>("");

  // Fetch sale data
  useEffect(() => {
    const fetchSale = async () => {
      if (!id) return;
      setIsLoading(true);
      setError("");
      const { data, error } = await supabase
        .from("sales")
        .select(
          "*, books(name, author, imageurl)"
        )
        .eq("id", id)
        .single();

      if (error || !data) {
        setError("Could not find sale record.");
        setIsLoading(false);
        return;
      }

      setSale(data);
      setEditValues({
        buyername: data.buyername || "",
        buyerphone: data.buyerphone || "",
        paymentmethod: data.paymentmethod || "",
      });
      setIsLoading(false);
    };
    fetchSale();
  }, [id]);

  // Permission
  const canEdit =
    isAdmin ||
    (sale && currentUser && sale.personnelid === currentUser.email);

  // Form handlers
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValues((vals) => ({
      ...vals,
      [e.target.name]: e.target.value,
    }));
  };

  const onSave = async () => {
    if (!sale) return;
    setIsLoading(true);
    setError("");
    const { error: updateError } = await supabase
      .from("sales")
      .update({
        buyername: editValues.buyername,
        buyerphone: editValues.buyerphone,
        paymentmethod: editValues.paymentmethod,
      })
      .eq("id", sale.id);
    setIsLoading(false);
    if (updateError) {
      setError("Update failed!");
      return;
    }
    navigate("/sales/history");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-temple-background">
        <MobileHeader
          title={t("sales.editSale") || "Edit Sale"}
          showBackButton={true}
          backTo="/sales/history"
        />
        <main className="container mx-auto px-3 py-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("sales.editSale") || "Edit Sale"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-700">Loading...</div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-temple-background">
      <MobileHeader
        title={t("sales.editSale") || "Edit Sale"}
        showBackButton={true}
        backTo="/sales/history"
      />
      <main className="container mx-auto px-3 py-4">
        <Card>
          <CardHeader>
            <CardTitle>
              {t("sales.editSale") || "Edit Sale"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error && <div className="text-red-600 mb-3">{error}</div>}
            {!sale && (
              <div className="text-gray-800">Sale not found.</div>
            )}
            {sale && (
              <div className="space-y-6">
                {/* Book thumbnail + info */}
                <div className="flex items-center gap-4 mb-4">
                  <BookImage
                    imageUrl={sale.books?.imageurl}
                    alt={sale.books?.name}
                    size="small"
                    className="w-16 h-20 object-cover rounded"
                  />
                  <div>
                    <div className="font-semibold line-clamp-2">
                      {sale.books?.name || "Unknown Book"}
                    </div>
                    <div className="text-sm text-gray-600">
                      {t("common.by")} {sale.books?.author || "Unknown Author"}
                    </div>
                  </div>
                </div>

                {/* Transaction details, not editable */}
                <div>
                  <Label>Sale ID</Label>
                  <div className="mb-2">
                    <code>{sale.id}</code>
                  </div>
                  <Label>
                    Quantity
                  </Label>
                  <div className="mb-2">{sale.quantity}</div>
                  <Label>Total Amount</Label>
                  <div className="mb-2">₹{sale.totalamount}</div>
                  <Label>Created At</Label>
                  <div className="mb-2">{new Date(sale.createdat).toLocaleString()}</div>
                </div>

                {/* Editable fields */}
                {canEdit ? (
                  <form
                    onSubmit={e => {
                      e.preventDefault();
                      onSave();
                    }}
                    className="space-y-3"
                  >
                    <div>
                      <Label htmlFor="buyername">Buyer Name</Label>
                      <Input
                        type="text"
                        id="buyername"
                        name="buyername"
                        value={editValues.buyername}
                        onChange={onChange}
                        placeholder="Name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="buyerphone">Buyer Phone</Label>
                      <Input
                        type="text"
                        id="buyerphone"
                        name="buyerphone"
                        value={editValues.buyerphone}
                        onChange={onChange}
                        placeholder="Phone"
                      />
                    </div>
                    <div>
                      <Label htmlFor="paymentmethod">Payment Method</Label>
                      <Input
                        type="text"
                        id="paymentmethod"
                        name="paymentmethod"
                        value={editValues.paymentmethod}
                        onChange={onChange}
                        placeholder="Payment Method"
                      />
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button type="submit">
                        Save Changes
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => navigate("/sales/history")}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="text-red-600">
                    You do not have permission to edit this sale record.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default EditSalePage;

