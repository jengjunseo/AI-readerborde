import { buildSnapshot } from "./ranking";
import { curatedModels } from "./curated-data";
import type { Board, BoardSlug, Snapshot } from "./types";

const priorModels = curatedModels.map((model) => model.slug === "claude-sonnet-4" ? { ...model, metrics: { ...model.metrics, sweBench: { ...model.metrics.sweBench, raw: 66.5 } } } : model);
const yesterday = buildSnapshot(priorModels, "2026-09-17");
const today = buildSnapshot(curatedModels, "2026-09-18", yesterday);
export const latestSnapshot = (): Snapshot => today;
export const getSnapshot = (date: string): Snapshot | undefined => date === today.date ? today : date === yesterday.date ? yesterday : undefined;
export const allBoards = (snapshot = today): Board[] => Object.values(snapshot.boards);
export const getBoard = (slug: string, snapshot = today) => snapshot.boards[slug as BoardSlug];
export const getModel = (slug: string) => curatedModels.find((model) => model.slug === slug);
export const movementSummary = (snapshot = today) => { const entries = snapshot.boards.overall.entries; return { up: entries.filter((entry) => entry.previousRank && entry.rank < entry.previousRank).length, down: entries.filter((entry) => entry.previousRank && entry.rank > entry.previousRank).length, newModels: entries.filter((entry) => !entry.previousRank).length }; };
