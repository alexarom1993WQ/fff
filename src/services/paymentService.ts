import { supabase, requireAuth } from "@/lib/supabase";
import { Member } from "./memberService";
import { formatNumber, formatDate } from "@/lib/utils";

export interface Payment {
  id: string;
  user_id?: string;
  memberId: string;
  amount: number;
  date: string;
  subscriptionType: string;
  paymentMethod: "cash" | "card" | "transfer";
  notes?: string;
  status?: "completed" | "pending" | "cancelled";
  invoiceNumber?: string;
  receiptUrl?: string;
}

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

// Get all payments
export const getAllPayments = async (): Promise<Payment[]> => {
  try {
    const userId = await requireAuth();
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false });

    if (error) throw error;
    return data
      ? data.map((payment) => ({
          id: payment.id,
          user_id: payment.user_id,
          memberId: payment.member_id,
          amount: payment.amount,
          date: payment.date,
          subscriptionType: payment.subscription_type,
          paymentMethod: payment.payment_method,
          notes: payment.notes,
          status: payment.status,
          invoiceNumber: payment.invoice_number,
          receiptUrl: payment.receipt_url,
        }))
      : [];
  } catch (error) {
    console.error("Error fetching payments:", error);
    return [];
  }
};

// Get payments by member ID
export const getPaymentsByMemberId = async (
  memberId: string,
): Promise<Payment[]> => {
  const allPayments = await getAllPayments();
  return allPayments.filter((payment) => payment.memberId === memberId);
};

// Get a payment by ID
export const getPaymentById = async (id: string): Promise<Payment | null> => {
  try {
    const userId = await requireAuth();
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error) throw error;
    return data
      ? {
          id: data.id,
          user_id: data.user_id,
          memberId: data.member_id,
          amount: data.amount,
          date: data.date,
          subscriptionType: data.subscription_type,
          paymentMethod: data.payment_method,
          notes: data.notes,
          status: data.status,
          invoiceNumber: data.invoice_number,
          receiptUrl: data.receipt_url,
        }
      : null;
  } catch (error) {
    console.error("Error fetching payment:", error);
    return null;
  }
};

