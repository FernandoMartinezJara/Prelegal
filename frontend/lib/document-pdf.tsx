import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { DocumentTypeDetail } from "./document-schema";
import type { FieldData, PartyDetails, TermValue } from "./field-data";
import { partyRowLabels } from "./field-data";
import { describeTerm, fillDocumentClauses, type RichSegment } from "./fill-template";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", lineHeight: 1.4 },
  title: { fontSize: 14, fontWeight: 700, textAlign: "center", marginBottom: 16 },
  row: { flexDirection: "row", borderBottom: "1pt solid #d4d4d8" },
  cellLabel: { width: "30%", padding: 4, fontWeight: 700, backgroundColor: "#fafafa" },
  cell: { width: "35%", padding: 4 },
  cellWide: { width: "70%", padding: 4 },
  table: { borderTop: "1pt solid #d4d4d8", borderLeft: "1pt solid #d4d4d8", marginBottom: 16 },
  clause: { flexDirection: "row", marginBottom: 8 },
  clauseNumber: { width: 30, fontWeight: 700 },
  clauseText: { flex: 1 },
  footer: { marginTop: 16, fontSize: 8, color: "#71717a" },
});

function fallback(value: string) {
  return value.trim() ? value : "—";
}

function fieldDisplayValue(value: FieldData[string]) {
  if (typeof value === "string") return fallback(value);
  const term = value as TermValue;
  return describeTerm(term.type, term.years);
}

function RichPdfText({ segments }: { segments: RichSegment[] }) {
  return (
    <Text style={styles.clauseText}>
      {segments.map((segment, index) =>
        segment.bold ? (
          <Text key={index} style={{ fontWeight: 700 }}>
            {segment.text}
          </Text>
        ) : (
          <Text key={index}>{segment.text}</Text>
        )
      )}
    </Text>
  );
}

export function DocumentPdfDocument({
  schema,
  data,
}: {
  schema: DocumentTypeDetail;
  data: FieldData;
}) {
  const clauses = fillDocumentClauses(schema, data);
  const partyRows = partyRowLabels(schema.uiStrings);

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>{schema.name}</Text>
        {schema.translationDisclaimer && (
          <Text style={{ ...styles.footer, marginBottom: 12, marginTop: 0 }}>
            {schema.translationDisclaimer}
          </Text>
        )}

        <View style={styles.table}>
          {schema.fields.map((field) => (
            <View style={styles.row} key={field.key}>
              <Text style={styles.cellLabel}>{field.label}</Text>
              <Text style={styles.cellWide}>{fieldDisplayValue(data[field.key])}</Text>
            </View>
          ))}
        </View>

        {clauses.map((clause) => (
          <View key={clause.number} style={styles.clause}>
            <Text style={styles.clauseNumber}>{clause.number}.</Text>
            <RichPdfText segments={clause.segments} />
          </View>
        ))}

        {schema.partyRoles.length > 0 && (
          <>
            <Text style={{ marginTop: 8, marginBottom: 8 }}>{schema.uiStrings.signingNote}</Text>

            <View style={styles.table}>
              <View style={styles.row}>
                <Text style={styles.cellLabel}> </Text>
                {schema.partyRoles.map((role) => (
                  <Text style={styles.cell} key={role}>
                    {role}
                  </Text>
                ))}
              </View>
              <View style={styles.row}>
                <Text style={styles.cellLabel}>{schema.uiStrings.signatureLabel}</Text>
                {schema.partyRoles.map((role, index) => (
                  <Text style={styles.cell} key={role}>
                    {fallback((data[`party${index + 1}`] as PartyDetails).name)}
                  </Text>
                ))}
              </View>
              {partyRows.map(([label, key]) => (
                <View style={styles.row} key={key}>
                  <Text style={styles.cellLabel}>{label}</Text>
                  {schema.partyRoles.map((role, index) => (
                    <Text style={styles.cell} key={role}>
                      {fallback((data[`party${index + 1}`] as PartyDetails)[key])}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          </>
        )}

        <Text style={styles.footer}>{schema.uiStrings.previewFooter}</Text>
      </Page>
    </Document>
  );
}
