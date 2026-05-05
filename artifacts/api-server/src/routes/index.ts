import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import portfolioRouter from "./portfolio";
import portfolioSimulatedRouter from "./portfolio-simulated";
import marketRouter from "./market";
import conversationsRouter from "./conversations";
import aiRouter from "./ai";
import chronosRouter from "./chronos";
import watchlistsRouter from "./watchlists";
import newsRouter from "./news";
import localIdentityRouter from "./local-identity";
import pathfinderInsightRouter from "./pathfinder-insight";

const router: IRouter = Router();

router.use(healthRouter);
router.use(localIdentityRouter);
router.use(pathfinderInsightRouter);
router.use(usersRouter);
router.use(portfolioRouter);
router.use(portfolioSimulatedRouter);
router.use(marketRouter);
router.use(conversationsRouter);
router.use(aiRouter);
router.use(chronosRouter);
router.use(watchlistsRouter);
router.use(newsRouter);

export default router;
