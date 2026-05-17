import {
  requestMlRetrain,
  getMlTrainingStatus,
  mapMlTrainError,
} from "../utils/mlTrainClient.js";

/** POST /api/admin/ml/retrain — trigger Flask training from MongoDB */
export const retrainAttendanceModel = async (req, res) => {
  try {
    const force = req.body?.force !== false;
    const auto = Boolean(req.body?.auto);

    console.info("[mlAdmin.retrain] force=%s auto=%s", force, auto);
    const result = await requestMlRetrain({ force, auto });

    return res.json({
      success: Boolean(result.trained),
      ...result,
    });
  } catch (error) {
    const mapped = mapMlTrainError(error);
    console.error("[mlAdmin.retrain]", mapped.message);
    return res.status(mapped.status).json({
      success: false,
      message: mapped.message,
      details: mapped.data,
    });
  }
};

/** GET /api/admin/ml/training-status */
export const mlTrainingStatus = async (req, res) => {
  try {
    const status = await getMlTrainingStatus();
    return res.json(status);
  } catch (error) {
    const mapped = mapMlTrainError(error);
    console.error("[mlAdmin.trainingStatus]", mapped.message);
    return res.status(mapped.status).json({
      success: false,
      message: mapped.message,
    });
  }
};
