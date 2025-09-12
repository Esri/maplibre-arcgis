/**
 * Creates packages.jsons in the different dist folders to hint the correct module system to Node.
 * Code originated in ArcGIS REST JS.
 */
import fs from "fs";
import { join } from "path";

const { writeFile, access } = fs.promises;
const esmBuildFolder = join(process.cwd(), "dist", "esm");

access(esmBuildFolder)
  .then(() => {
    writeFile(
      join(esmBuildFolder, "package.json"),
      JSON.stringify({ type: "module" }, null, 2)
    );
  })
  .catch(() => {
    // fail silently no ESM build folder was found.
  });

const umdBuildFolder = join(process.cwd(), "dist", "umd");

access(umdBuildFolder)
  .then(() => {
    writeFile(
      join(umdBuildFolder, "package.json"),
      JSON.stringify({ type: "commonjs" }, null, 2)
    );
  })
  .catch(() => {
    // fail silently no UMD build folder was found.
  });
