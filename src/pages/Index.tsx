import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookPlus,
  Library,
  Receipt,
  Search,
  CalendarCheck,
  BarChart3,
  Settings,
  Users,
  ShieldCheck,
  FileText
} from "lucide-react";
import MobileNavBar from "@/components/MobileNavBar";

const Index = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-temple-background pb-20">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-temple-maroon">
            {t("common.templeBookStall")}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t("common.manageYourBookInventory")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Book Management */}
          <Card>
            <CardHeader>
              <CardTitle className="text-temple-maroon">
                {t("common.bookManagement")}
              </CardTitle>
              <CardDescription>
                {t("common.manageAndSellBooks")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link to="/books">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Library className="mr-2 h-5 w-5" />
                  {t("common.viewInventory")}
                </Button>
              </Link>
              <Link to="/add-book">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                >
                  <BookPlus className="mr-2 h-5 w-5" />
                  {t("common.addNewBook")}
                </Button>
              </Link>
              <Link to="/search">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Search className="mr-2 h-5 w-5" />
                  {t("common.searchBooks")}
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Sales */}
          <Card>
            <CardHeader>
              <CardTitle className="text-temple-maroon">
                {t("common.sales")}
              </CardTitle>
              <CardDescription>{t("common.salesDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link to="/sales">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Receipt className="mr-2 h-5 w-5" />
                  {t("common.salesHistory")}
                </Button>
              </Link>
              
              <Link to="/order-management">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                >
                  <CalendarCheck className="mr-2 h-5 w-5" />
                  Order Management
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-temple-maroon">
                {t("common.analytics")}
              </CardTitle>
              <CardDescription>
                {t("common.trackYourStallPerformance")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link to="/dashboard">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                >
                  <BarChart3 className="mr-2 h-5 w-5" />
                  {t("common.viewDashboard")}
                </Button>
              </Link>
              <Link to="/reports">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                >
                  <FileText className="mr-2 h-5 w-5" />
                  {t("common.generateReports")}
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Administration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-temple-maroon">
                {t("common.administration")}
              </CardTitle>
              <CardDescription>
                {t("common.manageStallSettings")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link to="/settings">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Settings className="mr-2 h-5 w-5" />
                  {t("common.stallSettings")}
                </Button>
              </Link>
              <Link to="/admin">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Users className="mr-2 h-5 w-5" />
                  {t("common.manageUsers")}
                </Button>
              </Link>
              <Link to="/metadata">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                >
                  <ShieldCheck className="mr-2 h-5 w-5" />
                  {t("common.metadataManagement")}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      <MobileNavBar />
    </div>
  );
};

export default Index;
