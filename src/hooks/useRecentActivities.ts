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
        return (
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      });

      setActivities(sortedActivities);
    } catch (error) {
      console.error("Error fetching recent activities:", error);
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
