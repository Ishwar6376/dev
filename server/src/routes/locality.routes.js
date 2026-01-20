import express from "express"
const router=express.Router();
import {electricityCheck} from "../controllers/localityCheck/electrictiyCheck"
import { wasteCheck } from "../controllers/localityCheck/wasteCheck";
import { waterCheck } from "../controllers/localityCheck/waterCheck";
import { infraCheck } from "../controllers/localityCheck/infraCheck";
router.post('/waterCheck',waterCheck)
router.post('/wasteCheck',wasteCheck)
router.post('/infraCheck',infraCheck)
router.post('/electricityCheck',electricityCheck)
export default router
