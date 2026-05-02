# Risk Management File – MAZA Shield
**Producto:** MAZA Shield – Casino Risk Intelligence Platform  
**Versión:** 1.0  
**Fecha:** 28 de mayo de 2026  
**Preparado por:** Laura (MAZALab)  
**Referencia:** ISO 14971:2019 + FDA QMSR

## 1. Scope
MAZA Shield is an AI-powered Risk Intelligence platform for casino operations, including entity resolution, multi-dimensional risk scoring (fraud, AML, Responsible Gaming, vendor risk, etc.), explainable assessments, and audit trail.

Intended use: Support casino operators in making risk-based decisions for player onboarding, ongoing monitoring, fraud prevention, compliance, and license protection.

## 2. Risk Management Policy
- We apply a proactive, systematic, and auditable approach to risk management.
- All identified risks shall be evaluated considering severity, probability, and detectability.
- Risk reduction shall prioritize inherent safety by design, then protective measures, then information for safety.
- Residual risk must be acceptable or justified with operational rationale.

## 3. Risk Identification

### 3.1 Intended Use Risks
- Incorrect entity resolution → wrong player risk profile
- Inaccurate risk scoring → false negatives (high-risk player not flagged)
- False positives → unnecessary operational friction
- Bias in scoring models (demographic, jurisdictional)
- Data privacy breach (PII exposure)
- Audit trail incompleteness → regulatory non-compliance
- System downtime → delayed risk decisions on casino floor

### 3.2 Foreseeable Misuse
- Operators relying solely on MAZA Shield without human review
- Using the system outside regulated jurisdictions
- Sharing outputs without confidentiality controls


## 4. Risk Analysis (completed)

| Risk ID | Category                           | Risk Description                                                                 | Relevance to Casino Floor / Live Data                       | Advanced Mitigation Technologies                             | Severity | Probability | Detectability | RPN  | Current Controls                                              | Residual Risk | Comments |
|---------|------------------------------------|----------------------------------------------------------------------------------|-------------------------------------------------------------|-------------------------------------------------------------|----------|-------------|---------------|------|---------------------------------------------------------------|---------------|----------|
| RM-007  | Player Identity                    | Failure in real-time entity resolution (multiple aliases, shared devices)       | High – players frequently switch machines/tables            | Entity Resolution + graph DB streaming + behavioral biometrics | 5        | 4           | 2             | 40   | Fuzzy matching + alias conflict detection + correlationId    | Medium        | Critical for rings and syndicates |
| RM-008  | Real-Time Fraud                    | Live collusion between players (chip dumping, signal sharing)                   | Very High – occurs at tables and slots in real time         | Real-time graph analytics + Flink + computer vision        | 5        | 4           | 3             | 60   | Adaptive combos + live link analysis                          | High          | Classic high-impact fraud pattern |
| RM-009  | Bonus Abuse                        | Systematic bonus and promotional abuse (gnoming, rollover arbitrage)            | High – active promotions on floor and online                | Promo rail stack detector + session digital twin           | 4        | 4           | 2             | 32   | Advanced templates + promo_rail_stack detector                | Medium        | Very common in the industry |
| RM-010  | Responsible Gaming – Session Tilt  | Player entering tilt / loss of control during live session                      | Very High – occurs in real time on the floor                | High stakes tilt detector + real-time behavioral biometrics | 5        | 3           | 4             | 60   | SessionTiltDetector + RG intervention playbook                | Medium-High   | Player protection priority |
| RM-011  | Vendor / PSP Risk                  | Collusion or failure with payment providers                                     | High – live transactions at cages and kiosks                | Vendor collusion detector + real-time settlement monitoring | 5        | 3           | 3             | 45   | PspCollusionDetector                                          | High          | Significant financial exposure |
| RM-012  | Operational Downtime               | Loss of data or API during peak hours                                           | Critical – affects live floor decisions                     | Streaming pipeline (Kafka + Flink) + dual backend         | 4        | 2           | 1             | 8    | Health endpoint + automatic failover                          | Low           | Critical availability risk |
| RM-013  | Over-reliance on AI                | Staff relying solely on the system without human review                         | High – fast decisions on the floor                          | Mandatory human-in-the-loop + clear disclaimers + training | 4        | 4           | 3             | 48   | Clear disclaimers + operator playbook                         | Medium-High   | Important cultural risk |
| RM-014  | Data Privacy Live Exposure         | Accidental exposure of PII in real time                                         | High – continuous data generation                           | PII pattern detection + correlationId-only tracing        | 5        | 2           | 1             | 10   | Audit log + real-time PII detection                           | Low           | High regulatory exposure |
| RM-015  | Regulatory Reporting Delay         | Delay in reporting suspicious transactions                                      | Critical – strict regulatory deadlines                      | Real-time AML scoring + automated reporting               | 5        | 3           | 2             | 30   | Streaming AML rules + audit trail                             | Medium        | Risk of heavy fines |
| RM-016  | Device/Account Takeover            | Live compromise of player account or device                                     | High – occurs with high-value players                       | Behavioral biometrics + device fingerprinting             | 5        | 3           | 2             | 30   | Real-time behavioral monitoring                               | Medium        | High financial impact |
| RM-017  | Bonus Ring / Syndicate             | Organized syndicate abusing bonuses                                             | High – operates across multiple tables                      | Promo rail stack + graph link analysis                    | 5        | 4           | 3             | 60   | Advanced patterns + correlationId                             | High          | Extremely damaging pattern |
| RM-018  | High Velocity Betting Fraud        | High-velocity betting for money laundering or bonus exploitation                | Very High – live at tables and kiosks                       | Velocity + stake ramp detection                           | 4        | 4           | 2             | 32   | High velocity syndicate detector                              | Medium        | Difficult to detect manually |
| RM-019  | Money Laundering (Structuring)     | Structuring transactions to launder money                                       | Very High – occurs at cages and kiosks                      | Real-time transaction monitoring + graph analysis         | 5        | 4           | 3             | 60   | Velocity detection + structuring rules                        | High          | Critical regulatory risk |
| RM-020  | Third-Party Data Integration       | Failure or corruption of data from external systems                             | High – heavy reliance on multiple integrations              | Data validation + anomaly detection in ingestion          | 4        | 3           | 2             | 24   | Input validation + source confidence scoring                  | Medium        | Garbage in, garbage out risk |
| RM-021  | Insider Threat / Employee Fraud    | Casino employee collaborating in fraud                                          | High – internal access and system knowledge                 | Employee behavioral monitoring + privileged access audit  | 5        | 3           | 3             | 45   | Role-based access + audit of internal actions                 | Medium-High   | Very difficult to detect |

**MAZALab Risk Evaluation Scale:**
- **Severity**: 1 = Negligible → 5 = Catastrophic
- **Probability**: 1 = Rare → 5 = Almost certain
- **Detectability**: 1 = Easily detected → 5 = Almost impossible to detect
- **RPN** = Severity × Probability × Detectability
--
## 5. Risk Evaluation & Acceptance Criteria
- RPN > 20 → Requires risk reduction
- Severity 5 risks → Must be reduced to ALARP
- All residual risks must be documented and accepted by management.

## 6. Risk Controls (planned)
- Strong explainability layer
- Human-in-the-loop workflow
- Comprehensive audit trail
- Bias monitoring
- Version control + validation

## 7. Post-Market Surveillance Plan
- Monitor false positive/negative rates
- Track regulatory findings
- Annual risk management review

**Approval:** ________________________ (Laura)   Date: __________
