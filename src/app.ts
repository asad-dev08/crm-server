import cors from "cors";
import express, { Application, NextFunction, Request, Response } from "express";
import ip from "ip";
import { Code } from "./enum/code.enum";
import { HttpResponse } from "./domain/response";
import { Status } from "./enum/status.enum";
import userRoutes from "./routes/user.route";
import authMiddleware from "./middleware/auth";
import userLoginRoutes from "./routes/user.login.route";
import userPaginationRoutes from "./routes/user-pagination.route";
import verifyToken from "./middleware/verify-token";
import menuRoutes from "./routes/menu.route";
import securityRuleRoutes from "./routes/security-rule.route";
import securityGroupRoutes from "./routes/security-group.route";
import logger from "./middleware/logger";
import auditMiddleware from "./middleware/audit-log-middleware";
import companyRoutes from "./routes/company.route";
import eventCalendarRoutes from "./routes/event-calendar.route";
import boardRoutes from "./routes/task-management.route";
import emailTemplateRoutes from "./routes/email-template.route";
import leadSourceRoutes from "./routes/lead-source.route";
import leadStatusRoutes from "./routes/lead-status.route";
import leadRoutes from "./routes/lead.route";
import customerRoutes from "./routes/customer.route";
import currencyRoutes from "./routes/currency.route";
import customerTypeRoutes from "./routes/customer-type.route";
import mediumRoutes from "./routes/payment-medium.route";
import taxRateRoutes from "./routes/tax-rate.route";
import expenseCategoryRoutes from "./routes/expense-category.route";
import campaignRoutes from "./routes/campaign.route";
import formRoutes from "./routes/campaign-form.route";
import audienceRoutes from "./routes/campaign-audience.route";
import typeRoutes from "./routes/campaign-type.route";
import statusRoutes from "./routes/campaign-status.route";

export class App {
  private readonly app: Application;
  private readonly APPLICATION_RUNNING = "application is running on:";
  private readonly ROUTE_NOT_FOUND = "Route does not exists on the server";

  constructor(
    private readonly port: string | number = process.env.SERVER_PORT || 4000
  ) {
    this.app = express();
    this.app.use(express.json({ limit: "100mb" }));
    this.middleWare();
    this.routes();
  }

  listen(): void {
    this.app.listen(this.port);
    console.info(`${this.APPLICATION_RUNNING} ${ip.address()}: ${this.port}`);
    logger.info(`${this.APPLICATION_RUNNING} ${ip.address()}:${this.port}`);
  }

  private routes(): void {
    this.app.use("/auth/verifyLogin", userLoginRoutes);

    this.app.use("/user-pagination", verifyToken, userPaginationRoutes);
    this.app.use("/user", verifyToken, userRoutes);
    this.app.use("/company", companyRoutes);
    this.app.use("/task-management", boardRoutes);
    this.app.use("/email-template", emailTemplateRoutes);

    this.app.use("/lead-source", leadSourceRoutes);
    this.app.use("/lead-status", leadStatusRoutes);
    this.app.use("/lead", leadRoutes);

    this.app.use("/currency", currencyRoutes);
    this.app.use("/customer-type", customerTypeRoutes);
    this.app.use("/customer", customerRoutes);

    this.app.use("/payment-medium", mediumRoutes);
    this.app.use("/tax-rate", taxRateRoutes);
    this.app.use("/expense-category", expenseCategoryRoutes);

    this.app.use("/campaign", campaignRoutes);
    this.app.use("/campaign-form", formRoutes);
    this.app.use("/campaign-audience", audienceRoutes);
    this.app.use("/campaign-type", typeRoutes);
    this.app.use("/campaign-status", statusRoutes);

    this.app.use("/event-calendar", eventCalendarRoutes);
    this.app.use("/menu", menuRoutes);
    this.app.use("/security-rule", verifyToken, securityRuleRoutes);
    this.app.use("/security-group", verifyToken, securityGroupRoutes);

    this.app.get("/", (req: Request, res: Response) =>
      res
        .status(Code.OK)
        .send(new HttpResponse(Code.OK, Status.OK, "Welcome to the get"))
    );
    this.app.all("*", (req: Request, res: Response) => {
      logger.warn(`Route not found: ${req.method} ${req.originalUrl}`);

      res
        .status(Code.NOT_FOUND)
        .send(
          new HttpResponse(
            Code.NOT_FOUND,
            Status.NOT_FOUND,
            this.ROUTE_NOT_FOUND
          )
        );
    });
  }
  private middleWare(): void {
    this.app.use(
      cors({
        origin: "*",
      })
    );
    this.app.use(express.json());
    this.app.use(authMiddleware);
    this.app.use(auditMiddleware);

    this.app.use(
      (err: Error, req: Request, res: Response, next: NextFunction): void => {
        logger.error(`Error: ${err.message}`, { stack: err.stack });
        res.status(500).send("Something broke!");
      }
    );

    process.on("uncaughtException", (err: Error) => {
      logger.error("Uncaught Exception:", err);
    });

    process.on(
      "unhandledRejection",
      (reason: {} | null | undefined, promise: Promise<any>) => {
        logger.error("Unhandled Rejection at:", promise, "reason:", reason);
      }
    );

    this.app.use(express.static("uploads"));
  }
}
