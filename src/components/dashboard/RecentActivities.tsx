import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Calendar,
  CreditCard,
  ArrowUpRight,
  Activity,
  UserPlus,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MemberActivity } from "@/services/memberService";
import { useRecentActivities } from "@/hooks/useRecentActivities";
import { formatNumber, formatDateTime } from "@/lib/utils";

interface RecentActivitiesProps {
  limit?: number;
}

const ActivityIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "check-in":
      return <Activity className="h-4 w-4 text-emerald-500" />;
    case "registration":
      return <UserPlus className="h-4 w-4 text-blue-500" />;
    case "membership-renewal":
      return <RefreshCw className="h-4 w-4 text-purple-500" />;
    case "payment":
      return <CreditCard className="h-4 w-4 text-green-500" />;
    case "membership-expiry":
      return <Calendar className="h-4 w-4 text-red-500" />;
    default:
      return <Activity className="h-4 w-4 text-blue-500" />;
  }
};

const getActivityText = (activity: MemberActivity) => {
  switch (activity.activityType) {
    case "check-in":
      return `تسجيل حضور ${activity.memberName || "عضو"}`;
    case "registration":
      return `تسجيل عضو جديد ${activity.memberName || "عضو"}`;
    case "membership-renewal":
      return `تجديد اشتراك ${activity.memberName || "عضو"}`;
    case "payment":
      return `دفعة جديدة ${activity.memberName || "عضو"}`;
    case "membership-expiry":
      return `انتهاء اشتراك ${activity.memberName || "عضو"}`;
    default:
      return `نشاط ${activity.memberName || "عضو"}`;
  }
};

const getTimeAgo = (timestamp: string) => {
  const now = new Date();
  const activityTime = new Date(timestamp);
  const diffMs = now.getTime() - activityTime.getTime();
  const diffMins = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);

  if (diffMins < 1) {
    return "الآن";
  } else if (diffMins < 60) {
    return `منذ ${formatNumber(diffMins)} دقيقة`;
  } else if (diffHours < 24) {
    return `منذ ${formatNumber(diffHours)} ساعة`;
  } else if (diffDays < 7) {
    return `منذ ${formatNumber(diffDays)} يوم`;
  } else {
    return activityTime.toLocaleDateString("fr-FR", {
      month: "short",
      day: "numeric",
    });
  }
};

const RecentActivities = ({ limit = 5 }: RecentActivitiesProps) => {
  const { activities, loading, refreshActivities } = useRecentActivities();

  // Debug log to check if activities are being loaded
  React.useEffect(() => {
    console.log("Recent Activities Debug:", { activities, loading });
  }, [activities, loading]);

  return (
    <Card className="bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95 backdrop-blur-xl border border-slate-700/50 shadow-2xl overflow-hidden hover:shadow-3xl transition-all duration-500 hover:border-slate-600/60">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-slate-700/30">
        <CardTitle className="text-xl font-bold bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
          <Activity className="h-5 w-5 text-emerald-400" />
          النشاطات الأخيرة
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={refreshActivities}
          className="text-xs flex items-center gap-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-full px-3 py-2 transition-all duration-200 border border-emerald-500/20 hover:border-emerald-400/40"
        >
          <RefreshCw className="h-3 w-3" />
          تحديث
        </Button>
      </CardHeader>
      <CardContent className="p-6 bg-gradient-to-b from-slate-800/20 to-slate-900/40">
        <div className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-3 border-emerald-400/30 border-t-emerald-400 shadow-lg"></div>
                <div className="text-slate-300 font-medium text-lg">
                  جاري التحميل...
                </div>
              </div>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-slate-700/50 to-slate-800/50 flex items-center justify-center border border-slate-600/30 shadow-xl">
                <Activity className="h-10 w-10 text-slate-400" />
              </div>
              <div className="text-slate-400 font-medium text-lg mb-2">
                لا توجد نشاطات حديثة
              </div>
              <div className="text-slate-500 text-sm">
                ستظهر النشاطات هنا عند تسجيل الحضور أو إضافة أعضاء جدد
              </div>
            </div>
          ) : (
            activities.slice(0, limit).map((activity, index) => (
              <div
                key={activity.id || index}
                className="group flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-slate-800/60 via-slate-700/40 to-slate-800/60 hover:from-slate-700/70 hover:via-slate-600/50 hover:to-slate-700/70 border border-slate-600/30 hover:border-slate-500/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl backdrop-blur-sm"
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: "fadeInUp 0.6s ease-out forwards",
                }}
              >
                <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-slate-700/80 to-slate-800/80 flex items-center justify-center ring-2 ring-slate-600/40 group-hover:ring-slate-500/60 transition-all duration-300 shadow-lg">
                  {activity.memberImage ? (
                    <img
                      src={activity.memberImage}
                      alt={activity.memberName || "عضو"}
                      className="w-full h-full rounded-full object-cover border-2 border-slate-600/50"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center">
                      <ActivityIcon type={activity.activityType} />
                    </div>
                  )}
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full border-2 border-slate-800 shadow-lg flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-100 group-hover:text-white transition-colors duration-200 truncate text-base">
                    {getActivityText(activity)}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-3 w-3 text-slate-400" />
                    <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors duration-200">
                      {getTimeAgo(activity.timestamp)}
                    </p>
                  </div>
                  {activity.details && (
                    <p className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors duration-200 mt-1 truncate">
                      {activity.details}
                    </p>
                  )}
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                  <ArrowUpRight className="h-5 w-5 text-emerald-400 group-hover:text-emerald-300" />
                </div>
              </div>
            ))
          )}
        </div>

        {activities.length > limit && (
          <div className="flex justify-center mt-8 pt-6 border-t border-slate-700/50">
            <Button
              variant="ghost"
              size="sm"
              className="text-sm flex items-center gap-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-full px-6 py-3 font-medium transition-all duration-200 hover:scale-105 border border-emerald-500/20 hover:border-emerald-400/40 shadow-lg"
              onClick={() => (window.location.href = "/reports")}
            >
              عرض جميع النشاطات ({formatNumber(activities.length)})
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivities;
