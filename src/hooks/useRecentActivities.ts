import { useState, useEffect, useCallback } from "react";
import { MemberActivity, getRecentActivities } from "@/services/memberService";

export const useRecentActivities = (defaultLimit: number = 10) => {
  const [activities, setActivities] = useState<MemberActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const recentActivities = await getRecentActivities(defaultLimit);
      console.log("Fetched activities:", recentActivities);

      // Sort activities by timestamp (newest first)
      const sortedActivities = [...recentActivities].sort((a, b) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timeB - timeA;
      });

      setActivities(sortedActivities);
    } catch (error) {
      console.error("Error fetching recent activities:", error);
      // Set empty array on error to show "no activities" message
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [defaultLimit]);

  useEffect(() => {
    fetchActivities();

    // Set up interval to refresh data every minute
    const intervalId = setInterval(() => {
      fetchActivities();
    }, 60000);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [fetchActivities]);

  return { activities, loading, refreshActivities: fetchActivities };
};
