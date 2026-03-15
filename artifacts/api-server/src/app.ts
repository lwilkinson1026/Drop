import express, { type Express } from "express";
import cors from "cors";
import router from "./routes";
import authRouter from "./routes/auth";
import paymentsRouter from "./routes/payments";

const app: Express = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);
app.use("/auth", authRouter);
app.use("/payment-return", (req, res, next) => {
  req.url = "/payment-return" + (req.url === "/" ? "" : req.url);
  paymentsRouter(req, res, next);
});
app.use("/api/payments", paymentsRouter);

export default app;
