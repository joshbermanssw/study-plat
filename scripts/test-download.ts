import "dotenv/config";
import { downloadCanvasItems } from "../src/app/sync/actions";

async function main() {
  const result = await downloadCanvasItems([
    { unit: "INFO4444", slug: "week-07/info4444-week-7-pdf" },
  ]);
  console.log(JSON.stringify(result, null, 2));
}
main();
