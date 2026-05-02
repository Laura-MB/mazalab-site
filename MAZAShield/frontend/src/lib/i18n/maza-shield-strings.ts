import type { RiskLevel } from "@/lib/api/types";

export type MazaLocale = "en" | "es";

export type MazaStrings = {
  brandTitle: string;
  brandSubtitle: string;
  navDemo: string;
  navResults: string;
  navAudit: string;
  footerTag: string;
  demoTitle: string;
  demoLeadBeforeFormats: string;
  demoLeadJson: string;
  demoLeadCsv: string;
  demoLeadExcel: string;
  demoLeadRunDemo: string;
  cardInput: string;
  cardInputDescBeforeJson: string;
  cardInputDescAfterJson: string;
  cardInputDescCsvCols: string;
  cardPreview: string;
  cardPreviewDesc: string;
  cardPreviewLoading: string;
  cardPreviewEmpty: string;
  runDemo: string;
  uploadLabel: string;
  uploadDrop: string;
  uploadTypes: string;
  browseFiles: string;
  invalidFile: string;
  requestError: string;
  resultsTitle: string;
  entitiesLabel: string;
  viewResults: string;
  entityTab: string;
  erTitle: string;
  erNoResolvedTitle: string;
  erNoResolvedDesc: string;
  riskTitle: string;
  riskPer100: string;
  dimensionBreakdown: string;
  colDimension: string;
  colScore: string;
  colWeight: string;
  colContrib: string;
  colJustification: string;
  analyticExplanation: string;
  gamingCombos: string;
  synergyPct: string;
  totalSynergyBoost: string;
  recommendations: string;
  erSimilarity: string;
  erStrategy: string;
  erMatchConfidence: string;
  erMatchHelp: string;
  erPair: string;
  erSameId: string;
  erCanonical: string;
  erAliases: string;
  erMergedIds: string;
  erNoMerges: string;
  erExplanation: string;
  erConflictsTitle: string;
  erConflictsHelp: string;
  colField: string;
  colPairValues: string;
  colSelected: string;
  levelLow: string;
  levelMedium: string;
  levelHigh: string;
  levelCritical: string;
  strategyDeterministic: string;
  strategyProbabilistic: string;
  strategyHybrid: string;
  exportMenu: string;
  pdfShort: string;
  pdfLong: string;
  printTitle: string;
  printRiskLevel: string;
  printScore: string;
  printSummary: string;
  printGovernance: string;
  printGenerated: string;
  printCorrelationId: string;
  printDimensions: string;
  printExplanation: string;
  printRecommendations: string;
  printGaming: string;
  printEntityResolution: string;
  printMatch: string;
  printStrategy: string;
  printCanonical: string;
  printVariantShort: string;
  printVariantLong: string;
  unknownError: string;
  readFileError: string;
};

