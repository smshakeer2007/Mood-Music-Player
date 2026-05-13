import { Router, type IRouter } from "express";
import healthRouter from "./health";
import songsRouter from "./songs";
import moodsRouter from "./moods";
import usersRouter from "./users";
import playlistsRouter from "./playlists";
import moodHistoryRouter from "./mood_history";

const router: IRouter = Router();

router.use(healthRouter);
router.use(songsRouter);
router.use(moodsRouter);
router.use(usersRouter);
router.use(playlistsRouter);
router.use(moodHistoryRouter);

export default router;
