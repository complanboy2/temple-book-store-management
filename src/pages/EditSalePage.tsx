
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MobileHeader from "@/components/MobileHeader";
import { useTranslation } from "react-i18next";

const EditSalePage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

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
            <div className="text-green-800 font-semibold mb-4">
              You have reached the Edit Sale Page!
            </div>
            <div className="text-sm text-gray-700 mb-4">
              <b>Sale ID:</b> <code>{id}</code>
            </div>
            <p className="text-gray-600 mb-4">
              {t("sales.editPageComingSoon") || "Edit functionality coming soon. If you see this page, routing works."}
            </p>
            <Button onClick={() => navigate("/sales/history")}>{t("common.back") || "Back to History"}</Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default EditSalePage;

