import { promises as fs } from "fs"
import path from "path"
import type { FundDirectoryData } from "./fund-watch"

/**
 * Server-only data loader. Do NOT import from client components.
 */
export async function getFundDirectoryData(): Promise<FundDirectoryData | null> {
  try {
    const filePath = path.join(process.cwd(), "public", "data", "fund-directory.json")
    const raw = await fs.readFile(filePath, "utf-8")
    return JSON.parse(raw) as FundDirectoryData
  } catch {
    return null
  }
}
