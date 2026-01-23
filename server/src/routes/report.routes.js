import express from "express"
const router=express.Router()
import { saveElectricityReport } from "../controllers/aiReports/electricityReports.js"
import { saveInfrastructureReport } from "../controllers/aiReports/infraReports.js"
import { saveWasteReport } from "../controllers/aiReports/wasteReports.js"
import { saveWaterReport } from "../controllers/aiReports/waterReports.js"
import { saveUncertainReport } from "../controllers/aiReports/uncertainReports.js"
router.post('/waterReports',saveWaterReport)
router.post('/wasteReports',saveWasteReport)
router.post('/infrastructureReports',saveInfrastructureReport)
router.post('/electricityReports',saveElectricityReport)
router.post('/uncertainReports',saveUncertainReport)
export default router