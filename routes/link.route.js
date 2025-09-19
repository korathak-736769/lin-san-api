import express from "express";
const router = express.Router();
import { validate } from "../middlewares/validation.js";
import { createLinkSchema, shortCodeSchema } from "../validations/link.js"
import { createLink, getHisClickLinks, redirectToLongUrl } from "../controllers/link.controller.js";

router.get("/his/:short_code", getHisClickLinks);
router.post("/", validate(createLinkSchema), createLink);
router.get("/:short_code", validate(shortCodeSchema), redirectToLongUrl);

export default router;
