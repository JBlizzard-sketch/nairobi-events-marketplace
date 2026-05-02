import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import vendorsRouter from "./vendors";
import eventsRouter from "./events";
import quotesRouter from "./quotes";
import bookingsRouter from "./bookings";
import reviewsRouter from "./reviews";
import notificationsRouter from "./notifications";
import adminRouter from "./admin";
import aiRouter from "./ai";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(vendorsRouter);
router.use(eventsRouter);
router.use(quotesRouter);
router.use(bookingsRouter);
router.use(reviewsRouter);
router.use(notificationsRouter);
router.use(adminRouter);
router.use(aiRouter);

export default router;
