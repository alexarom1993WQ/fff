import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  Calendar,
  TrendingUp,
  CreditCard,
  X,
  AlertCircle,
  Phone,
  Mail,
  Trash2,
  Undo2,
  Clock,
  CheckCircle,
  UserCheck,
} from "lucide-react";
import {
  getAllMembers,
  Member,
  updateMember,
  removeAttendance,
  getRecentActivities,
  MemberActivity,
  getTodayAttendanceBreakdown,
} from "@/services/memberService";
import { getAllPayments } from "@/services/paymentService";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatNumber, formatDate } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";
import { supabase, requireAuth } from "@/lib/supabase";

interface StatisticCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  isLoading?: boolean;
}

const StatisticCard = (
  {
    icon,
    value,
    label,
    trend,
    isLoading = false,
    onClick,
  }: StatisticCardProps & { onClick?: () => void } = {
    icon: <Users className="h-6 w-6" />,
    value: "0",
    label: "Statistic",
    trend: {
      value: 0,
      isPositive: true,
    },
    isLoading: false,
  },
) => {
  return (
    <Card
      className={`overflow-hidden bg-gradient-to-br from-slate-800/60 via-slate-800/40 to-slate-900/60 backdrop-blur-xl border-slate-700/50 shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-2 ${onClick ? "cursor-pointer hover:scale-105" : "hover:scale-102"} relative group`}
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="absolute -top-2 -right-2 w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
      <CardContent className="p-6 md:p-8 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="text-3xl md:text-4xl lg:text-5xl font-black bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
              {isLoading
                ? "..."
                : typeof value === "number"
                  ? formatNumber(value)
                  : value}
            </div>
            <div className="text-base md:text-lg text-slate-300 font-semibold mb-3">
              {label}
            </div>
            {!isLoading && trend && (
              <div
                className={`text-sm flex items-center gap-2 px-3 py-1 rounded-full backdrop-blur-sm ${trend.isPositive ? "text-green-300 bg-green-500/20" : "text-red-300 bg-red-500/20"}`}
              >
                <span className="text-lg">
                  {trend.isPositive ? "↗" : "↘"}
                </span>
                <span className="font-bold">{formatNumber(trend.value)}%</span>
                <span className="text-xs opacity-80">
                  {trend.isPositive ? "زيادة" : "نقصان"}
                </span>
              </div>
            )}
          </div>
          <div className="bg-gradient-to-br from-blue-500/30 via-indigo-500/20 to-purple-600/30 p-4 md:p-5 rounded-2xl backdrop-blur-sm shadow-lg group-hover:scale-110 transition-transform duration-300">
            {React.cloneElement(icon as React.ReactElement, {
              className: "h-7 w-7 md:h-8 md:w-8 text-blue-200",
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const StatisticsOverview = () => {
  const [statistics, setStatistics] = useState({
    totalMembers: 0,
    todayAttendance: 0,
    weeklyAttendance: 0,
    pendingPayments: 0,
  });
  const [todayAttendanceBreakdown, setTodayAttendanceBreakdown] = useState({
    regularMembers: 0,
    nonSubscribedCustomers: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [trends, setTrends] = useState({
    totalMembers: { value: 0, isPositive: true },
    todayAttendance: { value: 0, isPositive: true },
    weeklyAttendance: { value: 0, isPositive: true },
    pendingPayments: { value: 0, isPositive: false },
    revenue: { value: 0, isPositive: true },
  });
  const [isUnpaidMembersSheetOpen, setIsUnpaidMembersSheetOpen] =
    useState(false);
  const [unpaidMembers, setUnpaidMembers] = useState<Member[]>([]);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isTodayAttendeesSheetOpen, setIsTodayAttendeesSheetOpen] =
    useState(false);
  const [todayAttendanceData, setTodayAttendanceData] = useState<{
    regularMembers: Member[];
    sessionPayments: Array<{
      id: string;
      name: string;
      phoneNumber?: string;
      amount: number;
      time: string;
      paymentMethod?: string;
    }>;
    nonSubscribedCustomers: Array<{
      id: string;
      name: string;
      phoneNumber?: string;
      totalSessions: number;
      lastVisitDate: string;
    }>;
    checkInActivities: MemberActivity[];
  }>({
    regularMembers: [],
    sessionPayments: [],
    nonSubscribedCustomers: [],
    checkInActivities: [],
  });
  const [isUpdatingAttendance, setIsUpdatingAttendance] = useState<
    string | null
  >(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch all members
        const members = await getAllMembers();
        const totalMembers = members.length;

        // Fetch all payments first
        const payments = await getAllPayments();

        // Calculate today's attendance using new attendance table
        const today = new Date().toISOString().split("T")[0];

        // Get today's attendance breakdown
        const todayBreakdown = await getTodayAttendanceBreakdown();
        const totalTodayAttendance = todayBreakdown.total;
        setTodayAttendanceBreakdown(todayBreakdown);

        console.log("Today's attendance breakdown:", todayBreakdown);

        // Calculate weekly attendance from attendance table
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const oneWeekAgoStr = oneWeekAgo.toISOString().split("T")[0];

        // Get weekly attendance count from attendance table
        const userId = await requireAuth();
        const { data: weeklyAttendanceData, error: weeklyError } =
          await supabase
            .from("attendance")
            .select("id")
            .eq("user_id", userId)
            .gte("attendance_date", oneWeekAgoStr)
            .lte("attendance_date", today);

        if (weeklyError) {
          console.error("Error fetching weekly attendance:", weeklyError);
        }

        const regularWeeklyAttendance = weeklyAttendanceData
          ? weeklyAttendanceData.length
          : 0;

        // Get weekly non-subscribed customers attendance
        const {
          data: weeklyNonSubscribedData,
          error: weeklyNonSubscribedError,
        } = await supabase
          .from("non_subscribed_customers")
          .select("total_sessions")
          .eq("user_id", userId)
          .gte("last_visit_date", oneWeekAgoStr)
          .lte("last_visit_date", today);

        if (weeklyNonSubscribedError) {
          console.error(
            "Error fetching weekly non-subscribed attendance:",
            weeklyNonSubscribedError,
          );
        }

        const weeklyNonSubscribedAttendance = weeklyNonSubscribedData
          ? weeklyNonSubscribedData.reduce(
              (sum, customer) => sum + (customer.total_sessions || 0),
              0,
            )
          : 0;

        const weeklyAttendance =
          regularWeeklyAttendance + weeklyNonSubscribedAttendance;
        // Include members with zero sessions and unpaid status
        const unpaidMembersList = members.filter(
          (member) =>
            member.paymentStatus === "unpaid" ||
            member.paymentStatus === "partial" ||
            member.membershipStatus === "pending" ||
            (member.sessionsRemaining !== undefined &&
              member.sessionsRemaining <= 0),
        );
        const pendingPayments = unpaidMembersList.length;
        setUnpaidMembers(unpaidMembersList);

        // Calculate trends based on real data
        // Get previous week attendance for trend calculation
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        const twoWeeksAgoStr = twoWeeksAgo.toISOString().split("T")[0];

        const { data: previousWeekData, error: prevWeekError } = await supabase
          .from("attendance")
          .select("id")
          .eq("user_id", userId)
          .gte("attendance_date", twoWeeksAgoStr)
          .lt("attendance_date", oneWeekAgoStr);

        if (prevWeekError) {
          console.error(
            "Error fetching previous week attendance:",
            prevWeekError,
          );
        }

        const regularPreviousWeekAttendance = previousWeekData
          ? previousWeekData.length
          : 0;

        // Get previous week non-subscribed customers attendance
        const {
          data: prevWeekNonSubscribedData,
          error: prevWeekNonSubscribedError,
        } = await supabase
          .from("non_subscribed_customers")
          .select("total_sessions")
          .eq("user_id", userId)
          .gte("last_visit_date", twoWeeksAgoStr)
          .lt("last_visit_date", oneWeekAgoStr);

        if (prevWeekNonSubscribedError) {
          console.error(
            "Error fetching previous week non-subscribed attendance:",
            prevWeekNonSubscribedError,
          );
        }

        const prevWeekNonSubscribedAttendance = prevWeekNonSubscribedData
          ? prevWeekNonSubscribedData.reduce(
              (sum, customer) => sum + (customer.total_sessions || 0),
              0,
            )
          : 0;

        const previousWeekAttendance =
          regularPreviousWeekAttendance + prevWeekNonSubscribedAttendance;

        // Get yesterday's attendance for today's trend
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        const { data: yesterdayData, error: yesterdayError } = await supabase
          .from("attendance")
          .select("id")
          .eq("user_id", userId)
          .eq("attendance_date", yesterdayStr);

        if (yesterdayError) {
          console.error("Error fetching yesterday attendance:", yesterdayError);
        }

        const yesterdayAttendance = yesterdayData ? yesterdayData.length : 0;

        // Get member count from last month for trend calculation
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        const lastMonthStr = lastMonth.toISOString().split("T")[0];

        const { data: lastMonthMembersData, error: lastMonthError } =
          await supabase
            .from("members")
            .select("id")
            .eq("user_id", userId)
            .lte("created_at", lastMonthStr);

        if (lastMonthError) {
          console.error("Error fetching last month members:", lastMonthError);
        }

        const lastMonthMemberCount = lastMonthMembersData
          ? lastMonthMembersData.length
          : 0;

        // Calculate trend percentages
        const weeklyTrendPercentage =
          previousWeekAttendance > 0
            ? Math.round(
                ((weeklyAttendance - previousWeekAttendance) /
                  previousWeekAttendance) *
                  100,
              )
            : weeklyAttendance > 0
              ? 100
              : 0;

        const membersTrendPercentage =
          lastMonthMemberCount > 0
            ? Math.round(
                ((totalMembers - lastMonthMemberCount) / lastMonthMemberCount) *
                  100,
              )
            : totalMembers > 0
              ? 100
              : 0;

        const todayTrendPercentage =
          yesterdayAttendance > 0
            ? Math.round(
                ((totalTodayAttendance - yesterdayAttendance) /
                  yesterdayAttendance) *
                  100,
              )
            : totalTodayAttendance > 0
              ? 100
              : 0;

        console.log("Statistics calculated:", {
          totalMembers,
          todayAttendance: totalTodayAttendance,
          weeklyAttendance,
          pendingPayments,
        });

        setStatistics({
          totalMembers,
          todayAttendance: totalTodayAttendance,
          weeklyAttendance,
          pendingPayments,
        });

        setTrends({
          totalMembers: {
            value: membersTrendPercentage,
            isPositive: membersTrendPercentage >= 0,
          },
          todayAttendance: {
            value: todayTrendPercentage,
            isPositive: todayTrendPercentage >= 0,
          },
          weeklyAttendance: {
            value: Math.abs(weeklyTrendPercentage),
            isPositive: weeklyTrendPercentage >= 0,
          },
          pendingPayments: { value: 2, isPositive: false },
          revenue: { value: 0, isPositive: true },
        });
      } catch (error) {
        console.error("Error fetching statistics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Set up interval to refresh data every 30 seconds for real-time updates
    const intervalId = setInterval(() => {
      fetchData();
    }, 30000); // 30 seconds

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const handleRemoveFromUnpaidList = async (member: Member) => {
    setIsUpdating(member.id);
    try {
      // Update member payment status to paid and membership status to active
      const updatedMember = {
        ...member,
        paymentStatus: "paid" as const,
        membershipStatus: "active" as const,
      };

      await updateMember(updatedMember);

      // Remove from local unpaid list
      setUnpaidMembers((prev) => prev.filter((m) => m.id !== member.id));

      // Update statistics
      setStatistics((prev) => ({
        ...prev,
        pendingPayments: prev.pendingPayments - 1,
      }));
    } catch (error) {
      console.error("Error updating member:", error);
    } finally {
      setIsUpdating(null);
    }
  };

  // Function to refresh today's attendance data
  const refreshTodayAttendance = useCallback(async () => {
    setAttendanceLoading(true);
    try {
      // Get today's attendance breakdown
      const todayBreakdown = await getTodayAttendanceBreakdown();
      const totalTodayAttendance = todayBreakdown.total;
      setTodayAttendanceBreakdown(todayBreakdown);

      // Update the statistics with the correct count
      setStatistics((prev) => ({
        ...prev,
        todayAttendance: totalTodayAttendance,
      }));
    } catch (error) {
      console.error("Error refreshing attendance data:", error);
    } finally {
      setAttendanceLoading(false);
    }
  }, []);

  const handleRemoveAttendance = async (member: Member) => {
    setIsUpdatingAttendance(member.id);
    try {
      const updatedMember = await removeAttendance(member.id);
      if (updatedMember) {
        // Refresh attendance data
        await refreshTodayAttendance();

        // Statistics will be updated by the refreshTodayAttendance function

        toast({
          title: "تم إلغاء الحضور",
          description: `تم إلغاء حضور ${member.name} بنجاح`,
        });
      }
    } catch (error) {
      console.error("Error removing attendance:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إلغاء الحضور",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingAttendance(null);
    }
  };

  return (
    <div className="w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-slate-900/20 to-slate-950/30"></div>
      <div className="absolute top-0 left-1/3 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <div className="relative z-10 p-4 md:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <StatisticCard
            icon={<Users className="h-7 w-7 text-blue-300" />}
            value={statistics.totalMembers}
            label="إجمالي الأعضاء"
            trend={trends.totalMembers}
            isLoading={isLoading}
          />

          <StatisticCard
            icon={<Calendar className="h-7 w-7 text-purple-300" />}
            value={statistics.todayAttendance}
            label="حضور اليوم"
            trend={trends.todayAttendance}
            isLoading={isLoading}
            onClick={() => setIsTodayAttendeesSheetOpen(true)}
          />

          <StatisticCard
            icon={<TrendingUp className="h-7 w-7 text-indigo-300" />}
            value={statistics.weeklyAttendance}
            label="حضور الأسبوع"
            trend={trends.weeklyAttendance}
            isLoading={isLoading}
          />

          <StatisticCard
            icon={<CreditCard className="h-7 w-7 text-pink-300" />}
            value={statistics.pendingPayments}
            label="مدفوعات معلقة"
            trend={trends.pendingPayments}
            isLoading={isLoading}
            onClick={() => {
              if (statistics.pendingPayments > 0) {
                setIsUnpaidMembersSheetOpen(true);
              }
            }}
          />
        </div>
      </div>

      {/* Today's Attendance Breakdown Sheet */}
      <Sheet
        open={isTodayAttendeesSheetOpen}
        onOpenChange={setIsTodayAttendeesSheetOpen}
      >
        <SheetContent
          side="right"
          className="w-full sm:w-[450px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white border-slate-700/50 backdrop-blur-xl"
        >
          <SheetHeader className="pb-6 border-b border-slate-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <SheetTitle className="text-2xl font-black text-white">
                  حضور اليوم
                </SheetTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsTodayAttendeesSheetOpen(false)}
                className="text-gray-400 hover:text-white hover:bg-slate-800/50 rounded-xl"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <SheetDescription className="text-slate-300 text-base mt-3">
              تفصيل حضور اليوم للأعضاء المشتركين والعملاء غير المشتركين
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Total Attendance */}
            <div className="bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-xl p-6 border border-purple-500/30">
              <div className="text-center">
                <div className="text-4xl font-black text-white mb-2">
                  {todayAttendanceBreakdown.total}
                </div>
                <div className="text-lg text-purple-200 font-semibold">
                  إجمالي الحضور اليوم
                </div>
              </div>
            </div>

            {/* Breakdown */}
            <div className="space-y-4">
              {/* Regular Members */}
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <UserCheck className="h-4 w-4 text-green-400" />
                    </div>
                    <div>
                      <div className="text-white font-semibold">
                        الأعضاء المشتركين
                      </div>
                      <div className="text-sm text-slate-400">
                        الحضور العادي
                      </div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-green-400">
                    {todayAttendanceBreakdown.regularMembers}
                  </div>
                </div>
              </div>

              {/* Non-Subscribed Customers */}
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Users className="h-4 w-4 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-white font-semibold">
                        العملاء غير المشتركين
                      </div>
                      <div className="text-sm text-slate-400">
                        الحصص المنفردة
                      </div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-blue-400">
                    {todayAttendanceBreakdown.nonSubscribedCustomers}
                  </div>
                </div>
              </div>
            </div>

            {/* Refresh Button */}
            <div className="pt-4">
              <Button
                onClick={refreshTodayAttendance}
                disabled={attendanceLoading}
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl"
              >
                {attendanceLoading ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    جاري التحديث...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    تحديث البيانات
                  </>
                )}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Unpaid Members Sheet */}
      <Sheet
        open={isUnpaidMembersSheetOpen}
        onOpenChange={setIsUnpaidMembersSheetOpen}
      >
        <SheetContent
          side="right"
          className="w-full sm:w-[450px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white border-slate-700/50 backdrop-blur-xl"
        >
          <SheetHeader className="pb-6 border-b border-slate-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-white" />
                </div>
                <SheetTitle className="text-2xl font-black text-white">
                  الأعضاء غير المدفوعين
                </SheetTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsUnpaidMembersSheetOpen(false)}
                className="text-gray-400 hover:text-white hover:bg-slate-800/50 rounded-xl"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <SheetDescription className="text-slate-300 text-base mt-3">
              قائمة بالأعضاء الذين لديهم مدفوعات معلقة أو حصص منتهية
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {unpaidMembers.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">لا توجد مدفوعات معلقة</p>
              </div>
            ) : (
              unpaidMembers.map((member) => (
                <div
                  key={member.id}
                  className="bg-gray-800 rounded-lg p-4 border border-gray-700"
                >
                  <div className="flex items-start space-x-3 space-x-reverse">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={member.profileImage}
                        alt={member.name}
                      />
                      <AvatarFallback className="bg-gray-700 text-white">
                        {member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-white truncate">
                          {member.name}
                        </h3>
                        <Badge
                          variant={
                            member.paymentStatus === "unpaid"
                              ? "destructive"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {member.paymentStatus === "unpaid"
                            ? "غير مدفوع"
                            : member.paymentStatus === "partial"
                              ? "جزئي"
                              : "معلق"}
                        </Badge>
                      </div>

                      <div className="space-y-1 text-xs text-gray-400">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Phone className="h-3 w-3" />
                          <span>{member.phoneNumber}</span>
                        </div>
                        {member.email && (
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <Mail className="h-3 w-3" />
                            <span>{member.email}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveFromUnpaidList(member)}
                          disabled={isUpdating === member.id}
                          className="text-green-400 border-green-400 hover:bg-green-400 hover:text-white flex-1"
                        >
                          {isUpdating === member.id ? (
                            "جاري التحديث..."
                          ) : (
                            <>
                              <Trash2 className="h-3 w-3 ml-1" />
                              تم الدفع
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default StatisticsOverview;
