import { artificialAnalysisAdapter } from "../src/ingest/adapters/artificial-analysis";
import { boardOrder } from "../src/lib/board-meta";
import { normalizedValue } from "../src/lib/scoring-method";

// Read-only live certification. This does not publish, migrate or call an AI API.
async function main() {
  const base = process.argv[2] ?? "https://ai-readerborde.vercel.app";
  const source = await artificialAnalysisAdapter.fetch();
  const identities = source.records.filter((r) => r.kind === "model_meta");
  let leaves=0, matching=0, differences=0, entries=0;
  const drift: string[]=[];
  for(const board of boardOrder) {
    const response=await fetch(`${base}/api/v1/boards/${board}`);
    if(!response.ok) throw new Error(`${board}: HTTP ${response.status}`);
    const data=await response.json();
    for(const entry of data.entries) {
      entries++;
      const identity=identities.find((r) => r.modelSlug===entry.modelSlug);
      if(!identity || identity.name.toLowerCase()!==entry.model.toLowerCase() || identity.provider!==entry.provider || identity.version!==entry.version) throw new Error(`Identity mismatch: ${entry.modelSlug}; published=${JSON.stringify({name:entry.model,provider:entry.provider,version:entry.version})}; currentSource=${JSON.stringify(identity)}`);
      let reproduced=0;
      for(const [key,leaf] of Object.entries(entry.breakdown) as Array<[string,{raw:number;normalized:number;weight:number;sourceUrl:string}]>) {
        if(key.startsWith("axis:")) continue;
        leaves++;
        const record=source.records.find((r)=>r.kind==="metric" && r.externalId===identity.externalId && r.metricKey===key);
        if(record?.kind==="metric" && Math.abs(record.value-leaf.raw)<1e-7) matching++;
        else { differences++; drift.push(`${entry.modelSlug}/${key}`); }
        if(!leaf.sourceUrl.startsWith("https://") || Math.abs((normalizedValue(key,leaf.raw) ?? NaN)-leaf.normalized)>1e-7) throw new Error(`Invalid leaf: ${entry.modelSlug}/${key}`);
        reproduced += leaf.normalized*leaf.weight;
      }
      if(Math.abs(reproduced-Number(entry.value))>1e-7) throw new Error(`Score mismatch: ${entry.modelSlug}/${board}`);
    }
  }
  console.log(JSON.stringify({base,sourceFingerprint:source.fingerprint,entries,leaves,matching,differences,drift,scoreReproduction:"passed"},null,2));
  if(differences) process.exitCode=2; // Drift is evidence, not permission to rewrite history.
}
main().catch((error)=>{console.error(error instanceof Error ? error.message : "verification failed");process.exitCode=1;});
