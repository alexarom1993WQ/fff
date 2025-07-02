import React, { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import PaymentForm from "./PaymentForm";
import PaymentsList from "./PaymentsList";
import {
  Payment,
  getPaymentStatistics,
  getAllPayments,
  getNonSubscribedCustomersStats,
} from "@/services/paymentService";
import { getAllMembers } from "@/services/memberService";
import { formatNumber } from "@/lib/utils";
import {
  TrendingUp,
  DollarSign,
  Download,
  Upload,
  Database,
} from "lucide-react";

const PaymentsPage = () => {
  const [refreshPaymentsList, setRefreshPaymentsList] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [statistics, setStatistics] = useState<{
    totalRevenue: number;
    monthRevenue: number;
    weekRevenue: number;
    todayRevenue: number;
    nonSubscribedRevenue: number;
  }>({
    totalRevenue: 0,
    monthRevenue: 0,
    weekRevenue: 0,
    todayRevenue: 0,
    nonSubscribedRevenue: 0,
  });
  const paymentsListRef = useRef<{ fetchPayments?: () => Promise<void> }>({});
  const { toast } = useToast();

  const handlePaymentSuccess = async () => {
    setRefreshPaymentsList((prev) => prev + 1);
    setEditingPayment(null);
    // If we have a direct reference to the fetchPayments function, call it
    if (paymentsListRef.current?.fetchPayments) {
      await paymentsListRef.current.fetchPayments();
    }
    // Refresh statistics
    await fetchStatistics();
    // Show success toast
    toast({
      title: "تم بنجاح",
      description: "تم تحديث المدفوعات بنجاح",
      variant: "default",
    });
  };

  const handleEditPayment = (payment: Payment) => {
    setEditingPayment(payment);
  };

  const handleCancelEdit = () => {
    setEditingPayment(null);
  };

  // Function to fetch payment statistics
  const fetchStatistics = async () => {
    try {
      const stats = await getPaymentStatistics();

      // Ensure all values are valid numbers
      const safeRound = (value: any) => {
        const num = Number(value);
        return isNaN(num) || !isFinite(num) ? 0 : Math.round(num);
      };

      setStatistics({
        totalRevenue: safeRound(stats.totalRevenue),
        monthRevenue: safeRound(stats.monthRevenue),
        weekRevenue: safeRound(stats.weekRevenue),
        todayRevenue: safeRound(stats.todayRevenue),
        nonSubscribedRevenue: safeRound(
          stats.nonSubscribedStats?.totalRevenue || 0,
        ),
      });
    } catch (error) {
      console.error("Error fetching payment statistics:", error);
      // Set default values in case of error
      setStatistics({
        totalRevenue: 0,
        monthRevenue: 0,
        weekRevenue: 0,
        todayRevenue: 0,
        nonSubscribedRevenue: 0,
      });
    }
  };

  // Function to expose the fetchPayments method from PaymentsList
  const registerPaymentsList = (methods: {
    fetchPayments: () => Promise<void>;
  }) => {
    paymentsListRef.current = methods;
  };

  // Force refresh payments list
  const forceRefreshPayments = async () => {
    if (paymentsListRef.current?.fetchPayments) {
      await paymentsListRef.current.fetchPayments();
    }
    await fetchStatistics();
  };

  // Play sound effect
  const playSound = (type: "success" | "error") => {
    try {
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      if (type === "success") {
        // Success sound: ascending notes
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
        oscillator.frequency.setValueAtTime(
          659.25,
          audioContext.currentTime + 0.1,
        ); // E5
        oscillator.frequency.setValueAtTime(
          783.99,
          audioContext.currentTime + 0.2,
        ); // G5
      } else {
        // Error sound: descending notes
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
        oscillator.frequency.setValueAtTime(
          415.3,
          audioContext.currentTime + 0.1,
        ); // G#4
        oscillator.frequency.setValueAtTime(
          349.23,
          audioContext.currentTime + 0.2,
        ); // F4
      }

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.3,
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log("Sound not supported");
    }
  };

  // Export data function with improved error handling and validation
  const handleExportData = async () => {
    setIsLoading(true);

    try {
      // Show loading toast
      toast({
        title: "جاري تصدير البيانات...",
        description: "يرجى الانتظار",
      });

      // Fetch data with validation
      const payments = await getAllPayments();
      const members = await getAllMembers();

      // Validate data before export
      if (!payments || !Array.isArray(payments)) {
        throw new Error("بيانات المدفوعات غير صحيحة");
      }

      if (!members || !Array.isArray(members)) {
        throw new Error("بيانات الأعضاء غير صحيحة");
      }

      // Create comprehensive export data with metadata
      const exportData = {
        metadata: {
          exportDate: new Date().toISOString(),
          version: "2.0",
          gymName: "Yacin Gym",
          totalPayments: payments.length,
          totalMembers: members.length,
          dataIntegrity: {
            paymentsChecksum: payments.reduce(
              (sum, p) => sum + (p.amount || 0),
              0,
            ),
            membersChecksum: members.length,
          },
        },
        data: {
          payments: payments.map((payment) => ({
            ...payment,
            // Ensure all required fields are present
            id: payment.id || `payment_${Date.now()}_${Math.random()}`,
            amount: Number(payment.amount) || 0,
            date: payment.date || new Date().toISOString(),
            status: payment.status || "completed",
          })),
          members: members.map((member) => ({
            ...member,
            // Ensure all required fields are present
            id: member.id || `member_${Date.now()}_${Math.random()}`,
            name: member.name || "غير محدد",
            membershipStatus: member.membershipStatus || "pending",
          })),
        },
      };

      // Create and download file
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });

      // Verify blob creation
      if (dataBlob.size === 0) {
        throw new Error("فشل في إنشاء ملف التصدير");
      }

      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      const fileName = `yacin-gym-backup-${new Date().toISOString().split("T")[0]}-${Date.now()}.json`;

      link.href = url;
      link.download = fileName;
      link.style.display = "none";
      document.body.appendChild(link);

      // Trigger download
      link.click();

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);

      // Success feedback
      playSound("success");
      toast({
        title: "✅ تم تصدير البيانات بنجاح",
        description: `تم حفظ ${payments.length} دفعة و ${members.length} عضو في الملف: ${fileName}`,
      });
    } catch (error) {
      console.error("Export error:", error);
      playSound("error");
      toast({
        title: "❌ خطأ في التصدير",
        description:
          error instanceof Error
            ? error.message
            : "حدث خطأ غير متوقع أثناء تصدير البيانات",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Import data function with comprehensive validation and actual data restoration
  const handleImportData = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.style.display = "none";

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setIsLoading(true);

      try {
        // Show loading toast
        toast({
          title: "جاري استيراد البيانات...",
          description: "يرجى الانتظار، لا تغلق الصفحة",
        });

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error("حجم الملف كبير جداً (الحد الأقصى 10 ميجابايت)");
        }

        // Validate file type
        if (!file.name.toLowerCase().endsWith(".json")) {
          throw new Error("نوع الملف غير صحيح، يجب أن يكون ملف JSON");
        }

        const text = await file.text();

        // Validate JSON format
        let importData;
        try {
          importData = JSON.parse(text);
        } catch (parseError) {
          throw new Error("ملف JSON غير صحيح أو تالف");
        }

        // Validate data structure for both old and new formats
        let payments, members;

        if (importData.data && importData.metadata) {
          // New format (v2.0)
          payments = importData.data.payments;
          members = importData.data.members;

          // Validate metadata
          if (
            importData.metadata.version &&
            importData.metadata.totalPayments !== payments?.length
          ) {
            console.warn("تحذير: عدد المدفوعات لا يطابق البيانات الوصفية");
          }
        } else {
          // Old format (v1.0) - backward compatibility
          payments = importData.payments;
          members = importData.members;
        }

        // Validate required data
        if (!payments || !Array.isArray(payments)) {
          throw new Error("بيانات المدفوعات مفقودة أو غير صحيحة");
        }

        if (!members || !Array.isArray(members)) {
          throw new Error("بيانات الأعضاء مفقودة أو غير صحيحة");
        }

        if (payments.length === 0 && members.length === 0) {
          throw new Error("الملف فارغ - لا توجد بيانات للاستيراد");
        }

        // Validate individual records
        const validPayments = payments.filter((payment) => {
          return (
            payment &&
            typeof payment === "object" &&
            payment.id &&
            payment.amount !== undefined
          );
        });

        const validMembers = members.filter((member) => {
          return (
            member && typeof member === "object" && member.id && member.name
          );
        });

        if (validPayments.length !== payments.length) {
          console.warn(
            `تم تجاهل ${payments.length - validPayments.length} دفعة غير صحيحة`,
          );
        }

        if (validMembers.length !== members.length) {
          console.warn(
            `تم تجاهل ${members.length - validMembers.length} عضو غير صحيح`,
          );
        }

        // Import members first (payments reference members)
        let importedMembersCount = 0;
        for (const member of validMembers) {
          try {
            // Clean and validate member data
            const cleanMember = {
              ...member,
              id: member.id || `imported_member_${Date.now()}_${Math.random()}`,
              name: member.name || "عضو مستورد",
              membershipStatus: member.membershipStatus || "pending",
              lastAttendance:
                member.lastAttendance || new Date().toISOString().split("T")[0],
            };

            // Use the member service to add/update member
            const { updateMember, getMemberById } = await import(
              "@/services/memberService"
            );
            const existingMember = await getMemberById(cleanMember.id);

            if (existingMember) {
              await updateMember(cleanMember);
            } else {
              await updateMember(cleanMember); // updateMember works for both new and existing
            }

            importedMembersCount++;
          } catch (memberError) {
            console.error(`خطأ في استيراد العضو ${member.name}:`, memberError);
          }
        }

        // Import payments
        let importedPaymentsCount = 0;
        for (const payment of validPayments) {
          try {
            // Clean and validate payment data
            const cleanPayment = {
              ...payment,
              id:
                payment.id || `imported_payment_${Date.now()}_${Math.random()}`,
              amount: Number(payment.amount) || 0,
              date: payment.date || new Date().toISOString(),
              status: payment.status || "completed",
              paymentMethod: payment.paymentMethod || "cash",
              subscriptionType: payment.subscriptionType || "غير محدد",
            };

            // Use the payment service to add/update payment
            const { updatePayment, getPaymentById } = await import(
              "@/services/paymentService"
            );
            const existingPayment = await getPaymentById(cleanPayment.id);

            if (existingPayment) {
              await updatePayment(cleanPayment);
            } else {
              await updatePayment(cleanPayment); // updatePayment works for both new and existing
            }

            importedPaymentsCount++;
          } catch (paymentError) {
            console.error(`خطأ في استيراد الدفعة ${payment.id}:`, paymentError);
          }
        }

        // Success feedback
        playSound("success");
        toast({
          title: "✅ تم استيراد البيانات بنجاح",
          description: `تم استيراد ${importedPaymentsCount} دفعة و ${importedMembersCount} عضو من أصل ${payments.length} دفعة و ${members.length} عضو`,
        });

        // Refresh the page data
        setRefreshPaymentsList((prev) => prev + 1);
        fetchStatistics();
      } catch (error) {
        console.error("Import error:", error);
        playSound("error");
        toast({
          title: "❌ خطأ في الاستيراد",
          description:
            error instanceof Error
              ? error.message
              : "حدث خطأ غير متوقع أثناء استيراد البيانات",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
        // Clean up the input element safely
        try {
          if (input && input.parentNode) {
            input.parentNode.removeChild(input);
          }
        } catch (cleanupError) {
          // Ignore cleanup errors as they don't affect functionality
          console.log("Input cleanup completed");
        }
      }
    };

    // Add to DOM and trigger click
    document.body.appendChild(input);
    input.click();
  };

  // Fetch statistics on component mount and when payments are refreshed
  useEffect(() => {
    fetchStatistics();
  }, [refreshPaymentsList]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-900/50 to-slate-950"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <div className="relative z-10 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center mb-20 relative">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 rounded-2xl mb-6 shadow-2xl transform hover:scale-110 transition-transform duration-300">
              <DollarSign className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent mb-6 tracking-tight">
              إدارة المدفوعات
            </h1>
            <p className="text-slate-300 text-lg md:text-xl lg:text-2xl max-w-4xl mx-auto leading-relaxed mb-8 font-light">
              نظام متطور لتتبع وإدارة جميع المدفوعات والإيرادات بطريقة احترافية
              ومنظمة
            </p>

            {/* Export/Import Button */}
            <div className="flex justify-center">
              <div className="relative group">
                <Button
                  className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white px-8 py-4 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105 border-0 relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold"
                  onClick={() => {}}
                  disabled={isLoading}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10 flex items-center gap-4">
                    <Database
                      className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`}
                    />
                    <span className="font-bold">
                      {isLoading ? "جاري المعالجة..." : "إدارة البيانات"}
                    </span>
                  </div>
                </Button>

                {/* Dropdown Menu */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-6 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-20">
                  <div className="bg-slate-800/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-700/50 p-4 min-w-[280px]">
                    <Button
                      onClick={handleExportData}
                      disabled={isLoading}
                      className="w-full justify-start bg-transparent hover:bg-slate-700/50 text-slate-200 hover:text-white border-0 rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed py-4 text-lg"
                    >
                      <Download
                        className={`h-6 w-6 mr-4 ${isLoading ? "animate-pulse" : ""}`}
                      />
                      {isLoading ? "جاري التصدير..." : "تصدير البيانات"}
                    </Button>
                    <Button
                      onClick={handleImportData}
                      disabled={isLoading}
                      className="w-full justify-start bg-transparent hover:bg-slate-700/50 text-slate-200 hover:text-white border-0 rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed py-4 text-lg mt-2"
                    >
                      <Upload
                        className={`h-6 w-6 mr-4 ${isLoading ? "animate-pulse" : ""}`}
                      />
                      {isLoading ? "جاري الاستيراد..." : "استيراد البيانات"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6 mb-8 md:mb-12">
            <Card className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white p-4 md:p-6 shadow-2xl hover:shadow-3xl transition-all duration-700 transform hover:-translate-y-2 hover:scale-105 border-0 overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:bg-white/20 transition-all duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div className="bg-blue-400/40 p-3 md:p-4 rounded-xl backdrop-blur-sm shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-blue-100" />
                  </div>
                  <div className="text-right">
                    <p className="text-blue-100 text-xs md:text-sm font-bold mb-1 tracking-wide">
                      إجمالي الإيرادات
                    </p>
                    <p className="text-xl md:text-2xl lg:text-3xl font-black tracking-tight">
                      {formatNumber(statistics.totalRevenue)}
                    </p>
                    <p className="text-blue-200 text-xs md:text-sm mt-1 font-medium">
                      دينار جزائري
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 via-green-600 to-green-700 text-white p-6 md:p-8 shadow-2xl hover:shadow-3xl transition-all duration-700 transform hover:-translate-y-2 hover:scale-105 border-0 overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:bg-white/20 transition-all duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div className="bg-green-400/40 p-3 md:p-4 rounded-xl backdrop-blur-sm shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-green-100" />
                  </div>
                  <div className="text-right">
                    <p className="text-green-100 text-xs md:text-sm font-bold mb-1 tracking-wide">
                      إيرادات الشهر
                    </p>
                    <p className="text-xl md:text-2xl lg:text-3xl font-black tracking-tight">
                      {formatNumber(statistics.monthRevenue)}
                    </p>
                    <p className="text-green-200 text-xs md:text-sm mt-1 font-medium">
                      دينار جزائري
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 text-white p-6 md:p-8 shadow-2xl hover:shadow-3xl transition-all duration-700 transform hover:-translate-y-2 hover:scale-105 border-0 overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:bg-white/20 transition-all duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div className="bg-purple-400/40 p-3 md:p-4 rounded-xl backdrop-blur-sm shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-purple-100" />
                  </div>
                  <div className="text-right">
                    <p className="text-purple-100 text-xs md:text-sm font-bold mb-1 tracking-wide">
                      إيرادات الأسبوع
                    </p>
                    <p className="text-xl md:text-2xl lg:text-3xl font-black tracking-tight">
                      {formatNumber(statistics.weekRevenue)}
                    </p>
                    <p className="text-purple-200 text-xs md:text-sm mt-1 font-medium">
                      دينار جزائري
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 text-white p-6 md:p-8 shadow-2xl hover:shadow-3xl transition-all duration-700 transform hover:-translate-y-2 hover:scale-105 border-0 overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:bg-white/20 transition-all duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div className="bg-orange-400/40 p-3 md:p-4 rounded-xl backdrop-blur-sm shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-orange-100" />
                  </div>
                  <div className="text-right">
                    <p className="text-orange-100 text-xs md:text-sm font-bold mb-1 tracking-wide">
                      إيرادات اليوم
                    </p>
                    <p className="text-xl md:text-2xl lg:text-3xl font-black tracking-tight">
                      {formatNumber(statistics.todayRevenue)}
                    </p>
                    <p className="text-orange-200 text-xs md:text-sm mt-1 font-medium">
                      دينار جزائري
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-teal-500 via-teal-600 to-teal-700 text-white p-6 md:p-8 shadow-2xl hover:shadow-3xl transition-all duration-700 transform hover:-translate-y-2 hover:scale-105 border-0 overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:bg-white/20 transition-all duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div className="bg-teal-400/40 p-3 md:p-4 rounded-xl backdrop-blur-sm shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-teal-100" />
                  </div>
                  <div className="text-right">
                    <p className="text-teal-100 text-xs md:text-sm font-bold mb-1 tracking-wide">
                      إيرادات الحصص المنفردة
                    </p>
                    <p className="text-xl md:text-2xl lg:text-3xl font-black tracking-tight">
                      {formatNumber(statistics.nonSubscribedRevenue)}
                    </p>
                    <p className="text-teal-200 text-xs md:text-sm mt-1 font-medium">
                      دينار جزائري
                    </p>
                    <div className="mt-2 text-xs text-teal-200/80 bg-teal-600/30 px-3 py-1 rounded-full">
                      ✨ مُضمنة في الإجمالي
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
            <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl shadow-2xl p-4 md:p-6 border border-slate-700/30 hover:shadow-3xl transition-all duration-500 hover:bg-slate-800/40 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="mb-4 md:mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                      <DollarSign className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl md:text-2xl font-black text-slate-100 mb-1">
                        إضافة دفعة جديدة
                      </h2>
                      <p className="text-slate-300 text-sm md:text-base font-medium">
                        قم بإدخال تفاصيل الدفعة الجديدة
                      </p>
                    </div>
                  </div>
                </div>
                <PaymentForm
                  onSuccess={handlePaymentSuccess}
                  editingPayment={editingPayment}
                  onCancelEdit={handleCancelEdit}
                />
              </div>
            </div>
            <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl shadow-2xl p-4 md:p-6 border border-slate-700/30 hover:shadow-3xl transition-all duration-500 hover:bg-slate-800/40 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="mb-4 md:mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl md:text-2xl font-black text-slate-100 mb-1">
                        قائمة المدفوعات
                      </h2>
                      <p className="text-slate-300 text-sm md:text-base font-medium">
                        عرض وإدارة جميع المدفوعات
                      </p>
                    </div>
                  </div>
                </div>
                <PaymentsList
                  onRefresh={refreshPaymentsList}
                  onEditPayment={handleEditPayment}
                  ref={paymentsListRef}
                />
              </div>
            </div>
          </div>
        </div>
        <Toaster />
      </div>
    </div>
  );
};

export default PaymentsPage;
