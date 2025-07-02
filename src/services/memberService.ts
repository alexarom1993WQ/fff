import { supabase, requireAuth } from "@/lib/supabase";
import { formatNumber, formatDate } from "@/lib/utils";

export interface Member {
  id: string;
  user_id?: string;
  name: string;
  membershipStatus: "active" | "expired" | "pending";
  lastAttendance: string;
  imageUrl?: string;
  phoneNumber?: string;
  email?: string;
  membershipType?: string;
  membershipStartDate?: string;
  membershipEndDate?: string;
  subscriptionType?: "13 حصة" | "15 حصة" | "30 حصة";
  sessionsRemaining?: number;
  subscriptionPrice?: number;
  paymentStatus?: "paid" | "unpaid" | "partial";
  note?: string;
}

// Database helper functions
const mapMemberFromDB = (dbMember: any): Member => ({
  id: dbMember.id,
  user_id: dbMember.user_id,
  name: dbMember.name,
  membershipStatus: dbMember.membership_status,
  lastAttendance: dbMember.last_attendance,
  imageUrl: dbMember.image_url,
  phoneNumber: dbMember.phone_number,
  email: dbMember.email,
  membershipType: dbMember.membership_type,
  membershipStartDate: dbMember.membership_start_date,
  membershipEndDate: dbMember.membership_end_date,
  subscriptionType: dbMember.subscription_type,
  sessionsRemaining: dbMember.sessions_remaining,
  subscriptionPrice: dbMember.subscription_price,
  paymentStatus: dbMember.payment_status,
  note: dbMember.note,
});

const mapMemberToDB = (member: Partial<Member>, userId: string) => ({
  user_id: userId,
  name: member.name,
  membership_status: member.membershipStatus,
  last_attendance: member.lastAttendance,
  image_url: member.imageUrl,
  phone_number: member.phoneNumber,
  email: member.email,
  membership_type: member.membershipType,
  membership_start_date: member.membershipStartDate,
  membership_end_date: member.membershipEndDate,
  subscription_type: member.subscriptionType,
  sessions_remaining: member.sessionsRemaining,
  subscription_price: member.subscriptionPrice,
  payment_status: member.paymentStatus,
  note: member.note,
});

// Initial seed data
const initialMembers: Member[] = [
  {
    id: "1",
    name: "أحمد محمد",
    membershipStatus: "active",
    lastAttendance: "2023-06-15",
    imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=ahmed",
    phoneNumber: "0501234567",
    email: "ahmed@example.com",
    membershipType: "شهري",
    membershipStartDate: "2023-05-15",
    membershipEndDate: "2023-07-15",
    subscriptionType: "30 حصة",
    sessionsRemaining: 25,
    subscriptionPrice: 1800,
    paymentStatus: "paid",
  },
  {
    id: "2",
    name: "سارة علي",
    membershipStatus: "active",
    lastAttendance: "2023-06-14",
    imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=sara",
    phoneNumber: "0507654321",
    email: "sara@example.com",
    membershipType: "سنوي",
    membershipStartDate: "2023-01-01",
    membershipEndDate: "2023-12-31",
    subscriptionType: "15 حصة",
    sessionsRemaining: 10,
    subscriptionPrice: 1000,
    paymentStatus: "paid",
  },
  {
    id: "3",
    name: "محمد خالد",
    membershipStatus: "expired",
    lastAttendance: "2023-05-20",
    imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=mohamed",
    phoneNumber: "0509876543",
    email: "mohamed@example.com",
    membershipType: "شهري",
    membershipStartDate: "2023-04-01",
    membershipEndDate: "2023-05-01",
    subscriptionType: "13 حصة",
    sessionsRemaining: 0,
    subscriptionPrice: 1000,
    paymentStatus: "paid",
  },
  {
    id: "4",
    name: "فاطمة أحمد",
    membershipStatus: "pending",
    lastAttendance: "2023-06-10",
    imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=fatima",
    phoneNumber: "0503456789",
    email: "fatima@example.com",
    membershipType: "شهري",
    membershipStartDate: "2023-06-01",
    membershipEndDate: "2023-07-01",
  },
  {
    id: "5",
    name: "عمر حسن",
    membershipStatus: "active",
    lastAttendance: "2023-06-15",
    imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=omar",
    phoneNumber: "0505555555",
    email: "omar@example.com",
    membershipType: "سنوي",
    membershipStartDate: "2023-03-15",
    membershipEndDate: "2024-03-15",
  },
  {
    id: "6",
    name: "نور محمد",
    membershipStatus: "expired",
    lastAttendance: "2023-04-30",
    imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=noor",
    phoneNumber: "0506666666",
    email: "noor@example.com",
    membershipType: "شهري",
    membershipStartDate: "2023-03-01",
    membershipEndDate: "2023-04-01",
  },
  {
    id: "7",
    name: "خالد عبدالله",
    membershipStatus: "active",
    lastAttendance: "2023-06-12",
    imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=khaled",
    phoneNumber: "0507777777",
    email: "khaled@example.com",
    membershipType: "شهري",
    membershipStartDate: "2023-06-01",
    membershipEndDate: "2023-07-01",
  },
  {
    id: "8",
    name: "ليلى سعيد",
    membershipStatus: "pending",
    lastAttendance: "2023-06-01",
    imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=layla",
    phoneNumber: "0508888888",
    email: "layla@example.com",
    membershipType: "سنوي",
    membershipStartDate: "2023-06-15",
    membershipEndDate: "2024-06-15",
  },
];

