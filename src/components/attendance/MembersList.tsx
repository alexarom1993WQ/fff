import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatNumber, formatDate } from "@/lib/utils";
import {
  Search,
  Filter,
  Check,
  X,
  Clock,
  Plus,
  Edit,
  Trash2,
  ChevronRight,
  FileText,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import {
  Member,
  getAllMembers,
  markAttendance,
  addMember,
  updateMember,
  deleteMember,
  searchAndFilterMembers,
} from "@/services/memberService";
import { addSessionPayment } from "@/services/paymentService";
import MemberDialog from "./MemberDialog";

import { toast } from "@/components/ui/use-toast";

const MembersList = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [membersLoaded, setMembersLoaded] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isAddSessionDialogOpen, setIsAddSessionDialogOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedMemberForSession, setSelectedMemberForSession] =
    useState<Member | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | undefined>(
    undefined,
  );
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [selectedMemberForNote, setSelectedMemberForNote] =
    useState<Member | null>(null);
  const [noteText, setNoteText] = useState("");

  // Load members from database
  useEffect(() => {
    const loadMembers = async () => {
      try {
        setLoading(true);
        const data = await searchAndFilterMembers(searchQuery, filterStatus);
        setMembers(data);
      } catch (error) {
        console.error("Error loading members:", error);
        toast({
          title: "خطأ",
          description: "حدث خطأ أثناء تحميل بيانات الأعضاء",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadMembers();
  }, [searchQuery, filterStatus]);

  const handleMarkAttendance = async (id: string) => {
    try {
      const updatedMember = await markAttendance(id);
      if (updatedMember) {
        // Update the members list with the updated member data
        setMembers(
          members.map((member) => (member.id === id ? updatedMember : member)),
        );

        let description = `تم تسجيل حضور ${updatedMember.name} بنجاح`;
        if (
          updatedMember.subscriptionType &&
          updatedMember.sessionsRemaining !== undefined
        ) {
          description += ` - متبقي ${formatNumber(updatedMember.sessionsRemaining)} حصة`;
        }

        toast({
          title: "تم تسجيل الحضور",
          description: description,
        });
      }
    } catch (error) {
      console.error("Error marking attendance:", error);
      toast({
        title: "خطأ",
        description:
          error instanceof Error ? error.message : "حدث خطأ أثناء تسجيل الحضور",
        variant: "destructive",
      });
    }
  };

  const handleAddMember = async (memberData: Partial<Member>) => {
    try {
      const newMember = await addMember(memberData as Omit<Member, "id">);
      setMembers([...members, newMember]);
      setIsAddDialogOpen(false);
      toast({
        title: "تمت الإضافة",
        description: `تم إضافة ${newMember.name} بنجاح`,
      });
    } catch (error) {
      console.error("Error adding member:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إضافة العضو",
        variant: "destructive",
      });
    }
  };

  const handleEditMember = async (memberData: Partial<Member>) => {
    if (!selectedMember) return;

    try {
      const updatedMember = await updateMember({
        ...selectedMember,
        ...memberData,
      });

      setMembers(
        members.map((member) =>
          member.id === updatedMember.id ? updatedMember : member,
        ),
      );

      setIsEditDialogOpen(false);
      setSelectedMember(undefined);

      toast({
        title: "تم التحديث",
        description: `تم تحديث بيانات ${updatedMember.name} بنجاح`,
      });
    } catch (error) {
      console.error("Error updating member:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث بيانات العضو",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMember = async (id: string) => {
    const memberToDelete = members.find((m) => m.id === id);
    const memberName = memberToDelete?.name || "العضو";

    if (
      !confirm(
        `هل أنت متأكد من حذف ${memberName} نهائياً؟\n\nسيتم حذف جميع البيانات المرتبطة بهذا العضو:\n- سجلات الحضور\n- الحصص والاشتراكات\n- المدفوعات\n- الأنشطة\n\nهذا الإجراء لا يمكن التراجع عنه!`,
      )
    )
      return;

    try {
      await deleteMember(id);
      setMembers(members.filter((member) => member.id !== id));
      toast({
        title: "تم الحذف نهائياً",
        description: `تم حذف ${memberName} وجميع البيانات المرتبطة به بنجاح`,
      });
    } catch (error) {
      console.error("Error deleting member:", error);
      const errorMessage =
        error instanceof Error ? error.message : "حدث خطأ أثناء حذف العضو";
      toast({
        title: "خطأ في الحذف",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleOpenEditDialog = (member: Member) => {
    setSelectedMember(member);
    setIsEditDialogOpen(true);
  };

  const handleOpenNoteDialog = (member: Member) => {
    setSelectedMemberForNote(member);
    setNoteText(member.note || "");
    setIsNoteDialogOpen(true);
  };

  const handleSaveNote = async () => {
    if (!selectedMemberForNote) return;

    try {
      const updatedMember = await updateMember({
        ...selectedMemberForNote,
        note: noteText,
      });

      setMembers(
        members.map((member) =>
          member.id === updatedMember.id ? updatedMember : member,
        ),
      );

      setIsNoteDialogOpen(false);
      setSelectedMemberForNote(null);
      setNoteText("");

      toast({
        title: "تم الحفظ",
        description: `تم حفظ الملاحظة لـ ${updatedMember.name} بنجاح`,
      });
    } catch (error) {
      console.error("Error saving note:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ الملاحظة",
        variant: "destructive",
      });
    }
  };

  const handleAddSession = async () => {
    try {
      console.log("بدء تسجيل حصة واحدة...");

      // Call addSessionPayment for unknown member
      const { payment, memberId, customerId } = await addSessionPayment();

      console.log("تم إنشاء الحصة بنجاح:", { payment, memberId, customerId });

      toast({
        title: "تم بنجاح",
        description: `تم تسجيل حصة واحدة للزبون غير المشترك - ${formatNumber(200)} دج\nتم إضافة الحضور إلى إجمالي الحضور\nتم إضافة الدفعة إلى المدفوعات`,
      });

      // Refresh the members list to update statistics
      try {
        const data = await searchAndFilterMembers(searchQuery, filterStatus);
        setMembers(data);
        console.log("تم تحديث قائمة الأعضاء");
      } catch (refreshError) {
        console.error("خطأ في تحديث القائمة:", refreshError);
        // Don't show error for refresh failure
      }
    } catch (error) {
      console.error("خطأ في إضافة الحصة:", error);
      const errorMessage =
        error instanceof Error ? error.message : "حدث خطأ أثناء تسجيل الحصة";
      toast({
        title: "خطأ في التسجيل",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      // Always close dialog regardless of success or failure
      setIsAddSessionDialogOpen(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-gradient-to-r from-green-500 to-emerald-500";
      case "expired":
        return "bg-gradient-to-r from-red-500 to-rose-500";
      case "pending":
        return "bg-gradient-to-r from-yellow-500 to-amber-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "نشط";
      case "expired":
        return "منتهي";
      case "pending":
        return "معلق";
      default:
        return status;
    }
  };

  return (
    <div className="bg-gradient-to-br from-bluegray-800 to-bluegray-900 p-6 rounded-xl w-full text-white relative">
      {/* Mobile Filter Sidebar */}
      <div
        className={`fixed top-0 bottom-0 left-0 w-64 bg-bluegray-800 shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:hidden`}
      >
        <div className="p-4 flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-white">تصفية</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(false)}
            >
              <ChevronRight className="h-5 w-5 text-white" />
            </Button>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              variant="outline"
              className={`flex items-center justify-start gap-2 backdrop-blur-sm bg-bluegray-700/50 border-bluegray-600 hover:bg-bluegray-600 text-white ${filterStatus === null ? "bg-bluegray-600" : ""}`}
              onClick={() => {
                setFilterStatus(null);
                setIsSidebarOpen(false);
              }}
            >
              <Filter className="h-4 w-4" />
              الكل
            </Button>
            <Button
              variant="outline"
              className={`flex items-center justify-start gap-2 backdrop-blur-sm bg-bluegray-700/50 border-bluegray-600 hover:bg-bluegray-600 text-white ${filterStatus === "active" ? "bg-bluegray-600" : ""}`}
              onClick={() => {
                setFilterStatus("active");
                setIsSidebarOpen(false);
              }}
            >
              <Check className="h-4 w-4 text-green-500" />
              نشط
            </Button>
            <Button
              variant="outline"
              className={`flex items-center justify-start gap-2 backdrop-blur-sm bg-bluegray-700/50 border-bluegray-600 hover:bg-bluegray-600 text-white ${filterStatus === "expired" ? "bg-bluegray-600" : ""}`}
              onClick={() => {
                setFilterStatus("expired");
                setIsSidebarOpen(false);
              }}
            >
              <X className="h-4 w-4 text-red-500" />
              منتهي
            </Button>
            <Button
              variant="outline"
              className={`flex items-center justify-start gap-2 backdrop-blur-sm bg-bluegray-700/50 border-bluegray-600 hover:bg-bluegray-600 text-white ${filterStatus === "pending" ? "bg-bluegray-600" : ""}`}
              onClick={() => {
                setFilterStatus("pending");
                setIsSidebarOpen(false);
              }}
            >
              <Clock className="h-4 w-4 text-yellow-500" />
              معلق
            </Button>
          </div>
        </div>
      </div>

      {/* Overlay when sidebar is open */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex flex-col gap-4 mb-6">
        {/* Title */}
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent text-center md:text-right">
          قائمة الأعضاء
        </h2>

        {/* Search and Filters Row */}
        <div className="flex flex-col sm:flex-row gap-4 w-full">
          {/* Search input - visible on all devices */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="بحث عن عضو..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 bg-bluegray-700/50 backdrop-blur-sm border-bluegray-600 focus:border-blue-500 text-white"
            />
          </div>

          {/* Mobile navigation buttons */}
          <div className="md:hidden fixed top-0 left-0 right-0 m-2 z-10 flex justify-center">
            <Button
              variant="outline"
              className="flex items-center gap-2 backdrop-blur-sm bg-bluegray-700/50 border-bluegray-600 hover:bg-bluegray-600 text-white"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Filter className="h-4 w-4" />
              تصفية
            </Button>
          </div>

          {/* Desktop filters - hidden on mobile */}
          <div className="hidden md:flex gap-2 overflow-x-auto pb-2 sm:pb-0">
            <Button
              variant="outline"
              className={`flex items-center gap-2 backdrop-blur-sm bg-bluegray-700/50 border-bluegray-600 hover:bg-bluegray-600 text-white ${filterStatus === null ? "bg-bluegray-600" : ""}`}
              onClick={() => setFilterStatus(null)}
            >
              <Filter className="h-4 w-4" />
              الكل
            </Button>
            <Button
              variant="outline"
              className={`flex items-center gap-2 backdrop-blur-sm bg-bluegray-700/50 border-bluegray-600 hover:bg-bluegray-600 text-white ${filterStatus === "active" ? "bg-bluegray-600" : ""}`}
              onClick={() => setFilterStatus("active")}
            >
              <Check className="h-4 w-4 text-green-500" />
              نشط
            </Button>
            <Button
              variant="outline"
              className={`flex items-center gap-2 backdrop-blur-sm bg-bluegray-700/50 border-bluegray-600 hover:bg-bluegray-600 text-white ${filterStatus === "expired" ? "bg-bluegray-600" : ""}`}
              onClick={() => setFilterStatus("expired")}
            >
              <X className="h-4 w-4 text-red-500" />
              منتهي
            </Button>
            <Button
              variant="outline"
              className={`flex items-center gap-2 backdrop-blur-sm bg-bluegray-700/50 border-bluegray-600 hover:bg-bluegray-600 text-white ${filterStatus === "pending" ? "bg-bluegray-600" : ""}`}
              onClick={() => setFilterStatus("pending")}
            >
              <Clock className="h-4 w-4 text-yellow-500" />
              معلق
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              إضافة عضو
            </Button>

            <Button
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
              onClick={() => setIsAddSessionDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              إضافة حصة
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-10 sm:py-20">
          <div className="w-10 h-10 sm:w-16 sm:h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {members.map((member) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              whileHover={{ scale: 1.02 }}
            >
              <Card className="overflow-hidden backdrop-blur-md bg-bluegray-700/50 border-bluegray-600 shadow-md hover:shadow-lg transition-all w-full">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <Avatar className="h-12 w-12 sm:h-16 sm:w-16 border-2 border-bluegray-600 shadow-md">
                      <AvatarImage src={member.imageUrl} alt={member.name} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-semibold">
                        {member.name.substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <Badge
                      className={`${getStatusColor(member.membershipStatus)} text-white text-xs px-2 py-1`}
                    >
                      {getStatusText(member.membershipStatus)}
                    </Badge>
                  </div>

                  <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2 text-white truncate">
                    {member.name}
                  </h3>
                  <div className="space-y-2">
                    <p className="text-xs sm:text-sm text-gray-300">
                      آخر حضور: {formatDate(member.lastAttendance)}
                    </p>
                    {member.subscriptionType &&
                      member.sessionsRemaining !== undefined && (
                        <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs">
                          {formatNumber(member.sessionsRemaining)} /{" "}
                          {member.subscriptionType.split(" ")[0]} حصة
                        </Badge>
                      )}
                  </div>

                  {member.membershipType && (
                    <p className="text-xs text-gray-400 mb-2 sm:mb-4">
                      نوع العضوية: {member.membershipType}
                    </p>
                  )}

                  <div className="flex flex-col gap-2 mt-3">
                    <Button
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-sm py-2.5 font-medium"
                      onClick={() => handleMarkAttendance(member.id)}
                    >
                      تسجيل حضور
                    </Button>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-9 border-bluegray-600 hover:bg-bluegray-600 text-blue-400 text-xs"
                        onClick={() => handleOpenEditDialog(member)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        تعديل
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-9 border-bluegray-600 hover:bg-bluegray-600 text-yellow-400 text-xs"
                        onClick={() => handleOpenNoteDialog(member)}
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        ملاحظة
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {!loading && members.length === 0 && (
        <div className="text-center py-12 bg-bluegray-700/30 backdrop-blur-md rounded-lg">
          <p className="text-gray-300">لا يوجد أعضاء مطابقين لمعايير البحث</p>
        </div>
      )}

      {/* Add Member Dialog */}
      <MemberDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSave={handleAddMember}
        title="إضافة عضو جديد"
      />

      {/* Edit Member Dialog */}
      <MemberDialog
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setSelectedMember(undefined);
        }}
        onSave={handleEditMember}
        onDelete={handleDeleteMember}
        member={selectedMember}
        title="تعديل بيانات العضو"
      />

      {/* Add Session Confirmation Dialog */}
      <Dialog
        open={isAddSessionDialogOpen}
        onOpenChange={setIsAddSessionDialogOpen}
      >
        <DialogContent className="bg-bluegray-800 text-white border-bluegray-700 max-w-sm w-full">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-center bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              تأكيد إضافة حصة
            </DialogTitle>
          </DialogHeader>

          <div className="text-center py-4">
            <p className="text-white mb-4">
              إضافة حصة واحدة بقيمة {formatNumber(200)} دج؟
            </p>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddSessionDialogOpen(false)}
              className="flex-1 border-bluegray-600 text-gray-300 hover:bg-bluegray-700"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleAddSession}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
            >
              تأكيد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Note Dialog */}
      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent className="bg-bluegray-800 text-white border-bluegray-700 max-w-md w-full">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              ملاحظة - {selectedMemberForNote?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="note" className="text-gray-300 mb-2 block">
                الملاحظة
              </Label>
              <Textarea
                id="note"
                placeholder="اكتب ملاحظة عن العضو..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="bg-bluegray-700/50 border-bluegray-600 text-white placeholder:text-gray-400 focus:border-yellow-500 min-h-[120px]"
                rows={5}
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsNoteDialogOpen(false);
                setSelectedMemberForNote(null);
                setNoteText("");
              }}
              className="border-bluegray-600 text-gray-300 hover:bg-bluegray-700"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSaveNote}
              className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white"
            >
              حفظ الملاحظة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MembersList;