const en: MazaStrings = {
  brandTitle: "Maza Shield",
  brandSubtitle: "Gaming demo",
  navDemo: "Demo",
  navResults: "Results",
  navAudit: "Audit Trail",
  footerTag: "Maza Shield",
  demoTitle: "Maza Shield · Gaming demo",
  demoLeadBeforeFormats: "Upload entities as",
  demoLeadJson: "JSON",
  demoLeadCsv: "CSV",
  demoLeadExcel: "Excel",
  demoLeadRunDemo: "Run Demo",
  cardInput: "Input",
  cardInputDescBeforeJson: "JSON:",
  cardInputDescAfterJson:
    "array or {\"entities\": [...]}. CSV/Excel: columns id, displayName (or name), optional aliases (| separated).",
  cardInputDescCsvCols: "",
  cardPreview: "Request preview",
  cardPreviewDesc:
    "Last JSON sent to the proxy (entities and optional correlationId).",
  cardPreviewLoading: "Running…",
  cardPreviewEmpty: "Run an assessment to see the payload.",
  runDemo: "Run Demo",
  uploadLabel: "JSON, CSV or Excel file",
  uploadDrop: "Drop a file here or choose one",
  uploadTypes: ".json · .csv · .xlsx",
  browseFiles: "Browse files",
  invalidFile: "Invalid file",
  requestError: "Request error",
  resultsTitle: "Results",
  entitiesLabel: "entities",
  viewResults: "Results view",
  entityTab: "Entity",
  erTitle: "Entity resolution",
  erNoResolvedTitle: "Entity resolution",
  erNoResolvedDesc: "The response has no resolvedEntity for this row.",
  riskTitle: "Risk score",
  riskPer100: "/ 100",
  dimensionBreakdown: "Breakdown by dimension",
  colDimension: "Dimension",
  colScore: "Score",
  colWeight: "Weight",
  colContrib: "Contrib.",
  colJustification: "Justification / action",
  analyticExplanation: "Analytic explanation",
  gamingCombos: "Combos (gaming)",
  synergyPct: "synergy",
  totalSynergyBoost: "Total synergy boost:",
  recommendations: "Recommended actions",
  erSimilarity: "Similarity",
  erStrategy: "Strategy",
  erMatchConfidence: "Match confidence",
  erMatchHelp:
    "Match score from the ER engine (0–100%). Higher values mean stronger alignment with the canonical record.",
  erPair: "Input → canonical pair",
  erSameId: "(same id; no merge with another record)",
  erCanonical: "Canonical entity",
  erAliases: "Aliases:",
  erMergedIds: "Merged pairs (IDs)",
  erNoMerges: "No additional merges in this result.",
  erExplanation: "Explanation (ER)",
  erConflictsTitle: "Conflicting pairs (attributes)",
  erConflictsHelp:
    "Each row contrasts candidate values and the value chosen for the canonical record.",
  colField: "Field",
  colPairValues: "Values (pair)",
  colSelected: "Selected",
  levelLow: "Low",
  levelMedium: "Medium",
  levelHigh: "High",
  levelCritical: "Critical",
  strategyDeterministic: "Deterministic",
  strategyProbabilistic: "Probabilistic",
  strategyHybrid: "Hybrid",
  exportMenu: "Export",
  pdfShort: "PDF · Short",
  pdfLong: "PDF · Full",
  printTitle: "Maza Shield · Assessment report",
  printRiskLevel: "Risk level:",
  printScore: "Score:",
  printSummary: "Summary",
  printGovernance: "Governance:",
  printGenerated: "Generated:",
  printCorrelationId: "Correlation ID:",
  printDimensions: "Dimensions",
  printExplanation: "Explanation",
  printRecommendations: "Recommendations",
  printGaming: "Gaming insights",
  printEntityResolution: "Entity resolution",
  printMatch: "Match",
  printStrategy: "Strategy",
  printCanonical: "Canonical",
  printVariantShort: "Short",
  printVariantLong: "Full",
  unknownError: "Unknown error",
  readFileError: "Could not read the file"
};