// Get all members
export const getAllMembers = async (): Promise<Member[]> => {
  try {
    const userId = await requireAuth();
    const { data, error } = await supabase
      .from("members")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data ? data.map(mapMemberFromDB) : [];
  } catch (error) {
    console.error("Error fetching members:", error);
    return [];
  }
};

// Get a member by ID
export const getMemberById = async (id: string): Promise<Member | null> => {
  try {
    const userId = await requireAuth();
    const { data, error } = await supabase
      .from("members")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error) throw error;
    return data ? mapMemberFromDB(data) : null;
  } catch (error) {
    console.error("Error fetching member:", error);
    return null;
  }
};

// Add a new member
export const addMember = async (
  member: Omit<Member, "id">,
): Promise<Member> => {
  try {
    const userId = await requireAuth();
    const memberData = mapMemberToDB(member, userId);

    const { data, error } = await supabase
      .from("members")
      .insert([memberData])
      .select()
      .single();

    if (error) throw error;

    const newMember = mapMemberFromDB(data);

    // Create initial session if member has a subscription
    if (member.subscriptionType && member.sessionsRemaining) {
      const sessionData: Omit<
        SessionData,
        "id" | "user_id" | "created_at" | "updated_at"
      > = {
        member_id: newMember.id,
        member_name: newMember.name,
        subscription_type: member.subscriptionType,
        total_sessions: member.sessionsRemaining,
        used_sessions: 0,
        remaining_sessions: member.sessionsRemaining,
        start_date:
          member.membershipStartDate || new Date().toISOString().split("T")[0],
        end_date: member.membershipEndDate,
        status: "active",
        price: member.subscriptionPrice,
        payment_status: member.paymentStatus || "paid",
        notes: `حصص أولية للعضو ${newMember.name}`,
      };

      try {
        await createMemberSession(sessionData);
        console.log("تم إنشاء حصص أولية للعضو:", newMember.name);
      } catch (sessionError) {
        console.error("Error creating initial session:", sessionError);
        // Don't throw error here, member creation was successful
      }
    }

    return newMember;
  } catch (error) {
    console.error("Error adding member:", error);
    throw error;
  }
};

