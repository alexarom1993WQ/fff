import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatNumber } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getAllMembers, Member } from "@/services/memberService";
import {
  addPayment,
  calculateSubscriptionPrice,
  updatePayment,
  Payment,
} from "@/services/paymentService";
import { toast } from "@/components/ui/use-toast";
import { Calendar, CreditCard, Check } from "lucide-react";

interface PaymentFormProps {
  onSuccess?: () => void;
  editingPayment?: Payment | null;
  onCancelEdit?: () => void;
}

const PaymentForm = ({
  onSuccess,
  editingPayment,
  onCancelEdit,
}: PaymentFormProps = {}) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);
  const [subscriptionType, setSubscriptionType] = useState<string>("شهري");
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "card" | "transfer"
  >("cash");
  const [notes, setNotes] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const allMembers = await getAllMembers();
        setMembers(allMembers);
      } catch (error) {
        console.error("Error fetching members:", error);
      }
    };

    fetchMembers();
  }, []);

  useEffect(() => {
    // Update amount based on subscription type
    const price = calculateSubscriptionPrice(subscriptionType);
    setAmount(price);
  }, [subscriptionType]);

  useEffect(() => {
    // Populate form when editing
    if (editingPayment) {
      setSelectedMember(editingPayment.memberId);
      setAmount(editingPayment.amount);
      setSubscriptionType(editingPayment.subscriptionType);
      setPaymentMethod(editingPayment.paymentMethod);
      setNotes(editingPayment.notes || "");
    } else {
      // Reset form when not editing
      setSelectedMember("");
      setAmount(calculateSubscriptionPrice("شهري"));
      setSubscriptionType("شهري");
      setPaymentMethod("cash");
      setNotes("");
    }
  }, [editingPayment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (editingPayment) {
        // Update existing payment
        const updatedPayment = {
          ...editingPayment,
          memberId: selectedMember,
          amount,
          subscriptionType,
          paymentMethod,
          notes,
        };

        await updatePayment(updatedPayment);

        toast({
          title: "تم بنجاح",
          description: "تم تحديث المدفوعات بنجاح",
          variant: "default",
        });
      } else {
        // Add new payment
        const result = await addPayment({
          memberId: selectedMember,
          amount,
          date: new Date().toISOString(),
          subscriptionType,
          paymentMethod,
          notes,
        });

        toast({
          title: "تم بنجاح",
          description: `تم إضافة المدفوعات بنجاح. رقم الفاتورة: ${result.invoiceNumber}`,
          variant: "default",
        });
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error saving payment:", error);
      toast({
        title: "خطأ",
        description: editingPayment
          ? "حدث خطأ أثناء تحديث المدفوعات"
          : "حدث خطأ أثناء إضافة المدفوعات",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-bluegray-700/30 backdrop-blur-md border-bluegray-600 shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {editingPayment ? "تعديل المدفوعات" : "إضافة مدفوعات جديدة"}
        </h2>
        {editingPayment && onCancelEdit && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancelEdit}
            className="bg-bluegray-600/50 border-bluegray-500 text-white hover:bg-bluegray-500"
          >
            إلغاء
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="member" className="text-white">
            اختر العضو
          </Label>
          <Select value={selectedMember} onValueChange={setSelectedMember}>
            <SelectTrigger className="bg-bluegray-600/50 border-bluegray-500 text-white">
              <SelectValue placeholder="اختر العضو" />
            </SelectTrigger>
            <SelectContent className="bg-bluegray-700 border-bluegray-600 text-white">
              {members.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="subscriptionType" className="text-white">
            نوع الاشتراك
          </Label>
          <Select value={subscriptionType} onValueChange={setSubscriptionType}>
            <SelectTrigger className="bg-bluegray-600/50 border-bluegray-500 text-white">
              <SelectValue placeholder="اختر نوع الاشتراك" />
            </SelectTrigger>
            <SelectContent className="bg-bluegray-700 border-bluegray-600 text-white">
              <SelectItem value="شهري">شهري</SelectItem>
              <SelectItem value="13 حصة">13 حصة</SelectItem>
              <SelectItem value="15 حصة">15 حصة</SelectItem>
              <SelectItem value="30 حصة">30 حصة</SelectItem>
              <SelectItem value="حصة واحدة">حصة واحدة</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount" className="text-white">
            المبلغ
          </Label>
          <div className="relative">
            <Input
              id="amount"
              type="number"
              value={amount || 0}
              onChange={(e) => {
                const inputValue = e.target.value;
                if (inputValue === "" || inputValue === null) {
                  setAmount(0);
                  return;
                }
                const value = parseFloat(inputValue);
                if (isNaN(value) || !isFinite(value)) {
                  setAmount(0);
                  return;
                }
                // Ensure the value is within reasonable bounds
                const clampedValue = Math.max(0, Math.min(value, 999999));
                setAmount(Math.round(clampedValue));
              }}
              className="bg-bluegray-600/50 border-bluegray-500 text-white pl-10"
              min="0"
              max="999999"
              step="1"
            />
            <span className="absolute left-3 top-2.5 text-gray-400">DZD</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-white">طريقة الدفع</Label>
          <div className="flex gap-4">
            <Button
              type="button"
              variant={paymentMethod === "cash" ? "default" : "outline"}
              className={`flex-1 ${paymentMethod === "cash" ? "bg-gradient-to-r from-blue-500 to-purple-600" : "bg-bluegray-600/50 border-bluegray-500 text-white"}`}
              onClick={() => setPaymentMethod("cash")}
            >
              <CreditCard className="mr-2 h-4 w-4" /> نقدا
            </Button>
            <Button
              type="button"
              variant={paymentMethod === "card" ? "default" : "outline"}
              className={`flex-1 ${paymentMethod === "card" ? "bg-gradient-to-r from-blue-500 to-purple-600" : "bg-bluegray-600/50 border-bluegray-500 text-white"}`}
              onClick={() => setPaymentMethod("card")}
            >
              <CreditCard className="mr-2 h-4 w-4" /> بطاقة
            </Button>
            <Button
              type="button"
              variant={paymentMethod === "transfer" ? "default" : "outline"}
              className={`flex-1 ${paymentMethod === "transfer" ? "bg-gradient-to-r from-blue-500 to-purple-600" : "bg-bluegray-600/50 border-bluegray-500 text-white"}`}
              onClick={() => setPaymentMethod("transfer")}
            >
              <Calendar className="mr-2 h-4 w-4" /> تحويل
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes" className="text-white">
            ملاحظات
          </Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="bg-bluegray-600/50 border-bluegray-500 text-white"
            placeholder="أي ملاحظات إضافية"
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading || !selectedMember}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all"
        >
          {isLoading
            ? "جاري الحفظ..."
            : editingPayment
              ? "تحديث المدفوعات"
              : "حفظ المدفوعات"}
        </Button>
      </form>
    </Card>
  );
};

export default PaymentForm;
