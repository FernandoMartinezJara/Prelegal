import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { NdaFormData, PartyDetails } from "./nda-data";
import { fillNdaClauses, type RichSegment } from "./fill-template";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", lineHeight: 1.4 },
  title: { fontSize: 14, fontWeight: 700, textAlign: "center", marginBottom: 16 },
  row: { flexDirection: "row", borderBottom: "1pt solid #d4d4d8" },
  cellLabel: { width: "30%", padding: 4, fontWeight: 700, backgroundColor: "#fafafa" },
  cell: { width: "35%", padding: 4 },
  cellWide: { width: "70%", padding: 4 },
  table: { borderTop: "1pt solid #d4d4d8", borderLeft: "1pt solid #d4d4d8", marginBottom: 16 },
  clause: { flexDirection: "row", marginBottom: 8 },
  clauseNumber: { width: 20, fontWeight: 700 },
  clauseText: { flex: 1 },
  footer: { marginTop: 16, fontSize: 8, color: "#71717a" },
});

function fallback(value: string) {
  return value.trim() ? value : "—";
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

export function NdaPdfDocument({ data }: { data: NdaFormData }) {
  const clauses = fillNdaClauses(data);
  const partyRows: Array<[string, keyof PartyDetails]> = [
    ["Print Name", "name"],
    ["Title", "title"],
    ["Company", "company"],
    ["Notice Address", "noticeAddress"],
    ["Date", "date"],
  ];

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>Mutual Non-Disclosure Agreement</Text>

        <View style={styles.table}>
          <View style={styles.row}>
            <Text style={styles.cellLabel}>Purpose</Text>
            <Text style={styles.cellWide}>{fallback(data.purpose)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.cellLabel}>Effective Date</Text>
            <Text style={styles.cellWide}>{fallback(data.effectiveDate)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.cellLabel}>Governing Law</Text>
            <Text style={styles.cellWide}>{fallback(data.governingLaw)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.cellLabel}>Jurisdiction</Text>
            <Text style={styles.cellWide}>{fallback(data.jurisdiction)}</Text>
          </View>
          {data.modifications.trim() && (
            <View style={styles.row}>
              <Text style={styles.cellLabel}>MNDA Modifications</Text>
              <Text style={styles.cellWide}>{data.modifications}</Text>
            </View>
          )}
        </View>

        {clauses.map((clause) => (
          <View key={clause.number} style={styles.clause}>
            <Text style={styles.clauseNumber}>{clause.number}.</Text>
            <RichPdfText segments={clause.segments} />
          </View>
        ))}

        <Text style={{ marginTop: 8, marginBottom: 8 }}>
          By signing below, each party agrees to enter into this MNDA as of the Effective Date.
        </Text>

        <View style={styles.table}>
          <View style={styles.row}>
            <Text style={styles.cellLabel}> </Text>
            <Text style={styles.cell}>Party 1</Text>
            <Text style={styles.cell}>Party 2</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.cellLabel}>Signature</Text>
            <Text style={styles.cell}>{fallback(data.party1.name)}</Text>
            <Text style={styles.cell}>{fallback(data.party2.name)}</Text>
          </View>
          {partyRows.map(([label, key]) => (
            <View style={styles.row} key={key}>
              <Text style={styles.cellLabel}>{label}</Text>
              <Text style={styles.cell}>{fallback(data.party1[key])}</Text>
              <Text style={styles.cell}>{fallback(data.party2[key])}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>
          Common Paper Mutual Non-Disclosure Agreement Version 1.0, free to use under CC BY 4.0
          (https://creativecommons.org/licenses/by/4.0/).
        </Text>
      </Page>
    </Document>
  );
}
