import React from "react";
import { Camera, Upload, Trash2 } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Member } from "@/services/memberService";

interface MemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: Partial<Member>) => void;
  onDelete?: (id: string) => void;
  member?: Member;
  title: string;
}

const MemberDialog = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  member,
  title,
}: MemberDialogProps) => {
  const [previewImage, setPreviewImage] = React.useState<string>("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);

  const [formData, setFormData] = React.useState<Partial<Member>>({
    name: "",
    membershipStatus: "active",
    lastAttendance: new Date().toISOString().split("T")[0],
    imageUrl: "",
    phoneNumber: "",
    email: "",
    membershipType: "شهري",
    membershipStartDate: new Date().toISOString().split("T")[0],
    membershipEndDate: new Date(new Date().setMonth(new Date().getMonth() + 1))
      .toISOString()
      .split("T")[0],
    subscriptionType: "13 حصة",
    sessionsRemaining: 13,
    subscriptionPrice: 1000,
    paymentStatus: "unpaid",
  });

  React.useEffect(() => {
    if (member) {
      setFormData(member);
      setPreviewImage(member.imageUrl || "");
    } else {
      setFormData({
        name: "",
        membershipStatus: "active",
        lastAttendance: new Date().toISOString().split("T")[0],
        imageUrl: "",
        phoneNumber: "",
        email: "",
        membershipType: "شهري",
        membershipStartDate: new Date().toISOString().split("T")[0],
        membershipEndDate: new Date(
          new Date().setMonth(new Date().getMonth() + 1),
        )
          .toISOString()
          .split("T")[0],
        subscriptionType: "13 حصة",
        sessionsRemaining: 13,
        subscriptionPrice: 1000,
        paymentStatus: "unpaid",
      });
      setPreviewImage("");
    }
  }, [member, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const triggerCameraInput = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        setPreviewImage(imageUrl);
        setFormData((prev) => ({ ...prev, imageUrl }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Generate a random avatar if none provided
    if (!formData.imageUrl) {
      const seed = Math.random().toString(36).substring(2, 8);
      formData.imageUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
    }

    // Check if payment status changed from unpaid/partial to paid
    const paymentStatusChanged =
      member &&
      member.paymentStatus !== "paid" &&
      formData.paymentStatus === "paid";

    // Check if this is a new member with paid status or subscription type changed
    const isNewPaidMember = !member && formData.paymentStatus === "paid";
    const subscriptionTypeChanged =
      member && member.subscriptionType !== formData.subscriptionType;

    // Create payment record if needed
    if (
      formData.subscriptionType &&
      formData.subscriptionPrice &&
      (paymentStatusChanged ||
        isNewPaidMember ||
        (subscriptionTypeChanged && formData.paymentStatus === "paid"))
    ) {
      try {
        // Import payment service dynamically to avoid circular dependency
        const { addPayment } = await import("@/services/paymentService");

        // Use the subscription price from form data
        const amount = formData.subscriptionPrice;

        // Add payment record
        if (amount > 0) {
          await addPayment({
            memberId: member?.id || Date.now().toString(), // Use existing ID or temporary one
            amount,
            date: new Date().toISOString(),
            subscriptionType: formData.subscriptionType,
            paymentMethod: "cash", // Default payment method
            notes: paymentStatusChanged
              ? `تحديث حالة الدفع - ${formData.name}`
              : `اشتراك جديد - ${formData.name}`,
            status: "completed",
          });
        }
      } catch (error) {
        console.error("Error creating payment record:", error);
      }
    }

    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-bluegray-800 text-white border-bluegray-700 max-w-md w-full max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            {title}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div className="flex flex-col items-center mb-3 sm:mb-4">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 mb-2 overflow-hidden rounded-full border-2 border-bluegray-600 bg-bluegray-700">
              {previewImage ? (
                <img
                  src={previewImage}
                  alt="صورة العضو"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  صورة العضو
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mt-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex items-center justify-center gap-1 border-bluegray-600 text-gray-300 hover:bg-bluegray-700 text-xs sm:text-sm py-2 sm:py-1"
                onClick={triggerFileInput}
              >
                <Upload className="h-3 w-3 sm:h-4 sm:w-4" />
                رفع صورة
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex items-center justify-center gap-1 border-bluegray-600 text-gray-300 hover:bg-bluegray-700 text-xs sm:text-sm py-2 sm:py-1"
                onClick={triggerCameraInput}
              >
                <Camera className="h-3 w-3 sm:h-4 sm:w-4" />
                التقاط صورة
              </Button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />

            <input
              type="file"
              ref={cameraInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              capture="environment"
              className="hidden"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="name" className="text-gray-300 text-sm">
                الاسم
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="bg-bluegray-700 border-bluegray-600 text-white h-10 sm:h-auto text-sm sm:text-base"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1 sm:space-y-2">
                <Label
                  htmlFor="membershipStatus"
                  className="text-gray-300 text-sm"
                >
                  حالة العضوية
                </Label>
                <Select
                  value={formData.membershipStatus}
                  onValueChange={(value) =>
                    handleSelectChange("membershipStatus", value)
                  }
                >
                  <SelectTrigger className="bg-bluegray-700 border-bluegray-600 text-white h-10 sm:h-auto text-sm sm:text-base">
                    <SelectValue placeholder="اختر الحالة" />
                  </SelectTrigger>
                  <SelectContent className="bg-bluegray-700 border-bluegray-600 text-white">
                    <SelectItem value="active">نشط</SelectItem>
                    <SelectItem value="pending">معلق</SelectItem>
                    <SelectItem value="expired">منتهي</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1 sm:space-y-2">
                <Label
                  htmlFor="membershipType"
                  className="text-gray-300 text-sm"
                >
                  نوع العضوية
                </Label>
                <Select
                  value={formData.membershipType}
                  onValueChange={(value) =>
                    handleSelectChange("membershipType", value)
                  }
                >
                  <SelectTrigger className="bg-bluegray-700 border-bluegray-600 text-white h-10 sm:h-auto text-sm sm:text-base">
                    <SelectValue placeholder="اختر النوع" />
                  </SelectTrigger>
                  <SelectContent className="bg-bluegray-700 border-bluegray-600 text-white">
                    <SelectItem value="شهري">شهري</SelectItem>
                    <SelectItem value="سنوي">سنوي</SelectItem>
                    <SelectItem value="ربع سنوي">ربع سنوي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1 sm:space-y-2">
                <Label
                  htmlFor="subscriptionType"
                  className="text-gray-300 text-sm"
                >
                  نوع الاشتراك
                </Label>
                <Select
                  value={formData.subscriptionType}
                  onValueChange={(value) => {
                    let price = 1000;
                    let sessions = 13;

                    if (value === "13 حصة") {
                      price = 1000;
                      sessions = 13;
                    } else if (value === "15 حصة") {
                      price = 1800;
                      sessions = 15;
                    } else if (value === "30 حصة") {
                      price = 1800;
                      sessions = 30;
                    }

                    handleSelectChange("subscriptionType", value);
                    handleSelectChange("subscriptionPrice", price.toString());
                    handleSelectChange(
                      "sessionsRemaining",
                      sessions.toString(),
                    );
                  }}
                >
                  <SelectTrigger className="bg-bluegray-700 border-bluegray-600 text-white h-10 sm:h-auto text-sm sm:text-base">
                    <SelectValue placeholder="اختر نوع الاشتراك" />
                  </SelectTrigger>
                  <SelectContent className="bg-bluegray-700 border-bluegray-600 text-white">
                    <SelectItem value="13 حصة">
                      13 حصة - {formatNumber(1000)} دينار
                    </SelectItem>
                    <SelectItem value="15 حصة">
                      15 حصة - {formatNumber(1800)} دينار
                    </SelectItem>
                    <SelectItem value="30 حصة">
                      30 حصة - {formatNumber(1800)} دينار
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1 sm:space-y-2">
                <Label
                  htmlFor="paymentStatus"
                  className="text-gray-300 text-sm"
                >
                  حالة الدفع
                </Label>
                <Select
                  value={formData.paymentStatus}
                  onValueChange={(value) =>
                    handleSelectChange("paymentStatus", value)
                  }
                >
                  <SelectTrigger className="bg-bluegray-700 border-bluegray-600 text-white h-10 sm:h-auto text-sm sm:text-base">
                    <SelectValue placeholder="اختر حالة الدفع" />
                  </SelectTrigger>
                  <SelectContent className="bg-bluegray-700 border-bluegray-600 text-white">
                    <SelectItem value="paid">مدفوع</SelectItem>
                    <SelectItem value="unpaid">غير مدفوع</SelectItem>
                    <SelectItem value="partial">مدفوع جزئياً</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="phoneNumber" className="text-gray-300 text-sm">
                رقم الهاتف
              </Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="bg-bluegray-700 border-bluegray-600 text-white h-10 sm:h-auto text-sm sm:text-base"
              />
            </div>

            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="email" className="text-gray-300 text-sm">
                البريد الإلكتروني
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="bg-bluegray-700 border-bluegray-600 text-white h-10 sm:h-auto text-sm sm:text-base"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1 sm:space-y-2">
                <Label
                  htmlFor="membershipStartDate"
                  className="text-gray-300 text-sm"
                >
                  تاريخ البدء
                </Label>
                <Input
                  id="membershipStartDate"
                  name="membershipStartDate"
                  type="date"
                  value={formData.membershipStartDate}
                  onChange={handleChange}
                  className="bg-bluegray-700 border-bluegray-600 text-white h-10 sm:h-auto text-sm sm:text-base"
                />
              </div>

              <div className="space-y-1 sm:space-y-2">
                <Label
                  htmlFor="membershipEndDate"
                  className="text-gray-300 text-sm"
                >
                  تاريخ الانتهاء
                </Label>
                <Input
                  id="membershipEndDate"
                  name="membershipEndDate"
                  type="date"
                  value={formData.membershipEndDate}
                  onChange={handleChange}
                  className="bg-bluegray-700 border-bluegray-600 text-white h-10 sm:h-auto text-sm sm:text-base"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-3 sm:pt-4 flex flex-col sm:flex-row gap-2 sm:gap-0">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 w-full">
              <div className="flex gap-2 order-2 sm:order-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="border-bluegray-600 text-gray-300 hover:bg-bluegray-700 flex-1 sm:w-auto h-10 text-sm sm:text-base"
                >
                  إلغاء
                </Button>
                {member && onDelete && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (
                        confirm(
                          `هل أنت متأكد من حذف ${member.name} نهائياً؟\n\nسيتم حذف جميع البيانات المرتبطة بهذا العضو:\n- سجلات الحضور\n- الحصص والاشتراكات\n- المدفوعات\n- الأنشطة\n\nهذا الإجراء لا يمكن التراجع عنه!`,
                        )
                      ) {
                        onDelete(member.id);
                        onClose();
                      }
                    }}
                    className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white flex-1 sm:w-auto h-10 text-sm sm:text-base"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    حذف نهائياً
                  </Button>
                )}
              </div>
              <Button
                type="submit"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white w-full sm:w-auto order-1 sm:order-2 h-10 text-sm sm:text-base"
              >
                حفظ
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MemberDialog;
