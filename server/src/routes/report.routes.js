import express from "express"
const router=express.Router()
import { saveElectricityReport } from "../controllers/aiReports/electricityReports"
import { saveInfrastructureReport } from "../controllers/aiReports/infraReports"
import { saveWasteReport } from "../controllers/aiReports/wasteReports"
import { saveWaterReport } from "../controllers/aiReports/waterReports"
import { saveUncertainReport } from "../controllers/aiReports/uncertainReports"
router.post('/waterReports',saveWaterReport)
router.post('/wasteReports',saveWasteReport)
router.post('/infrastructureReports',saveInfrastructureReport)
router.post('/electricityReports',saveElectricityReport)
router.post('/uncertainReports',saveUncertainReport)
export default router