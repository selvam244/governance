import { DataSource } from "typeorm";
import { User } from "../entities/User";

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: "./database.sqlite",
  synchronize: true, // Set to false in production
  logging: false,
  entities: [User],
  migrations: [],
  subscribers: [],
});