// Add a new payment
export const addPayment = async (
  payment: Omit<Payment, "id">,
): Promise<Payment> => {
  try {
    const userId = await requireAuth();
    const invoiceNumber = `INV-${Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0")}`;

    const { data, error } = await supabase
      .from("payments")
      .insert([
        {
          user_id: userId,
          member_id: payment.memberId,
          amount: payment.amount,
          date: payment.date || new Date().toISOString(),
          subscription_type: payment.subscriptionType,
          payment_method: payment.paymentMethod,
          notes: payment.notes,
          status: "completed",
          invoice_number: invoiceNumber,
          receipt_url: payment.receiptUrl,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    const newPayment: Payment = {
      id: data.id,
      user_id: data.user_id,
      memberId: data.member_id,
      amount: data.amount,
      date: data.date,
      subscriptionType: data.subscription_type,
      paymentMethod: data.payment_method,
      notes: data.notes,
      status: data.status,
      invoiceNumber: data.invoice_number,
      receiptUrl: data.receipt_url,
    };

    // Import here to avoid circular dependency
    const { getMemberById, addActivity, resetMemberSessions } = await import(
      "./memberService"
    );

    // Add payment activity if we have member info
    if (payment.memberId) {
      const member = await getMemberById(payment.memberId);
      if (member) {
        await addActivity({
          memberId: member.id,
          memberName: member.name,
          memberImage: member.imageUrl,
          activityType: "payment",
          timestamp: new Date().toISOString(),
          details: `دفع ${formatNumber(payment.amount)} - ${payment.subscriptionType}`,
        });

        // Reset member sessions when payment is completed
        await resetMemberSessions(payment.memberId);
      }
    }

    return newPayment;
  } catch (error) {
    console.error("Error adding payment:", error);
    throw error;
  }
};

// Update a payment
export const updatePayment = async (payment: Payment): Promise<Payment> => {
  try {
    const userId = await requireAuth();
    const updatedPayment = {
      ...payment,
      // Preserve original date and invoice number if they exist
      date: payment.date || new Date().toISOString(),
      invoiceNumber:
        payment.invoiceNumber ||
        `INV-${Math.floor(Math.random() * 10000)
          .toString()
          .padStart(4, "0")}`,
      status: payment.status || "completed",
    };

    const { data, error } = await supabase
      .from("payments")
      .update({
        member_id: updatedPayment.memberId,
        amount: updatedPayment.amount,
        date: updatedPayment.date,
        subscription_type: updatedPayment.subscriptionType,
        payment_method: updatedPayment.paymentMethod,
        notes: updatedPayment.notes,
        status: updatedPayment.status,
        invoice_number: updatedPayment.invoiceNumber,
        receipt_url: updatedPayment.receiptUrl,
      })
      .eq("id", payment.id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      user_id: data.user_id,
      memberId: data.member_id,
      amount: data.amount,
      date: data.date,
      subscriptionType: data.subscription_type,
      paymentMethod: data.payment_method,
      notes: data.notes,
      status: data.status,
      invoiceNumber: data.invoice_number,
      receiptUrl: data.receipt_url,
    };
  } catch (error) {
    console.error("Error updating payment:", error);
    throw error;
  }
};

// Add a session payment for unknown members
export const addSessionPayment = async (): Promise<{
  payment: Payment;
  memberId: string;
  customerId?: string;
}> => {
  try {
    const userId = await requireAuth();
    const memberName = "زبون غير مشترك";
    // Use null for member_id since this is not a registered member
    const memberId = null;
    const today = new Date().toISOString().split("T")[0];
    const now = new Date().toISOString();

    console.log("بدء إنشاء حصة واحدة:", {
      userId,
      memberId,
      memberName,
      today,
      now,
    });

    // First, create or update the non-subscribed customer record
    const { data: existingCustomer, error: customerCheckError } = await supabase
      .from("non_subscribed_customers")
      .select("*")
      .eq("user_id", userId)
      .eq("customer_name", memberName)
      .limit(1);

    if (customerCheckError) {
      console.error("خطأ في البحث عن العميل:", customerCheckError);
    }

    let customerId: string;

    if (existingCustomer && existingCustomer.length > 0) {
      // Update existing customer
      const customer = existingCustomer[0];
      const { data: updatedCustomer, error: updateError } = await supabase
        .from("non_subscribed_customers")
        .update({
          total_sessions: customer.total_sessions + 1,
          total_amount_paid: customer.total_amount_paid + 200,
          last_visit_date: today,
          updated_at: now,
        })
        .eq("id", customer.id)
        .select()
        .single();

      if (updateError) {
        console.error("خطأ في تحديث العميل:", updateError);
        throw new Error(`فشل في تحديث بيانات العميل: ${updateError.message}`);
      }

      customerId = updatedCustomer.id;
      console.log("تم تحديث بيانات العميل:", updatedCustomer);
    } else {
      // Create new customer
      const { data: newCustomer, error: createError } = await supabase
        .from("non_subscribed_customers")
        .insert([
          {
            user_id: userId,
            customer_name: memberName,
            total_sessions: 1,
            total_amount_paid: 200,
            last_visit_date: today,
          },
        ])
        .select()
        .single();

      if (createError) {
        console.error("خطأ في إنشاء العميل:", createError);
        throw new Error(`فشل في إنشاء بيانات العميل: ${createError.message}`);
      }

      customerId = newCustomer.id;
      console.log("تم إنشاء عميل جديد:", newCustomer);
    }

    // Create the payment record
    const invoiceNumber = `INV-${Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0")}`;

    const { data: paymentData, error: paymentError } = await supabase
      .from("payments")
      .insert([
        {
          user_id: userId,
          member_id: null, // Use null for non-registered members
          amount: 200, // 200 DZD for a session
          date: now,
          subscription_type: "حصة واحدة",
          payment_method: "cash",
          notes: `دفع حصة واحدة - ${memberName} - معرف العميل: ${customerId}`,
          status: "completed",
          invoice_number: invoiceNumber,
        },
      ])
      .select()
      .single();

    if (paymentError) {
      console.error("خطأ في إنشاء سجل الدفع:", paymentError);
      throw new Error(`فشل في إنشاء سجل الدفع: ${paymentError.message}`);
    }

    console.log("تم إنشاء سجل الدفع بنجاح:", paymentData);

    const newPayment: Payment = {
      id: paymentData.id,
      user_id: paymentData.user_id,
      memberId: paymentData.member_id,
      amount: paymentData.amount,
      date: paymentData.date,
      subscriptionType: paymentData.subscription_type,
      paymentMethod: paymentData.payment_method,
      notes: paymentData.notes,
      status: paymentData.status,
      invoiceNumber: paymentData.invoice_number,
      receiptUrl: paymentData.receipt_url,
    };

    // Add the unknown person to today's attendance
    const { data: attendanceData, error: attendanceError } = await supabase
      .from("attendance")
      .insert([
        {
          user_id: userId,
          member_id: null, // Use null for non-registered members
          member_name: memberName,
          member_image: null,
          attendance_date: today,
          attendance_time: now,
          session_type: "single_session",
          notes: `حصة واحدة مدفوعة - ${formatNumber(200)} دج - معرف العميل: ${customerId}`,
        },
      ])
      .select()
      .single();

    if (attendanceError) {
      console.error("خطأ في إنشاء سجل الحضور:", attendanceError);
      // Don't throw error here, payment was successful
      console.warn("تم إنشاء الدفع ولكن فشل في تسجيل الحضور");
    } else {
      console.log("تم إنشاء سجل الحضور بنجاح:", attendanceData);
    }

    // Import here to avoid circular dependency
    const { addActivity } = await import("./memberService");

    // Add activity for this session payment
    try {
      await addActivity({
        memberId: customerId, // Use customer ID for activities
        memberName,
        activityType: "payment",
        timestamp: now,
        details: `دفع حصة واحدة - ${formatNumber(200)} دج - معرف العميل: ${customerId}`,
      });

      // Add check-in activity only if attendance was created successfully
      if (!attendanceError) {
        await addActivity({
          memberId: customerId, // Use customer ID for activities
          memberName,
          activityType: "check-in",
          timestamp: now,
          details: `تسجيل حضور حصة واحدة - معرف العميل: ${customerId}`,
        });
      }
    } catch (activityError) {
      console.error("خطأ في إضافة الأنشطة:", activityError);
      // Don't throw error, payment and attendance were successful
    }

    console.log("تم إنشاء دفعة حصة واحدة بنجاح:", {
      paymentId: newPayment.id,
      memberId: null,
      customerId,
      memberName,
      amount: 200,
      attendanceCreated: !attendanceError,
      attendanceId: attendanceData?.id,
    });

    return { payment: newPayment, memberId: customerId, customerId };
  } catch (error) {
    console.error("خطأ في إضافة دفعة الحصة:", error);
    throw error;
  }
};

// Delete a payment
export const deletePayment = async (id: string): Promise<void> => {
  try {
    const userId = await requireAuth();
    const { error } = await supabase
      .from("payments")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw error;
  } catch (error) {
    console.error("Error deleting payment:", error);
    throw error;
  }
};

// Calculate subscription price based on type
export const calculateSubscriptionPrice = (
  subscriptionType: string,
): number => {
  if (!subscriptionType || typeof subscriptionType !== "string") {
    return 1000; // Default price
  }

  switch (subscriptionType.trim()) {
    case "شهري":
      return 1500;
    case "13 حصة":
      return 1000;
    case "15 حصة":
      return 1800;
    case "30 حصة":
      return 1800;
    case "حصة واحدة":
      return 200;
    default:
      return 1000;
  }
};

// Get non-subscribed customers statistics
export const getNonSubscribedCustomersStats = async () => {
  try {
    const userId = await requireAuth();
    const { data, error } = await supabase
      .from("non_subscribed_customers")
      .select("*")
      .eq("user_id", userId);

    if (error) throw error;

    const customers = data || [];
    const totalCustomers = customers.length;
    const totalSessions = customers.reduce(
      (sum, customer) => sum + customer.total_sessions,
      0,
    );
    const totalRevenue = customers.reduce(
      (sum, customer) => sum + Number(customer.total_amount_paid),
      0,
    );
    const avgSessionsPerCustomer =
      totalCustomers > 0 ? totalSessions / totalCustomers : 0;

    // Get today's stats
    const today = new Date().toISOString().split("T")[0];
    const todayCustomers = customers.filter(
      (customer) => customer.last_visit_date === today,
    );

    return {
      totalCustomers,
      totalSessions,
      totalRevenue,
      avgSessionsPerCustomer: Math.round(avgSessionsPerCustomer * 100) / 100,
      todayCustomers: todayCustomers.length,
      recentCustomers: customers
        .filter((customer) => customer.last_visit_date)
        .sort(
          (a, b) =>
            new Date(b.last_visit_date!).getTime() -
            new Date(a.last_visit_date!).getTime(),
        )
        .slice(0, 5),
    };
  } catch (error) {
    console.error("Error fetching non-subscribed customers stats:", error);
    return {
      totalCustomers: 0,
      totalSessions: 0,
      totalRevenue: 0,
      avgSessionsPerCustomer: 0,
      todayCustomers: 0,
      recentCustomers: [],
    };
  }
};

// Get payment statistics
export const getPaymentStatistics = async () => {
  const payments = await getAllPayments();

  // Helper function to safely sum amounts
  const safeSum = (paymentList: Payment[]) => {
    return paymentList.reduce((sum, payment) => {
      const amount = Number(payment.amount);
      return sum + (isNaN(amount) || !isFinite(amount) ? 0 : amount);
    }, 0);
  };

  // Calculate today's revenue
  const today = new Date().toISOString().split("T")[0];
  const todayPayments = payments.filter(
    (payment) => payment.date && payment.date.split("T")[0] === today,
  );

  // Calculate this week's revenue
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const weekPayments = payments.filter(
    (payment) => payment.date && new Date(payment.date) >= oneWeekAgo,
  );

  // Calculate this month's revenue
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const monthPayments = payments.filter(
    (payment) => payment.date && new Date(payment.date) >= oneMonthAgo,
  );

  // Get non-subscribed customers stats
  const nonSubscribedStats = await getNonSubscribedCustomersStats();

  // Calculate base revenue from regular payments
  const totalRevenue = safeSum(payments);
  const todayRevenue = safeSum(todayPayments);
  const weekRevenue = safeSum(weekPayments);
  const monthRevenue = safeSum(monthPayments);

  // Add non-subscribed customers revenue to totals
  const totalRevenueWithSessions =
    totalRevenue + nonSubscribedStats.totalRevenue;

  // Calculate today's non-subscribed revenue
  const todayNonSubscribedRevenue = nonSubscribedStats.recentCustomers
    .filter((customer) => customer.last_visit_date === today)
    .reduce(
      (sum, customer) => sum + Number(customer.total_amount_paid || 0),
      0,
    );

  // Calculate this week's non-subscribed revenue
  const weekNonSubscribedRevenue = nonSubscribedStats.recentCustomers
    .filter((customer) => {
      if (!customer.last_visit_date) return false;
      const visitDate = new Date(customer.last_visit_date);
      return visitDate >= oneWeekAgo;
    })
    .reduce(
      (sum, customer) => sum + Number(customer.total_amount_paid || 0),
      0,
    );

  // Calculate this month's non-subscribed revenue
  const monthNonSubscribedRevenue = nonSubscribedStats.recentCustomers
    .filter((customer) => {
      if (!customer.last_visit_date) return false;
      const visitDate = new Date(customer.last_visit_date);
      return visitDate >= oneMonthAgo;
    })
    .reduce(
      (sum, customer) => sum + Number(customer.total_amount_paid || 0),
      0,
    );

  const finalTodayRevenue = todayRevenue + todayNonSubscribedRevenue;
  const finalWeekRevenue = weekRevenue + weekNonSubscribedRevenue;
  const finalMonthRevenue = monthRevenue + monthNonSubscribedRevenue;

  return {
    totalRevenue: totalRevenueWithSessions,
    todayRevenue: finalTodayRevenue,
    weekRevenue: finalWeekRevenue,
    monthRevenue: finalMonthRevenue,
    paymentCount: payments.length + nonSubscribedStats.totalSessions,
    averagePayment:
      payments.length + nonSubscribedStats.totalSessions > 0
        ? totalRevenueWithSessions /
          (payments.length + nonSubscribedStats.totalSessions)
        : 0,
    subscriptionTypeBreakdown: {
      ...payments.reduce((acc: Record<string, number>, payment) => {
        const type = payment.subscriptionType || "غير محدد";
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {}),
      "حصص منفردة": nonSubscribedStats.totalSessions,
    },
    recentPayments: payments
      .filter((payment) => payment.date)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5),
    nonSubscribedStats: {
      ...nonSubscribedStats,
      todayRevenue: todayNonSubscribedRevenue,
      weekRevenue: weekNonSubscribedRevenue,
      monthRevenue: monthNonSubscribedRevenue,
    },
  };
};

// Update payment status based on attendance
export const updatePaymentStatusByAttendance = async (
  memberId: string,
  attendanceDate: string,
): Promise<void> => {
  try {
    // Get all payments for this member
    const memberPayments = await getPaymentsByMemberId(memberId);

    if (memberPayments.length === 0) {
      // If no payments exist for this member, get member info and create a session payment
      const { getMemberById } = await import("./memberService");
      const member = await getMemberById(memberId);

      if (member) {
        // Create a single session payment record
        await addSessionPayment(member.name, member.phoneNumber);
      }
      return;
    }

    // Get the most recent payment
    const latestPayment = memberPayments.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    )[0];

    // Update the payment with attendance information
    const updatedPayment = {
      ...latestPayment,
      lastAttendanceDate: attendanceDate,
      // Add a note about the attendance
      notes: latestPayment.notes
        ? `${latestPayment.notes} | حضور بتاريخ ${formatDate(attendanceDate)}`
        : `حضور بتاريخ ${formatDate(attendanceDate)}`,
    };

    // Save the updated payment
    await updatePayment(updatedPayment);

    // Add an activity for this update
    await addActivity({
      memberId,
      activityType: "check-in",
      timestamp: new Date().toISOString(),
      details: `تم تحديث حالة الدفع بناءً على الحضور`,
    });
  } catch (error) {
    console.error("Error updating payment status based on attendance:", error);
  }
};
