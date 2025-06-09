import dotenv from "dotenv";
dotenv.config();

export const appConfig = {
  frontendPort: Number(process.env.FRONTEND_PORT) || 5008,
  frontendPortInContainer:
    Number(process.env.FRONTEND_PORT_IN_CONTAINER) || 3000,
  backendPort: Number(process.env.BACKEND_PORT) || 8008,
  databasePort: Number(process.env.DATABASE_PORT) || 3308,
  databasePortInContainer:
    Number(process.env.DATABASE_PORT_IN_CONTAINER) || 3306,
  mysqlRootPassword: process.env.MYSQL_ROOT_PASSWORD || "root",
  mysqlDatabase: process.env.MYSQL_DATABASE || "pss_db",
  mysqlUser: process.env.MYSQL_USER || "user",
  mysqlPassword: process.env.MYSQL_PASSWORD || "user",
  mysqlHost: process.env.MYSQL_HOST || "db-pss-app",
  administratorCode: process.env.ADMINISTRATOR_CODE || "4645",
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  defaultImagePath: process.env.DEFAULT_IMAGE_PATH || "images",
  nextPublicDefaultImagePath:
    process.env.NEXT_PUBLIC_DEFAULT_IMAGE_PATH || "/images",
};

export const clusteringStatus = {
  NotExecuted: 0,
  Executing: 1,
  Finished: 2,
};
