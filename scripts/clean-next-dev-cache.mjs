import { rm } from "node:fs/promises";

const nextDevelopmentDirectory = new URL("../.next/dev", import.meta.url);

await rm(nextDevelopmentDirectory, { force: true, recursive: true });

console.log("removed .next/dev");
