"use client";
import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from "recharts";
export default function ScoreScatterChart({ data }: { data: Array<{ name: string; score: number; price: number | undefined }> }) {
  return <ResponsiveContainer width="100%" height="100%"><ScatterChart margin={{ top: 12, right: 12, bottom: 0, left: -18 }}><CartesianGrid stroke="#20304C" strokeDasharray="3 3" /><XAxis dataKey="price" type="number" name="비용" unit="$" tick={{ fill: "#8FA1BD", fontSize: 10 }} /><YAxis dataKey="score" type="number" name="점수" tick={{ fill: "#8FA1BD", fontSize: 10 }} /><Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={{ background: "#111B31", border: "1px solid #30466D", borderRadius: 10 }} /><Scatter data={data} fill="#52D6FF" /></ScatterChart></ResponsiveContainer>;
}
