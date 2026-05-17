import { User } from "../models/User.js";
import { FaceRegistrationLog } from "../models/FaceRegistrationLog.js";

export const listFaceRegistrations = async (req, res) => {
  try {
    const students = await User.find({ role: "student" })
      .select("name email rollNo department semester section status face createdAt updatedAt")
      .sort({ rollNo: 1, name: 1 });

    const result = students.map((s) => ({
      _id: s._id,
      name: s.name,
      email: s.email,
      rollNo: s.rollNo,
      department: s.department,
      semester: s.semester,
      section: s.section,
      status: s.status,
      face: {
        hasDescriptor: Array.isArray(s.face?.descriptor) && s.face.descriptor.length > 0,
        registeredAt: s.face?.registeredAt,
        updatedAt: s.face?.updatedAt,
        disabled: Boolean(s.face?.disabled),
        disabledAt: s.face?.disabledAt,
        disabledReason: s.face?.disabledReason,
      },
    }));

    return res.status(200).json(result);
  } catch (error) {
    console.error("[faceAdminController.listFaceRegistrations]", error.message);
    return res.status(500).json({ message: "Failed to load face registrations" });
  }
};

export const resetFaceRegistration = async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await User.findOne({ _id: studentId, role: "student" });
    if (!student) return res.status(404).json({ message: "Student not found" });

    student.face = {
      descriptor: undefined,
      registeredAt: undefined,
      updatedAt: undefined,
      disabled: false,
      disabledAt: undefined,
      disabledReason: undefined,
    };
    await student.save();

    await FaceRegistrationLog.create({
      action: "reset",
      student: student._id,
      actor: req.user?._id,
      actorRole: req.user?.role,
      success: true,
      message: "Face registration reset by admin",
    });

    return res.status(200).json({ message: "Face registration reset" });
  } catch (error) {
    console.error("[faceAdminController.resetFaceRegistration]", error.message);
    return res.status(500).json({ message: "Failed to reset face registration" });
  }
};

export const setFaceRegistrationDisabled = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { disabled, reason } = req.body || {};
    const student = await User.findOne({ _id: studentId, role: "student" });
    if (!student) return res.status(404).json({ message: "Student not found" });

    const disable = Boolean(disabled);
    const now = new Date();

    student.face = student.face || {};
    student.face.disabled = disable;
    student.face.disabledAt = disable ? now : undefined;
    student.face.disabledReason = disable ? String(reason || "").slice(0, 300) : undefined;
    await student.save();

    await FaceRegistrationLog.create({
      action: disable ? "disable" : "enable",
      student: student._id,
      actor: req.user?._id,
      actorRole: req.user?.role,
      success: true,
      message: disable ? "Face registration disabled by admin" : "Face registration enabled by admin",
      meta: disable ? { reason: student.face.disabledReason } : undefined,
    });

    return res.status(200).json({
      message: disable ? "Face registration disabled" : "Face registration enabled",
      disabled: disable,
    });
  } catch (error) {
    console.error("[faceAdminController.setFaceRegistrationDisabled]", error.message);
    return res.status(500).json({ message: "Failed to update face registration status" });
  }
};

export const listFaceRegistrationLogs = async (req, res) => {
  try {
    const { studentId } = req.query;
    const filter = {};
    if (studentId) filter.student = studentId;

    const logs = await FaceRegistrationLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(200)
      .populate("student", "name rollNo email")
      .populate("actor", "name email role");

    return res.status(200).json(
      logs.map((l) => ({
        _id: l._id,
        action: l.action,
        success: l.success,
        message: l.message,
        createdAt: l.createdAt,
        student: l.student,
        actor: l.actor,
        actorRole: l.actorRole,
        meta: l.meta,
      }))
    );
  } catch (error) {
    console.error("[faceAdminController.listFaceRegistrationLogs]", error.message);
    return res.status(500).json({ message: "Failed to load face registration logs" });
  }
};

