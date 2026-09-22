import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { siAlibabacloud, siAnthropic, siDeepseek, siGoogle, siMeta, siX, siXiaomi } from "simple-icons";
const icons = { anthropic: siAnthropic, google: siGoogle, meta: siMeta, xiaomi: siXiaomi, alibaba: siAlibabacloud, deepseek: siDeepseek, spacexai: siX };
const output = path.join(process.cwd(), "public", "providers");
await mkdir(output, { recursive: true });
for (const [name, icon] of Object.entries(icons)) await writeFile(path.join(output, `${name}.svg`), `<svg xmlns="http://www.w3.org/2000/svg" role="img" viewBox="0 0 24 24"><title>${icon.title}</title><path fill="#E7EEF9" d="${icon.path}"/></svg>\n`);
