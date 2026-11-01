import { readFile } from "node:fs/promises";
import type { Portfolio } from "../../../shared/types/index.js";
export interface PortfolioRepository {
  read(): Promise<Portfolio>;
}
export const portfolioRepository: PortfolioRepository = {
  async read() {
    return JSON.parse(
      await readFile(
        process.env.CONTENT_FILE ||
          new URL("../data/portfolio.json", import.meta.url),
        "utf8",
      ),
    ) as Portfolio;
  },
};
