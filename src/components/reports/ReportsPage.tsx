import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatNumber, formatDate } from "@/lib/utils";
import {
  Edit,
  Check,
  X,
  FileText,
  Calendar,
  Users,
  CreditCard,
  Download,
  Filter,
  Search,
  BarChart3,
  TrendingUp,
  PieChart,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import AttendanceChart from "../dashboard/AttendanceChart";
import { motion } from "framer-motion";

interface Report {
  id: string;
  title: string;
  content: string;
  date: string;
  type: "daily" | "weekly" | "monthly" | "custom";
  author: string;
}

const ReportsPage = () => {
  const [reportNote, setReportNote] = useState("");
  const [reportTitle, setReportTitle] = useState("");
  const [reportType, setReportType] = useState<
    "daily" | "weekly" | "monthly" | "custom"
  >("daily");
  const [savedReports, setSavedReports] = useState<Report[]>([
    {
      id: "1",
      title: "تقرير الحضور اليومي",
      content: "تم تسجيل حضور 25 عضو اليوم مع زيادة 15% عن الأمس",
      date: new Date().toISOString(),
      type: "daily",
      author: "المدير",
    },
    {
      id: "2",
      title: "تقرير المدفوعات الأسبوعي",
      content: "تم تحصيل 15,000 ريال هذا الأسبوع مع 3 مدفوعات معلقة",
      date: new Date(Date.now() - 86400000).toISOString(),
      type: "weekly",
      author: "المحاسب",
    },
  ]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null);

  const handleSaveReport = () => {
    if (!reportTitle.trim() || !reportNote.trim()) {
      toast({
        title: "تنبيه",
        description: "يرجى كتابة عنوان التقرير والمحتوى قبل الحفظ",
        variant: "destructive",
      });
      return;
    }

    const newReport: Report = {
      id: Date.now().toString(),
      title: reportTitle,
      content: reportNote,
      date: new Date().toISOString(),
      type: reportType,
      author: "المستخدم الحالي",
    };

    setSavedReports([newReport, ...savedReports]);
    setReportTitle("");
    setReportNote("");

    toast({
      title: "تم الحفظ",
      description: "تم حفظ التقرير بنجاح",
    });
  };

  const handleClearReport = () => {
    setReportTitle("");
    setReportNote("");
    toast({
      title: "تم المسح",
      description: "تم مسح المحتوى",
    });
  };

  const handleDeleteReport = (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا التقرير؟")) return;

    setSavedReports(savedReports.filter((report) => report.id !== id));
    toast({
      title: "تم الحذف",
      description: "تم حذف التقرير بنجاح",
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "daily":
        return "bg-gradient-to-r from-blue-500 to-blue-600";
      case "weekly":
        return "bg-gradient-to-r from-green-500 to-green-600";
      case "monthly":
        return "bg-gradient-to-r from-purple-500 to-purple-600";
      case "custom":
        return "bg-gradient-to-r from-orange-500 to-orange-600";
      default:
        return "bg-gray-500";
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case "daily":
        return "يومي";
      case "weekly":
        return "أسبوعي";
      case "monthly":
        return "شهري";
      case "custom":
        return "مخصص";
      default:
        return type;
    }
  };

  const filteredReports = savedReports.filter((report) => {
    const matchesSearch =
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = !filterType || report.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 bg-background text-white">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
        التقارير والإحصائيات
      </h1>

      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-bluegray-700/50 backdrop-blur-sm h-auto">
          <TabsTrigger
            value="create"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/20 data-[state=active]:to-purple-500/20 text-xs md:text-sm py-2 md:py-3"
          >
            <Edit className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">إنشاء تقرير</span>
            <span className="sm:hidden">إنشاء</span>
          </TabsTrigger>
          <TabsTrigger
            value="saved"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/20 data-[state=active]:to-purple-500/20 text-xs md:text-sm py-2 md:py-3"
          >
            <FileText className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">التقارير المحفوظة</span>
            <span className="sm:hidden">المحفوظة</span>
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/20 data-[state=active]:to-purple-500/20 text-xs md:text-sm py-2 md:py-3"
          >
            <BarChart3 className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">الإحصائيات</span>
            <span className="sm:hidden">إحصائيات</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <Card className="bg-bluegray-700/30 backdrop-blur-md border-bluegray-600 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
                <Edit className="h-5 w-5" />
                إنشاء تقرير جديد
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    عنوان التقرير
                  </label>
                  <Input
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    placeholder="أدخل عنوان التقرير..."
                    className="bg-bluegray-800/50 backdrop-blur-sm border-bluegray-600 focus:border-blue-500 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    نوع التقرير
                  </label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value as any)}
                    className="w-full p-2 bg-bluegray-800/50 backdrop-blur-sm border border-bluegray-600 rounded-md focus:border-blue-500 focus:outline-none text-white"
                  >
                    <option value="daily">يومي</option>
                    <option value="weekly">أسبوعي</option>
                    <option value="monthly">شهري</option>
                    <option value="custom">مخصص</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  محتوى التقرير
                </label>
                <textarea
                  value={reportNote}
                  onChange={(e) => setReportNote(e.target.value)}
                  placeholder="اكتب محتوى التقرير هنا... يمكنك تضمين الملاحظات، الإحصائيات، والتوصيات"
                  className="w-full h-40 p-3 bg-bluegray-800/50 backdrop-blur-sm border border-bluegray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleSaveReport}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                >
                  <Check className="mr-2 h-4 w-4" />
                  حفظ التقرير
                </Button>
                <Button
                  onClick={handleClearReport}
                  variant="outline"
                  className="border-bluegray-600 hover:bg-bluegray-600 text-white"
                >
                  <X className="mr-2 h-4 w-4" />
                  مسح المحتوى
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="saved" className="space-y-6">
          <Card className="bg-bluegray-700/30 backdrop-blur-md border-bluegray-600 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
                <FileText className="h-5 w-5" />
                التقارير المحفوظة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="البحث في التقارير..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 bg-bluegray-800/50 backdrop-blur-sm border-bluegray-600 focus:border-blue-500 text-white"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className={`border-bluegray-600 hover:bg-bluegray-600 text-white ${!filterType ? "bg-bluegray-600" : ""}`}
                    onClick={() => setFilterType(null)}
                  >
                    الكل
                  </Button>
                  <Button
                    variant="outline"
                    className={`border-bluegray-600 hover:bg-bluegray-600 text-white ${filterType === "daily" ? "bg-bluegray-600" : ""}`}
                    onClick={() => setFilterType("daily")}
                  >
                    يومي
                  </Button>
                  <Button
                    variant="outline"
                    className={`border-bluegray-600 hover:bg-bluegray-600 text-white ${filterType === "weekly" ? "bg-bluegray-600" : ""}`}
                    onClick={() => setFilterType("weekly")}
                  >
                    أسبوعي
                  </Button>
                  <Button
                    variant="outline"
                    className={`border-bluegray-600 hover:bg-bluegray-600 text-white ${filterType === "monthly" ? "bg-bluegray-600" : ""}`}
                    onClick={() => setFilterType("monthly")}
                  >
                    شهري
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {filteredReports.length === 0 ? (
                  <div className="text-center py-12 bg-bluegray-800/30 rounded-lg">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">
                      لا توجد تقارير مطابقة لمعايير البحث
                    </p>
                  </div>
                ) : (
                  filteredReports.map((report) => (
                    <motion.div
                      key={report.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="bg-bluegray-800/50 backdrop-blur-sm border-bluegray-600 hover:border-blue-500/50 transition-all">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-white mb-1">
                                {report.title}
                              </h3>
                              <div className="flex items-center gap-2 mb-2">
                                <Badge
                                  className={`${getTypeColor(report.type)} text-white`}
                                >
                                  {getTypeText(report.type)}
                                </Badge>
                                <span className="text-sm text-gray-400">
                                  {formatDate(report.date)}
                                </span>
                                <span className="text-sm text-gray-400">•</span>
                                <span className="text-sm text-gray-400">
                                  {report.author}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 border-bluegray-600 hover:bg-bluegray-600 text-blue-400"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 border-bluegray-600 hover:bg-bluegray-600 text-red-400"
                                onClick={() => handleDeleteReport(report.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-gray-300 text-sm leading-relaxed">
                            {report.content}
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-bluegray-700/30 backdrop-blur-md border-bluegray-600 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  إحصائيات الحضور
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AttendanceChart />
              </CardContent>
            </Card>

            <Card className="bg-bluegray-700/30 backdrop-blur-md border-bluegray-600 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  إحصائيات سريعة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-bluegray-800/50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-400">
                      {formatNumber(156)}
                    </div>
                    <div className="text-sm text-gray-400">إجمالي التقارير</div>
                  </div>
                  <div className="bg-bluegray-800/50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-400">
                      {formatNumber(23)}
                    </div>
                    <div className="text-sm text-gray-400">
                      تقارير هذا الشهر
                    </div>
                  </div>
                  <div className="bg-bluegray-800/50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-400">
                      {formatNumber(89)}%
                    </div>
                    <div className="text-sm text-gray-400">معدل الحضور</div>
                  </div>
                  <div className="bg-bluegray-800/50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-orange-400">
                      {formatNumber(12)}
                    </div>
                    <div className="text-sm text-gray-400">تقارير معلقة</div>
                  </div>
                </div>

                <div className="space-y-3 mt-6">
                  <h4 className="font-semibold text-white">أحدث الأنشطة</h4>
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 p-3 rounded-lg bg-bluegray-800/30"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">
                          تم إنشاء تقرير جديد
                        </p>
                        <p className="text-xs text-gray-400">
                          منذ {formatNumber(item)} ساعة
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsPage;
