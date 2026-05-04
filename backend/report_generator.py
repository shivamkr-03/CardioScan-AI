from __future__ import annotations

from datetime import datetime
from io import BytesIO
from math import cos, radians, sin
from uuid import uuid4

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Flowable, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


NAVY = colors.HexColor("#0a0f1e")
CARD = colors.HexColor("#f3f4f6")
RED = colors.HexColor("#e63946")
TEAL = colors.HexColor("#06b6d4")
GREEN = colors.HexColor("#16a34a")
YELLOW = colors.HexColor("#ca8a04")


PARAMETER_META = [
    ("Age", "age", "years", "-", None),
    ("Sex", "sex", "", "-", lambda v: "Male" if int(v) == 1 else "Female"),
    ("Chest Pain Type", "cp", "", "-", lambda v: ["Typical Angina", "Atypical Angina", "Non-Anginal Pain", "Asymptomatic"][int(v)]),
    ("Resting Blood Pressure", "trestbps", "mm Hg", "<120 mm Hg", None),
    ("Cholesterol", "chol", "mg/dl", "<200 mg/dl", None),
    ("Fasting Blood Sugar", "fbs", "", "<100 mg/dl", lambda v: ">120 mg/dl" if int(v) == 1 else "≤120 mg/dl"),
    ("Resting ECG", "restecg", "", "Normal", lambda v: ["Normal", "ST-T Abnormality", "LV Hypertrophy"][int(v)]),
    ("Max Heart Rate", "thalach", "bpm", "Higher is generally better", None),
    ("Exercise Angina", "exang", "", "No", lambda v: "Yes" if int(v) == 1 else "No"),
    ("ST Depression", "oldpeak", "", "0-1", None),
    ("ST Slope", "slope", "", "-", lambda v: ["Upsloping", "Flat", "Downsloping"][int(v)]),
    ("Major Vessels", "ca", "", "0", None),
    ("Thalassemia", "thal", "", "Normal", lambda v: ["Normal", "Fixed Defect", "Reversable Defect"][int(v)]),
]


class RiskDial(Flowable):
    def __init__(self, percentage: int, level: str):
        super().__init__()
        self.percentage = percentage
        self.level = level
        self.width = 6 * cm
        self.height = 5 * cm

    def draw(self):
        c = self.canv
        color = risk_color(self.level)
        cx = self.width / 2
        cy = 2.7 * cm
        radius = 1.55 * cm
        c.setLineWidth(11)
        c.setStrokeColor(colors.HexColor("#d1d5db"))
        c.circle(cx, cy, radius, stroke=1, fill=0)
        c.setStrokeColor(color)
        c.arc(cx - radius, cy - radius, cx + radius, cy + radius, 90, -360 * self.percentage / 100)
        c.setFillColor(color)
        c.setFont("Helvetica-Bold", 24)
        c.drawCentredString(cx, cy - 0.15 * cm, f"{self.percentage}%")
        c.setFont("Helvetica-Bold", 10)
        c.drawCentredString(cx, 0.55 * cm, f"{self.level.upper()} RISK")


def risk_color(level: str):
    if level == "Low":
        return GREEN
    if level == "Moderate":
        return YELLOW
    return RED


def parameter_status(key: str, value):
    if key == "trestbps":
        return ("Normal", GREEN) if value < 120 else ("Borderline", YELLOW) if value < 140 else ("High", RED)
    if key == "chol":
        return ("Normal", GREEN) if value < 200 else ("Borderline", YELLOW) if value < 240 else ("High", RED)
    if key == "fbs":
        return ("Normal", GREEN) if int(value) == 0 else ("High", RED)
    if key == "oldpeak":
        return ("Normal", GREEN) if value <= 1 else ("Borderline", YELLOW) if value <= 2 else ("High", RED)
    if key == "exang":
        return ("Normal", GREEN) if int(value) == 0 else ("High", RED)
    return ("-", colors.HexColor("#475569"))