// Update a member
export const updateMember = async (member: Member): Promise<Member> => {
  try {
    const userId = await requireAuth();
    const memberData = mapMemberToDB(member, userId);

    const { data, error } = await supabase
      .from("members")
      .update(memberData)
      .eq("id", member.id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return mapMemberFromDB(data);
  } catch (error) {
    console.error("Error updating member:", error);
    throw error;
  }
};

// Reset member sessions based on subscription type
export const resetMemberSessions = async (
  memberId: string,
): Promise<Member | null> => {
  const member = await getMemberById(memberId);
  if (!member) return null;

  // Reset sessions based on subscription type
  let newSessionsRemaining = 0;
  if (member.subscriptionType === "13 حصة") {
    newSessionsRemaining = 13;
  } else if (member.subscriptionType === "15 حصة") {
    newSessionsRemaining = 15;
  } else if (member.subscriptionType === "20 حصة") {
    newSessionsRemaining = 20;
  } else if (member.subscriptionType === "30 حصة") {
    newSessionsRemaining = 30;
  }

  const updatedMember = {
    ...member,
    sessionsRemaining: newSessionsRemaining,
    paymentStatus: "paid" as const,
    membershipStatus: "active" as const,
  };

  await updateMember(updatedMember);

  // Create new session record for the reset
  if (member.subscriptionType && newSessionsRemaining > 0) {
    const sessionData: Omit<
      SessionData,
      "id" | "user_id" | "created_at" | "updated_at"
    > = {
      member_id: memberId,
      member_name: member.name,
      subscription_type: member.subscriptionType,
      total_sessions: newSessionsRemaining,
      used_sessions: 0,
      remaining_sessions: newSessionsRemaining,
      start_date: new Date().toISOString().split("T")[0],
      end_date: member.membershipEndDate,
      status: "active",
      price: member.subscriptionPrice,
      payment_status: "paid",
      notes: `إعادة تعيين الحصص - ${formatDate(new Date().toISOString())}`,
    };

    try {
      await createMemberSession(sessionData);
      console.log("تم إنشاء حصص جديدة للعضو:", member.name);
    } catch (sessionError) {
      console.error("Error creating reset session:", sessionError);
    }
  }

  // Add activity for session reset
  await addActivity({
    memberId: member.id,
    memberName: member.name,
    memberImage: member.imageUrl,
    activityType: "membership-renewal",
    timestamp: new Date().toISOString(),
    details: `تم إعادة تعيين الحصص - ${formatNumber(newSessionsRemaining)}/${formatNumber(newSessionsRemaining)} حصة`,
  });

  return updatedMember;
};

// Delete a member permanently
export const deleteMember = async (id: string): Promise<void> => {
  try {
    const userId = await requireAuth();

    // Get member details before deletion for cleanup
    const member = await getMemberById(id);
    if (!member) {
      throw new Error("العضو غير موجود");
    }

    // Delete related data first to maintain referential integrity

    // Delete attendance records
    const { error: attendanceError } = await supabase
      .from("attendance")
      .delete()
      .eq("member_id", id)
      .eq("user_id", userId);

    if (attendanceError) {
      console.error("Error deleting attendance records:", attendanceError);
      // Continue with deletion even if attendance deletion fails
    }

    // Delete session records
    const { error: sessionsError } = await supabase
      .from("sessions")
      .delete()
      .eq("member_id", id)
      .eq("user_id", userId);

    if (sessionsError) {
      console.error("Error deleting session records:", sessionsError);
      // Continue with deletion even if sessions deletion fails
    }

    // Delete activity records
    const { error: activitiesError } = await supabase
      .from("activities")
      .delete()
      .eq("member_id", id)
      .eq("user_id", userId);

    if (activitiesError) {
      console.error("Error deleting activity records:", activitiesError);
      // Continue with deletion even if activities deletion fails
    }

    // Delete payment records related to this member
    const { error: paymentsError } = await supabase
      .from("payments")
      .delete()
      .eq("member_id", id)
      .eq("user_id", userId);

    if (paymentsError) {
      console.error("Error deleting payment records:", paymentsError);
      // Continue with deletion even if payments deletion fails
    }

    // Finally, delete the member record
    const { error: memberError } = await supabase
      .from("members")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (memberError) {
      console.error("Error deleting member:", memberError);
      throw memberError;
    }

    console.log(
      `تم حذف العضو ${member.name} وجميع البيانات المرتبطة به نهائياً`,
    );
  } catch (error) {
    console.error("Error deleting member:", error);
    throw error;
  }
};

// Remove attendance for a member (undo attendance)
export const removeAttendance = async (id: string): Promise<Member | null> => {
  try {
    const userId = await requireAuth();
    const member = await getMemberById(id);
    if (!member) return null;

    const today = new Date().toISOString().split("T")[0];

    // Get today's attendance record for this member
    const { data: todayAttendance, error: attendanceError } = await supabase
      .from("attendance")
      .select("*")
      .eq("member_id", id)
      .eq("user_id", userId)
      .eq("attendance_date", today)
      .order("attendance_time", { ascending: false })
      .limit(1);

    if (attendanceError) {
      console.error("Error fetching attendance:", attendanceError);
      throw attendanceError;
    }

    if (!todayAttendance || todayAttendance.length === 0) {
      throw new Error("لا يوجد حضور مسجل اليوم لهذا العضو");
    }

    const attendanceRecord = todayAttendance[0];
    let newSessionsRemaining = member.sessionsRemaining || 0;

    // If this was a regular session, calculate the new remaining sessions
    if (
      attendanceRecord.session_type === "regular" &&
      member.subscriptionType
    ) {
      newSessionsRemaining = (member.sessionsRemaining || 0) + 1;
    }

    // Delete the attendance record (this will trigger the database function to restore the session)
    const { error: deleteError } = await supabase
      .from("attendance")
      .delete()
      .eq("id", attendanceRecord.id);

    if (deleteError) {
      console.error("Error deleting attendance:", deleteError);
      throw deleteError;
    }

    // Update member's sessions remaining
    const { data: updatedMember, error: memberError } = await supabase
      .from("members")
      .update({
        sessions_remaining: newSessionsRemaining,
      })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (memberError) {
      console.error("Error updating member:", memberError);
      throw memberError;
    }

    const savedMember = mapMemberFromDB(updatedMember);

    console.log("تم إلغاء الحضور:", {
      memberId: savedMember.id,
      deletedAttendanceId: attendanceRecord.id,
      sessionsRemaining: savedMember.sessionsRemaining,
    });

    // Add activity for attendance removal
    await addActivity({
      memberId: member.id,
      memberName: member.name,
      memberImage: member.imageUrl,
      activityType: "other",
      timestamp: new Date().toISOString(),
      details: member.subscriptionType
        ? `إلغاء حضور - متبقي ${formatNumber(savedMember.sessionsRemaining || 0)} حصة`
        : `إلغاء حضور`,
    });

    return savedMember;
  } catch (error) {
    console.error("Error removing attendance:", error);
    throw error;
  }
};

// Mark attendance for a member
export const markAttendance = async (id: string): Promise<Member | null> => {
  try {
    const userId = await requireAuth();
    const member = await getMemberById(id);
    if (!member) return null;

    const today = new Date().toISOString().split("T")[0];

    // Check if attendance was already marked today
    const { data: existingAttendance, error: checkError } = await supabase
      .from("attendance")
      .select("id")
      .eq("member_id", id)
      .eq("user_id", userId)
      .eq("attendance_date", today)
      .limit(1);

    if (checkError) {
      console.error("Error checking existing attendance:", checkError);
      throw checkError;
    }

    if (existingAttendance && existingAttendance.length > 0) {
      throw new Error("لا يمكن تسجيل حصتين في يوم واحد");
    }

    // Get active session for this member
    const { data: activeSessions, error: sessionError } = await supabase
      .from("sessions")
      .select("*")
      .eq("member_id", id)
      .eq("user_id", userId)
      .eq("status", "active")
      .gt("remaining_sessions", 0)
      .order("created_at", { ascending: false })
      .limit(1);

    if (sessionError) {
      console.error("Error fetching sessions:", sessionError);
      throw sessionError;
    }

    let activeSession = activeSessions?.[0];
    let newSessionsRemaining = member.sessionsRemaining || 0;

    // Check if member has an active session with remaining sessions
    if (member.subscriptionType && activeSession) {
      if (activeSession.remaining_sessions <= 0) {
        throw new Error("لا توجد حصص متبقية لهذا العضو");
      }

      // The session will be updated automatically by the database trigger
      // when we insert the attendance record
      newSessionsRemaining = activeSession.remaining_sessions - 1;
    }

    const attendanceTime = new Date();
    const attendanceDate = attendanceTime.toISOString().split("T")[0];

    // Create attendance record
    const { data: attendanceData, error: attendanceError } = await supabase
      .from("attendance")
      .insert({
        user_id: userId,
        member_id: id,
        member_name: member.name,
        member_image: member.imageUrl,
        attendance_date: attendanceDate,
        attendance_time: attendanceTime.toISOString(),
        session_type: activeSession ? "regular" : "single_session",
        notes: activeSession
          ? `حضور عادي - متبقي ${newSessionsRemaining} حصة`
          : "حضور بدون اشتراك",
      })
      .select()
      .single();

    if (attendanceError) {
      console.error("Error creating attendance:", attendanceError);
      throw attendanceError;
    }

    // Update member's last attendance and sessions remaining
    const { data: updatedMember, error: memberError } = await supabase
      .from("members")
      .update({
        last_attendance: attendanceDate,
        sessions_remaining: newSessionsRemaining,
      })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (memberError) {
      console.error("Error updating member:", memberError);
      throw memberError;
    }

    const savedMember = mapMemberFromDB(updatedMember);

    console.log("تم تسجيل الحضور:", {
      memberId: savedMember.id,
      attendanceId: attendanceData.id,
      sessionsRemaining: savedMember.sessionsRemaining,
      attendanceTime: attendanceTime.toISOString(),
    });

    // Add check-in activity
    await addActivity({
      memberId: member.id,
      memberName: member.name,
      memberImage: member.imageUrl,
      activityType: "check-in",
      timestamp: attendanceTime.toISOString(),
      details: activeSession
        ? `تسجيل حضور - متبقي ${formatNumber(newSessionsRemaining)} حصة`
        : `تسجيل حضور`,
    });

    return savedMember;
  } catch (error) {
    console.error("Error marking attendance:", error);
    throw error;
  }
};

// Search members by name
export const searchMembersByName = async (query: string): Promise<Member[]> => {
  const allMembers = await getAllMembers();
  return allMembers.filter((member) =>
    member.name.toLowerCase().includes(query.toLowerCase()),
  );
};

// Filter members by status
export const filterMembersByStatus = async (
  status: string | null,
): Promise<Member[]> => {
  const allMembers = await getAllMembers();
  if (!status) return allMembers;

  return allMembers.filter((member) => member.membershipStatus === status);
};

// Search and filter combined
export const searchAndFilterMembers = async (
  query: string,
  status: string | null,
): Promise<Member[]> => {
  const allMembers = await getAllMembers();
  return allMembers.filter((member) => {
    const matchesSearch = member.name
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchesFilter = status ? member.membershipStatus === status : true;
    return matchesSearch && matchesFilter;
  });
};

// Session management functions
export interface SessionData {
  id?: string;
  user_id?: string;
  member_id: string;
  member_name: string;
  subscription_type: string;
  total_sessions: number;
  used_sessions: number;
  remaining_sessions: number;
  start_date: string;
  end_date?: string;
  status: "active" | "expired" | "completed";
  price?: number;
  payment_status: "paid" | "unpaid" | "partial";
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// Create a new session for a member
export const createMemberSession = async (
  sessionData: Omit<
    SessionData,
    "id" | "user_id" | "created_at" | "updated_at"
  >,
): Promise<SessionData> => {
  try {
    const userId = await requireAuth();
    const { data, error } = await supabase
      .from("sessions")
      .insert({
        user_id: userId,
        member_id: sessionData.member_id,
        member_name: sessionData.member_name,
        subscription_type: sessionData.subscription_type,
        total_sessions: sessionData.total_sessions,
        used_sessions: sessionData.used_sessions,
        remaining_sessions: sessionData.remaining_sessions,
        start_date: sessionData.start_date,
        end_date: sessionData.end_date,
        status: sessionData.status,
        price: sessionData.price,
        payment_status: sessionData.payment_status,
        notes: sessionData.notes,
      })
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      user_id: data.user_id,
      member_id: data.member_id,
      member_name: data.member_name,
      subscription_type: data.subscription_type,
      total_sessions: data.total_sessions,
      used_sessions: data.used_sessions,
      remaining_sessions: data.remaining_sessions,
      start_date: data.start_date,
      end_date: data.end_date,
      status: data.status,
      price: data.price,
      payment_status: data.payment_status,
      notes: data.notes,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  } catch (error) {
    console.error("Error creating session:", error);
    throw error;
  }
};

// Get active sessions for a member
export const getMemberActiveSessions = async (
  memberId: string,
): Promise<SessionData[]> => {
  try {
    const userId = await requireAuth();
    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .eq("member_id", memberId)
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data
      ? data.map((session) => ({
          id: session.id,
          user_id: session.user_id,
          member_id: session.member_id,
          member_name: session.member_name,
          subscription_type: session.subscription_type,
          total_sessions: session.total_sessions,
          used_sessions: session.used_sessions,
          remaining_sessions: session.remaining_sessions,
          start_date: session.start_date,
          end_date: session.end_date,
          status: session.status,
          price: session.price,
          payment_status: session.payment_status,
          notes: session.notes,
          created_at: session.created_at,
          updated_at: session.updated_at,
        }))
      : [];
  } catch (error) {
    console.error("Error fetching member sessions:", error);
    return [];
  }
};

// Get today's attendance records
export const getTodayAttendance = async (): Promise<{
  regularMembers: Array<{
    member: Member;
    attendance: {
      id: string;
      attendance_time: string;
      session_type: string;
      notes?: string;
    };
  }>;
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
}> => {
  try {
    const userId = await requireAuth();
    const today = new Date().toISOString().split("T")[0];

    // Get today's attendance records
    const { data: attendanceData, error: attendanceError } = await supabase
      .from("attendance")
      .select("*")
      .eq("user_id", userId)
      .eq("attendance_date", today)
      .order("attendance_time", { ascending: false });

    if (attendanceError) throw attendanceError;

    // Get all members to match with attendance
    const members = await getAllMembers();
    const memberMap = new Map(members.map((m) => [m.id, m]));

    // Process regular member attendance
    const regularMembers = (attendanceData || [])
      .filter((att) => att.session_type === "regular")
      .map((att) => {
        const member = memberMap.get(att.member_id);
        if (!member) return null;
        return {
          member,
          attendance: {
            id: att.id,
            attendance_time: att.attendance_time,
            session_type: att.session_type,
            notes: att.notes,
          },
        };
      })
      .filter(Boolean) as Array<{
      member: Member;
      attendance: {
        id: string;
        attendance_time: string;
        session_type: string;
        notes?: string;
      };
    }>;

    // Get today's single session payments from payments table
    const { getAllPayments } = await import("./paymentService");
    const payments = await getAllPayments();
    const todaySessionPayments = payments
      .filter(
        (payment) =>
          payment.subscriptionType === "حصة واحدة" &&
          payment.date &&
          payment.date.split("T")[0] === today,
      )
      .map((payment, index) => ({
        id: payment.id || `session-${index}`,
        name:
          payment.notes?.split(" - ")[1]?.split(" (")[0] || `زائر ${index + 1}`,
        phoneNumber: payment.notes?.match(/\(([^)]+)\)/)?.[1] || "",
        amount: payment.amount,
        time: payment.date,
        paymentMethod: payment.paymentMethod || "نقدي",
      }));

    // Get today's non-subscribed customers (only those who visited today)
    const { data: nonSubscribedData, error: nonSubscribedError } =
      await supabase
        .from("non_subscribed_customers")
        .select("*")
        .eq("user_id", userId)
        .eq("last_visit_date", today)
        .order("updated_at", { ascending: false });

    if (nonSubscribedError) {
      console.error(
        "Error fetching non-subscribed customers:",
        nonSubscribedError,
      );
    }

    // Group non-subscribed customers by name and phone to avoid duplicates
    const uniqueCustomersMap = new Map();
    (nonSubscribedData || []).forEach((customer) => {
      const key = `${customer.customer_name}-${customer.phone_number || "no-phone"}`;
      if (!uniqueCustomersMap.has(key)) {
        uniqueCustomersMap.set(key, {
          id: customer.id,
          name: customer.customer_name,
          phoneNumber: customer.phone_number,
          totalSessions: customer.total_sessions || 1, // Use actual total_sessions from database
          lastVisitDate: customer.last_visit_date,
        });
      }
    });

    const nonSubscribedCustomers = Array.from(uniqueCustomersMap.values());

    return {
      regularMembers,
      sessionPayments: todaySessionPayments,
      nonSubscribedCustomers,
    };
  } catch (error) {
    console.error("Error fetching today's attendance:", error);
    return {
      regularMembers: [],
      sessionPayments: [],
      nonSubscribedCustomers: [],
    };
  }
};

export interface MemberActivity {
  id?: string;
  user_id?: string;
  memberId: string;
  memberName?: string;
  memberImage?: string;
  activityType: "check-in" | "membership-renewal" | "payment" | "other";
  timestamp: string;
  details: string;
}

// Add an activity
export const addActivity = async (
  activity: MemberActivity,
): Promise<MemberActivity> => {
  try {
    const userId = await requireAuth();
    const { data, error } = await supabase
      .from("activities")
      .insert([
        {
          user_id: userId,
          member_id: activity.memberId,
          member_name: activity.memberName,
          member_image: activity.memberImage,
          activity_type: activity.activityType,
          timestamp: activity.timestamp,
          details: activity.details,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      user_id: data.user_id,
      memberId: data.member_id,
      memberName: data.member_name,
      memberImage: data.member_image,
      activityType: data.activity_type,
      timestamp: data.timestamp,
      details: data.details,
    };
  } catch (error) {
    console.error("Error adding activity:", error);
    throw error;
  }
};

// Get recent activities
export const getRecentActivities = async (
  limit: number = 10,
): Promise<MemberActivity[]> => {
  try {
    const userId = await requireAuth();
    const { data, error } = await supabase
      .from("activities")
      .select("*")
      .eq("user_id", userId)
      .order("timestamp", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data
      ? data.map((activity) => ({
          id: activity.id,
          user_id: activity.user_id,
          memberId: activity.member_id,
          memberName: activity.member_name,
          memberImage: activity.member_image,
          activityType: activity.activity_type,
          timestamp: activity.timestamp,
          details: activity.details,
        }))
      : [];
  } catch (error) {
    console.error("Error fetching activities:", error);
    return [];
  }
};
