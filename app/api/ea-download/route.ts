import { NextResponse } from "next/server"
import { readFileSync } from "fs"
import path from "path"

export async function GET() {

  const filePath = path.join(process.cwd(), "private", "iHEDZ.ex5")

  const file = readFileSync(filePath)

  return new NextResponse(file, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": "attachment; filename=fxhedz-ea.ex5"
    }
  })

}