def recommendations(patient: dict) -> list[tuple[str, str]]:
    output = []
    if patient.get("chol", 0) > 200:
        output.append(("Cholesterol Management", "Review dietary patterns, lipid screening, and LDL reduction strategies with a qualified healthcare professional."))
    if patient.get("trestbps", 0) > 140:
        output.append(("Blood Pressure Management", "Track blood pressure at consistent times and discuss sustained elevated readings with a clinician."))
    if patient.get("exang", 0) == 1:
        output.append(("Exercise Symptoms", "Exercise-induced angina should be reviewed promptly, especially if symptoms are new, frequent, or worsening."))
    if patient.get("oldpeak", 0) > 2:
        output.append(("ECG Follow-Up", "ST depression can reflect cardiac stress and should be interpreted in clinical context."))
    output.append(("Clinical Confirmation", "Use this report as an educational aid and consult a healthcare professional for diagnosis and care decisions."))
    return output[:6]


def _draw_page(canvas, doc, generated_at: datetime):
    width, height = A4
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.rect(0, height - 2.2 * cm, width, 2.2 * cm, fill=1, stroke=0)
    canvas.setFillColor(colors.white)
    canvas.setFont("Helvetica-Bold", 15)
    canvas.drawString(1.2 * cm, height - 1.15 * cm, "CardioScan AI")
    canvas.setFont("Helvetica", 9)
    canvas.drawString(1.2 * cm, height - 1.6 * cm, "Clinical Decision Support System")
    canvas.setFillColor(RED)
    canvas.rect(0, height - 2.28 * cm, width, 0.08 * cm, fill=1, stroke=0)

    canvas.setFillColor(colors.HexColor("#e5e7eb"))
    canvas.setFont("Helvetica-Bold", 48)
    canvas.translate(width / 2, height / 2)
    canvas.rotate(35)
    canvas.drawCentredString(0, 0, "RESEARCH PURPOSE ONLY")
    canvas.restoreState()

    canvas.saveState()
    canvas.setStrokeColor(RED)
    canvas.line(1.2 * cm, 1.55 * cm, width - 1.2 * cm, 1.55 * cm)
    canvas.setFillColor(colors.HexColor("#475569"))
    canvas.setFont("Helvetica", 8)
    canvas.drawString(1.2 * cm, 1.1 * cm, "CardioScan AI - For Research Use Only")
    canvas.drawCentredString(width / 2, 1.1 * cm, f"Page {doc.page}")
    canvas.drawRightString(width - 1.2 * cm, 1.1 * cm, f"Generated on {generated_at:%Y-%m-%d %H:%M}")
    canvas.restoreState()


