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

        // Import and use the new attendance function
        const { getTodayAttendance } = await import("@/services/memberService");
        const todayData = await getTodayAttendance();

        console.log("Today's attendance data:", todayData);

        // Get today's check-in activities for additional context
        const activities = await getRecentActivities(100);
        const todayCheckInActivities = activities.filter(
          (activity) =>
            activity.activityType === "check-in" &&
            activity.timestamp &&
            activity.timestamp.split("T")[0] === today,
        );

        // Transform the data to match existing structure
        const todayAttendanceMembers = todayData.regularMembers.map(
          (item) => item.member,
        );
        const todaySessionPayments = todayData.sessionPayments;

        // Update today's attendance data
        setTodayAttendanceData({
          regularMembers: todayAttendanceMembers,
          sessionPayments: todaySessionPayments,
          nonSubscribedCustomers: todayData.nonSubscribedCustomers,
          checkInActivities: todayCheckInActivities,
        });

        // Calculate total attendance including total_sessions from non-subscribed customers
        const nonSubscribedTotalSessions =
          todayData.nonSubscribedCustomers.reduce(
            (sum, customer) => sum + customer.totalSessions,
            0,
          );

        const totalTodayAttendance =
          todayAttendanceMembers.length +
          todaySessionPayments.length +
          nonSubscribedTotalSessions;

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
      // Import the new function
      const { getTodayAttendance } = await import("@/services/memberService");
      const todayData = await getTodayAttendance();

      // Get activities for additional context
      const activities = await getRecentActivities(100);
      const today = new Date().toISOString().split("T")[0];
      const todayCheckInActivities = activities.filter(
        (activity) =>
          activity.activityType === "check-in" &&
          activity.timestamp &&
          activity.timestamp.split("T")[0] === today,
      );

      // Transform the data to match the existing structure
      const regularMembers = todayData.regularMembers.map(
        (item) => item.member,
      );

      setTodayAttendanceData({
        regularMembers,
        sessionPayments: todayData.sessionPayments,
        nonSubscribedCustomers: todayData.nonSubscribedCustomers,
        checkInActivities: todayCheckInActivities,
      });
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

        // Update statistics
        setStatistics((prev) => ({
          ...prev,
          todayAttendance: prev.todayAttendance - 1,
        }));

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

      {/* Today's Attendees Sheet - Completely Rebuilt */}
      <Sheet
        open={isTodayAttendeesSheetOpen}
        onOpenChange={(open) => {
          setIsTodayAttendeesSheetOpen(open);
          if (open) {
            refreshTodayAttendance();
          }
        }}
      >
        <SheetContent
          side="right"
          className="w-full sm:w-[550px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-y-auto border-slate-700/50 backdrop-blur-xl"
        >
          <SheetHeader className="pb-6 border-b border-slate-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <UserCheck className="h-5 w-5 text-white" />
                </div>
                <SheetTitle className="text-2xl font-black text-white">
                  حضور اليوم
                </SheetTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refreshTodayAttendance}
                  disabled={attendanceLoading}
                  className="text-blue-400 hover:text-blue-300 hover:bg-slate-800/50 rounded-xl px-3 py-2"
                >
                  {attendanceLoading ? (
                    <div className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full" />
                  ) : (
                    "تحديث"
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsTodayAttendeesSheetOpen(false)}
                  className="text-gray-400 hover:text-white hover:bg-slate-800/50 rounded-xl"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <SheetDescription className="text-slate-300 flex items-center gap-3 mt-3 text-base">
              <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-2 rounded-xl">
                <Calendar className="h-4 w-4 text-blue-400" />
                <span className="font-medium">
                  {formatDate(new Date().toISOString())}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-gradient-to-r from-green-500/20 to-blue-500/20 px-3 py-2 rounded-xl">
                <span className="font-bold text-white">
                  إجمالي الحضور:{" "}
                  {todayAttendanceData.regularMembers.length +
                    todayAttendanceData.sessionPayments.length +
                    todayAttendanceData.nonSubscribedCustomers.reduce(
                      (sum, customer) => sum + customer.totalSessions,
                      0,
                    )}
                </span>
              </div>
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Regular Members Section */}
            {todayAttendanceData.regularMembers.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 space-x-reverse mb-4">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <h3 className="text-lg font-semibold text-white">
                    الأعضاء المسجلين (
                    {todayAttendanceData.regularMembers.length})
                  </h3>
                </div>
                <div className="space-y-3">
                  {todayAttendanceData.regularMembers.map((member) => {
                    // Find corresponding check-in activity
                    const checkInActivity =
                      todayAttendanceData.checkInActivities.find(
                        (activity) => activity.memberId === member.id,
                      );

                    return (
                      <div
                        key={member.id}
                        className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors"
                      >
                        <div className="flex items-start space-x-3 space-x-reverse">
                          <Avatar className="h-12 w-12">
                            <AvatarImage
                              src={member.imageUrl}
                              alt={member.name}
                            />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                              {member.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-base font-medium text-white truncate">
                                {member.name}
                              </h4>
                              <Badge
                                variant="default"
                                className="bg-green-600 hover:bg-green-700 text-xs"
                              >
                                عضو مسجل
                              </Badge>
                            </div>

                            <div className="space-y-2 text-sm">
                              {member.phoneNumber && (
                                <div className="flex items-center space-x-2 space-x-reverse text-gray-300">
                                  <Phone className="h-3 w-3" />
                                  <span>{member.phoneNumber}</span>
                                </div>
                              )}

                              <div className="flex items-center space-x-2 space-x-reverse text-gray-300">
                                <Clock className="h-3 w-3" />
                                <span>
                                  وقت الحضور:{" "}
                                  {checkInActivity
                                    ? new Date(
                                        checkInActivity.timestamp,
                                      ).toLocaleTimeString("ar-SA", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        hour12: true,
                                      })
                                    : formatDate(member.lastAttendance)}
                                </span>
                              </div>

                              {member.sessionsRemaining !== undefined && (
                                <div className="flex items-center space-x-2 space-x-reverse">
                                  <div className="text-blue-400 font-medium">
                                    الحصص المتبقية:{" "}
                                    {formatNumber(member.sessionsRemaining)}
                                  </div>
                                  {member.subscriptionType && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs border-blue-400 text-blue-400"
                                    >
                                      {member.subscriptionType}
                                    </Badge>
                                  )}
                                </div>
                              )}

                              {checkInActivity && (
                                <div className="text-xs text-gray-400 bg-gray-700 rounded px-2 py-1">
                                  {checkInActivity.details}
                                </div>
                              )}
                            </div>

                            <div className="mt-3 flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveAttendance(member)}
                                disabled={isUpdatingAttendance === member.id}
                                className="text-red-400 border-red-400 hover:bg-red-400 hover:text-white flex-1"
                              >
                                {isUpdatingAttendance === member.id ? (
                                  <div className="flex items-center space-x-2 space-x-reverse">
                                    <div className="animate-spin h-3 w-3 border-2 border-red-400 border-t-transparent rounded-full" />
                                    <span>جاري الإلغاء...</span>
                                  </div>
                                ) : (
                                  <>
                                    <Undo2 className="h-3 w-3 ml-1" />
                                    إلغاء الحضور
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Session Payments Section */}
            {todayAttendanceData.sessionPayments.length > 0 && (
              <div>
                {todayAttendanceData.regularMembers.length > 0 && (
                  <Separator className="bg-gray-700 my-6" />
                )}
                <div className="flex items-center space-x-2 space-x-reverse mb-4">
                  <CreditCard className="h-5 w-5 text-yellow-400" />
                  <h3 className="text-lg font-semibold text-white">
                    الحصص المدفوعة منفرداً (
                    {todayAttendanceData.sessionPayments.length})
                  </h3>
                </div>
                <div className="space-y-3">
                  {todayAttendanceData.sessionPayments.map((session, index) => (
                    <div
                      key={session.id}
                      className="bg-gray-800 rounded-lg p-4 border border-yellow-600/30 hover:border-yellow-600/50 transition-colors"
                    >
                      <div className="flex items-start space-x-3 space-x-reverse">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-gradient-to-br from-yellow-500 to-orange-600 text-white font-semibold">
                            {session.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-base font-medium text-white truncate">
                              {session.name}
                            </h4>
                            <Badge
                              variant="secondary"
                              className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs"
                            >
                              حصة واحدة
                            </Badge>
                          </div>

                          <div className="space-y-2 text-sm">
                            {session.phoneNumber && (
                              <div className="flex items-center space-x-2 space-x-reverse text-gray-300">
                                <Phone className="h-3 w-3" />
                                <span>{session.phoneNumber}</span>
                              </div>
                            )}

                            <div className="flex items-center space-x-2 space-x-reverse text-gray-300">
                              <Clock className="h-3 w-3" />
                              <span>
                                وقت الدفع:{" "}
                                {new Date(session.time).toLocaleTimeString(
                                  "ar-SA",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  },
                                )}
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2 space-x-reverse text-green-400 font-medium">
                                <CreditCard className="h-3 w-3" />
                                <span>{formatNumber(session.amount)} ريال</span>
                              </div>
                              <Badge
                                variant="outline"
                                className="text-xs border-green-400 text-green-400"
                              >
                                {session.paymentMethod}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Non-Subscribed Customers Section */}
            {todayAttendanceData.nonSubscribedCustomers.length > 0 && (
              <div>
                {(todayAttendanceData.regularMembers.length > 0 ||
                  todayAttendanceData.sessionPayments.length > 0) && (
                  <Separator className="bg-gray-700 my-6" />
                )}
                <div className="flex items-center space-x-2 space-x-reverse mb-4">
                  <Users className="h-5 w-5 text-purple-400" />
                  <h3 className="text-lg font-semibold text-white">
                    الزبائن غير المشتركين (
                    {todayAttendanceData.nonSubscribedCustomers.length})
                  </h3>
                </div>
                <div className="space-y-3">
                  {todayAttendanceData.nonSubscribedCustomers.map(
                    (customer) => (
                      <div
                        key={customer.id}
                        className="bg-gray-800 rounded-lg p-4 border border-purple-600/30 hover:border-purple-600/50 transition-colors"
                      >
                        <div className="flex items-start space-x-3 space-x-reverse">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white font-semibold">
                              {customer.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-base font-medium text-white truncate">
                                {customer.name}
                              </h4>
                              <Badge
                                variant="secondary"
                                className="bg-purple-600 hover:bg-purple-700 text-white text-xs"
                              >
                                غير مشترك
                              </Badge>
                            </div>

                            <div className="space-y-2 text-sm">
                              {customer.phoneNumber && (
                                <div className="flex items-center space-x-2 space-x-reverse text-gray-300">
                                  <Phone className="h-3 w-3" />
                                  <span>{customer.phoneNumber}</span>
                                </div>
                              )}

                              <div className="flex items-center space-x-2 space-x-reverse text-gray-300">
                                <Calendar className="h-3 w-3" />
                                <span>
                                  آخر زيارة:{" "}
                                  {formatDate(customer.lastVisitDate)}
                                </span>
                              </div>

                              <div className="flex items-center space-x-2 space-x-reverse text-purple-400 font-medium">
                                <TrendingUp className="h-3 w-3" />
                                <span>
                                  إجمالي الحصص:{" "}
                                  {formatNumber(customer.totalSessions)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

            {/* Empty State */}
            {todayAttendanceData.regularMembers.length === 0 &&
              todayAttendanceData.sessionPayments.length === 0 &&
              todayAttendanceData.nonSubscribedCustomers.length === 0 && (
                <div className="text-center py-12">
                  <div className="bg-gray-800 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                    <Calendar className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    لا يوجد حضور اليوم
                  </h3>
                  <p className="text-gray-400 text-sm">
                    لم يتم تسجيل أي حضور أو دفع حصص منفردة اليوم
                  </p>
                </div>
              )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default StatisticsOverview;
