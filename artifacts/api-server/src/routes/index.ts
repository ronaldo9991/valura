import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import portfolioRouter from "./portfolio";
import marketRouter from "./market";
import conversationsRouter from "./conversations";
import aiRouter from "./ai";
import chronosRouter from "./chronos";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(portfolioRouter);
router.use(marketRouter);
router.use(conversationsRouter);
router.use(aiRouter);
router.use(chronosRouter);

export default router;