def generate_pdf_report(patient: dict, result: dict, user: dict | None = None, assessment_date: datetime | None = None) -> bytes:
    buffer = BytesIO()
    generated_at = datetime.now()
    report_id = f"CSR-{uuid4().hex[:8].upper()}"
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=1.35 * cm,
        leftMargin=1.35 * cm,
        topMargin=2.7 * cm,
        bottomMargin=2.0 * cm,
    )
    styles = getSampleStyleSheet()
    title = ParagraphStyle("SectionTitle", parent=styles["Heading2"], textColor=NAVY, spaceAfter=8)
    normal = styles["BodyText"]
    story = []

    age = patient.get("age", "-")
    gender = user.get("gender") if user else ("Male" if patient.get("sex") == 1 else "Female")
    name = user.get("name", "Unspecified Patient") if user else "Unspecified Patient"
    dob = user.get("date_of_birth") if user else "-"
    assessment_dt = assessment_date or generated_at
    risk_level = result.get("risk_level", "Low")
    risk_pct = int(round(float(result.get("probability", 0)) * 100))
    color = risk_color(risk_level)

    story.append(Paragraph(f"<b>Report ID:</b> {report_id} &nbsp;&nbsp; <b>Date:</b> {generated_at:%Y-%m-%d}", normal))
    story.append(Spacer(1, 0.3 * cm))
    patient_info = [
        ["PATIENT INFORMATION", ""],
        ["Name", f"{name}    Age: {age}"],
        ["Gender", f"{gender or '-'}    Date of Birth: {dob or '-'}"],
        ["Assessment Date", f"{assessment_dt:%Y-%m-%d %H:%M}"],
        ["Report Generated", f"{generated_at:%Y-%m-%d %H:%M}"],
    ]
    table = Table(patient_info, colWidths=[5 * cm, 11 * cm])
    table.setStyle(TableStyle([
        ("SPAN", (0, 0), (1, 0)),
        ("BACKGROUND", (0, 0), (-1, -1), CARD),
        ("TEXTCOLOR", (0, 0), (-1, 0), NAVY),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#cbd5e1")),
        ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#e5e7eb")),
        ("PADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(table)
    story.append(Spacer(1, 0.65 * cm))
    story.append(Paragraph("RISK ASSESSMENT RESULT", title))
    story.append(Table([[RiskDial(risk_pct, risk_level)]], colWidths=[16 * cm], style=[("ALIGN", (0, 0), (-1, -1), "CENTER")]))
    story.append(Spacer(1, 0.2 * cm))
    story.append(Paragraph(f"Based on AI analysis of 13 clinical parameters, this patient shows a <b>{risk_level.upper()}</b> probability of heart disease.", normal))
    story.append(Spacer(1, 0.45 * cm))
    disclaimer = Table([["IMPORTANT: This report is generated by an AI model for educational and research purposes only. It is not a medical diagnosis. Please consult a qualified healthcare professional for proper evaluation and treatment."]], colWidths=[16 * cm])
    disclaimer.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 1, YELLOW),
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#fffbeb")),
        ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#78350f")),
        ("PADDING", (0, 0), (-1, -1), 10),
    ]))
    story.append(disclaimer)
    story.append(Spacer(1, 1.0 * cm))

    story.append(Paragraph("CLINICAL PARAMETERS TABLE", title))
    rows = [["Parameter", "Patient Value", "Reference Range", "Status"]]
    for label, key, unit, ref, formatter in PARAMETER_META:
        raw = patient.get(key, "-")
        value = formatter(raw) if formatter and raw != "-" else f"{raw} {unit}".strip()
        status, _ = parameter_status(key, raw) if raw != "-" else ("-", colors.black)
        rows.append([label, value, ref, status])
    param_table = Table(rows, colWidths=[5.0 * cm, 4.2 * cm, 4.0 * cm, 2.8 * cm], repeatRows=1)
    param_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#cbd5e1")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
        ("PADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(param_table)
    story.append(Spacer(1, 0.65 * cm))
    story.append(Paragraph("RISK FACTOR ANALYSIS", title))
    for factor in result.get("feature_contributions", [])[:6]:
        impact = abs(float(factor.get("impact", 0)))
        bar_width = max(2.0, min(11.0, impact * 8.0))
        bar_color = RED if factor.get("direction") == "positive" else GREEN
        story.append(Paragraph(f"<b>{factor.get('feature')}</b> - value {factor.get('value')} - impact {factor.get('impact')}", normal))
        bar = Table([[""]], colWidths=[bar_width * cm], rowHeights=[0.18 * cm])
        bar.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), bar_color)]))
        story.append(bar)
        story.append(Spacer(1, 0.12 * cm))
    story.append(Spacer(1, 0.5 * cm))

    story.append(Paragraph("Clinical Recommendations", title))
    for index, (rec_title, body) in enumerate(recommendations(patient), start=1):
        story.append(Paragraph(f"<b>{index}. {rec_title}</b>", normal))
        story.append(Paragraph(body, normal))
        story.append(Spacer(1, 0.18 * cm))
    story.append(Spacer(1, 0.35 * cm))
    story.append(Paragraph("About This Prediction", title))
    story.append(Paragraph("Model used: Gradient Boosting Classifier<br/>Training dataset: UCI Heart Disease Dataset (920 patients)<br/>Model accuracy: 84.78% | AUC: 0.9336<br/>This prediction is based on patterns learned from clinical data.", normal))

    doc.build(story, onFirstPage=lambda c, d: _draw_page(c, d, generated_at), onLaterPages=lambda c, d: _draw_page(c, d, generated_at))
    return buffer.getvalue()