const es: MazaStrings = {
  brandTitle: "Maza Shield",
  brandSubtitle: "Demo de gaming",
  navDemo: "Demo",
  navResults: "Resultados",
  navAudit: "Auditoría",
  footerTag: "Maza Shield",
  demoTitle: "Maza Shield · Demo de gaming",
  demoLeadBeforeFormats: "Sube entidades en",
  demoLeadJson: "JSON",
  demoLeadCsv: "CSV",
  demoLeadExcel: "Excel",
  demoLeadRunDemo: "Ejecutar demo",
  cardInput: "Entrada",
  cardInputDescBeforeJson: "JSON:",
  cardInputDescAfterJson:
    "lista o {\"entities\": [...]}. CSV/Excel: columnas id, displayName (o name), opcional aliases (separados por |).",
  cardInputDescCsvCols: "",
  cardPreview: "Vista previa del cuerpo",
  cardPreviewDesc:
    "Último JSON enviado al proxy (entidades y correlationId opcional).",
  cardPreviewLoading: "Evaluando…",
  cardPreviewEmpty: "Ejecuta una evaluación para ver el payload.",
  runDemo: "Ejecutar demo",
  uploadLabel: "Archivo JSON, CSV o Excel",
  uploadDrop: "Arrastra un archivo aquí o elige uno",
  uploadTypes: ".json · .csv · .xlsx",
  browseFiles: "Examinar archivos",
  invalidFile: "Archivo no válido",
  requestError: "Error en la petición",
  resultsTitle: "Resultados",
  entitiesLabel: "entidades",
  viewResults: "Vista Results",
  entityTab: "Entidad",
  erTitle: "Resolución de entidades",
  erNoResolvedTitle: "Resolución de entidades",
  erNoResolvedDesc:
    "La respuesta no incluye resolvedEntity para esta fila.",
  riskTitle: "Puntuación de riesgo",
  riskPer100: "/ 100",
  dimensionBreakdown: "Desglose por dimensión",
  colDimension: "Dimensión",
  colScore: "Score",
  colWeight: "Peso",
  colContrib: "Contrib.",
  colJustification: "Justificación / acción",
  analyticExplanation: "Explicación analítica",
  gamingCombos: "Combos (gaming)",
  synergyPct: "sinergia",
  totalSynergyBoost: "Refuerzo de sinergia total:",
  recommendations: "Recomendaciones accionables",
  erSimilarity: "Similitud",
  erStrategy: "Estrategia",
  erMatchConfidence: "Confianza de emparejamiento",
  erMatchHelp:
    "Puntuación de match alineada al motor ER (0–100%). Valores altos indican mayor coherencia entre registros candidatos y la entidad canónica.",
  erPair: "Par entrada → canónica",
  erSameId: "(misma id; sin fusión con otro registro)",
  erCanonical: "Entidad canónica",
  erAliases: "Alias:",
  erMergedIds: "Pares fusionados (IDs)",
  erNoMerges: "Sin fusiones adicionales en este resultado.",
  erExplanation: "Explicación (ER)",
  erConflictsTitle: "Pares en conflicto (atributos)",
  erConflictsHelp:
    "Cada fila contrasta valores candidatos y el valor elegido para el registro canónico.",
  colField: "Campo",
  colPairValues: "Valores (par)",
  colSelected: "Seleccionado",
  levelLow: "Bajo",
  levelMedium: "Medio",
  levelHigh: "Alto",
  levelCritical: "Crítico",
  strategyDeterministic: "Determinista",
  strategyProbabilistic: "Probabilística",
  strategyHybrid: "Híbrida",
  exportMenu: "Exportar",
  pdfShort: "PDF · Versión corta",
  pdfLong: "PDF · Versión larga",
  printTitle: "Maza Shield · Informe de evaluación",
  printRiskLevel: "Nivel de riesgo:",
  printScore: "Score:",
  printSummary: "Resumen",
  printGovernance: "Gobierno:",
  printGenerated: "Generado:",
  printCorrelationId: "Correlation ID:",
  printDimensions: "Dimensiones",
  printExplanation: "Explicación",
  printRecommendations: "Recomendaciones",
  printGaming: "Gaming",
  printEntityResolution: "Resolución de entidades",
  printMatch: "Match",
  printStrategy: "Estrategia",
  printCanonical: "Canónica",
  printVariantShort: "Corto",
  printVariantLong: "Completo",
  unknownError: "Error desconocido",
  readFileError: "Error al leer el archivo"
};

export function formatApiAssessError(
  locale: MazaLocale,
  status: number,
  hint: string
): string {
  if (locale === "en") {
    return `API error (${status}). Check the backend at ${hint} and POST /assess-risk.`;
  }
  return `Error API (${status}). Comprueba el backend en ${hint} y POST /assess-risk.`;
}

export function getMazaStrings(locale: MazaLocale): MazaStrings {
  return locale === "en" ? en : es;
}

export function riskLevelLabel(
  level: RiskLevel,
  t: MazaStrings
): string {
  switch (level) {
    case "low":
      return t.levelLow;
    case "medium":
      return t.levelMedium;
    case "high":
      return t.levelHigh;
    case "critical":
      return t.levelCritical;
    default:
      return level;
  }
}
