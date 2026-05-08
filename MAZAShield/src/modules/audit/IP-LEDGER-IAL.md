# 🛡️ MAZALab: IP & AI-Contribution Ledger
## Módulo: Immutable Audit Log (IAL)
**Fecha:** 07 Mayo 2026  
**Versión:** 1.0.0  
**Commit:** 175d4ab  
**Autor:** Laura Maza — Solo-Founder, CEO & Lead Architect, MAZALab  
**Ubicación:** `src/modules/audit/AuditLogger.ts`  

---

## 1. Conceptualización Humana (The "Seed")

**Problema a resolver:**  
El motor de riesgo Mother Brain toma decisiones de alta consecuencia 
regulatoria — flagear a un dealer, escalar una alerta, generar un 
reporte para la NGCB. Sin un registro inmutable de *por qué* se tomó 
cada decisión, esas decisiones son indefendibles ante un regulador o 
ante un tribunal. Un log de errores estándar no sirve: puede ser 
alterado, sobreescrito, o simplemente no explica el razonamiento.

**Tesis Técnica (Laura Maza):**  
Cada inferencia de Mother Brain debe quedar sellada en una cadena 
hash-linked donde cada entrada contiene el hash SHA-256 de la entrada 
anterior. Si cualquier entrada pasada es alterada — aunque sea un solo 
carácter — todos los hashes subsiguientes se rompen. Esto provee 
inmutabilidad criptográfica sin necesidad de blockchain, sin costo de 
infraestructura, y sin dependencias externas.

La cadena arranca desde un hash génesis conocido 
(`SHA-256("MAZA_SHIELD_GENESIS_V1")`) — auditable por cualquier 
inspector con acceso al código fuente.

**Decisiones Arquitectónicas tomadas por Laura:**

1. **Zero dependencies** — El módulo usa solo `crypto`, `fs`, y `path` 
   de Node.js nativo. Ninguna librería externa. Esto elimina la 
   superficie de ataque de supply chain y garantiza que el módulo 
   funcione en cualquier ambiente sin instalación adicional.

2. **Sincronía intencional en writes** — `appendFileSync` en lugar de 
   `appendFile` async. Decisión deliberada: garantiza que cada entrada 
   esté en disco antes de retornar al caller. En un sistema de 
   compliance, perder una entrada por un crash es inaceptable. La 
   latencia adicional (~0.1-0.3ms) es aceptable para el caso de uso.

3. **Timestamp dual** — `timestampMs` (wall-clock) + `hrtimeOffsetNs` 
   (alta resolución relativa al proceso). Windows no expone nanosegundos 
   absolutos del sistema operativo — esta arquitectura dual da la máxima 
   precisión disponible en la plataforma sin mentirle al regulador sobre 
   la precisión real.

4. **Serialización canónica con sort alfabético de keys** — La función 
   `canonicalize()` ordena los campos alfabéticamente antes de 
   serializar. Esto garantiza que el mismo objeto produce siempre el 
   mismo hash, independientemente del orden de inserción de propiedades 
   en JavaScript.

5. **Campo `decisionLogic` obligatorio** — Cada entrada debe incluir 
   una explicación en lenguaje humano de por qué se tomó la decisión. 
   Esto no es opcional ni genérico — debe ser específico al evento. 
   Requerimiento directo de la NGCB para transparencia algorítmica.

6. **Singleton pattern con factory** — `getAuditLogger()` garantiza una 
   sola cadena por proceso. Múltiples instancias romperían la secuencia 
   monotónica de `sequenceNumber`.

7. **Rotación diaria de archivos** — Un archivo por día 
   (`audit_YYYYMMDD.ndjson`). Facilita auditorías por rango de fechas 
   sin cargar archivos masivos en memoria.

---

## 2. Protocolo de Ejecución Sintética (The "Tool")

**Agente Utilizado:** Claude Sonnet (Chief Engineer, MAZALab)

**Prompt Maestro:**  
"Diseña el esquema de datos (TypeScript interfaces) y la lógica de 
persistencia para el IAL considerando: hash linking SHA-256, timestamp 
de nanosegundos, actor_id, event_context, decision_logic para NGCB, 
integrity_hash. Zero-dependency. Sin latencia que rompa tiempo real."

**Tareas Delegadas al Agente:**
- Implementación de `canonicalize()` con sort alfabético
- Implementación de `sha256()` wrapper sobre Node crypto
- Implementación de `loadChainState()` para resumir cadena existente
- Escritura del smoke test con los tres casos: write, verify, tamper
- Generación del hash génesis `MAZA_SHIELD_GENESIS_V1`

---

## 3. Revisión y Curaduría de Ingeniería (The "Ownership")

**Inconsistencias Detectadas y Corregidas por Laura:**

1. **Timestamp de nanosegundos — corrección de expectativa:**  
   El requerimiento original pedía "precisión de nanosegundos" como 
   si fuera un timestamp absoluto. Laura identificó que esto es 
   imposible en Windows con Node.js — `process.hrtime.bigint()` da 
   nanosegundos *relativos al inicio del proceso*, no wall-clock 
   absoluto. La arquitectura dual (`timestampMs` + `hrtimeOffsetNs`) 
   fue la solución correcta. Mentirle al regulador sobre la precisión 
   del timestamp sería un defecto de compliance, no una feature.

2. **`integrityHash` field en la canonicalización:**  
   El campo `integrityHash` debe ser `""` al momento de hashear — 
   de lo contrario hay una dependencia circular (el hash depende de 
   sí mismo). Laura validó que `canonicalize()` implementa esto 
   correctamente antes de aprobar el módulo.

3. **Verificación del Test 3 (tamper detection):**  
   Laura verificó manualmente que el test de tampering modifica el 
   archivo en disco y que el segundo logger detecta la rotura en la 
   secuencia correcta (sequence 3, no sequence 2). La detección debe 
   ocurrir en la entrada modificada, no en la siguiente.

**Output de Validación (smoke test — 07 Mayo 2026, 21:30 PST):**

🔐 MAZA Shield — Immutable Audit Log Test
TEST 1: Chain initialization + entries
✓ Entry 1 written — seq: 2
✓ Hash: 83fbd12c287fc7e58fc0d0018bae49a4...
✓ Entry 2 written — seq: 3
✓ Previous hash matches entry 1: true
TEST 2: Chain verification
✓ Chain valid: true
✓ Entries checked: 3
TEST 3: Tamper detection
✓ Tamper detected: true
✓ Chain broken at sequence: 3
✅ All tests passed — IAL is tamper-evident

**Validación Final:**  
Laura Maza | 07 Mayo 2026 | 21:30 PST | Las Vegas, NV  
Commit: `175d4ab` | Rama: `develop`

---

## 4. Declaración de Soberanía Técnica

**Estado de la IP:**  
☑ Asistida por IA bajo supervisión humana directa y control 
arquitectónico exclusivo de Laura Maza.

**Componentes Críticos — El Corazón de la Invención:**

1. **El esquema de chain-linking aplicado a decisiones de riesgo:**  
   No es blockchain. No es un log estándar. Es la aplicación específica 
   de hash-linking criptográfico al problema de transparencia 
   algorítmica en sistemas de detección de fraude en casinos — un 
   dominio donde este approach no tiene precedente publicado conocido.

2. **El campo `decisionLogic` como requerimiento de compliance:**  
   La decisión de hacer este campo obligatorio — y de requerir que sea 
   específico al evento, no genérico — es una decisión de diseño de 
   Laura basada en su interpretación de los requerimientos de la NGCB. 
   No es una práctica estándar en sistemas de audit logging.

3. **La arquitectura de timestamp dual:**  
   La combinación específica de `timestampMs` + `hrtimeOffsetNs` para 
   máxima precisión real en Windows es una solución original al problema 
   de precisión temporal en sistemas de compliance.

4. **El singleton con resume de cadena:**  
   `loadChainState()` permite que el logger retome una cadena existente 
   al reiniciar el proceso — sin romper la secuencia monotónica ni el 
   hash linking. Esta continuidad es crítica para un sistema de 
   compliance que no puede permitirse gaps en el log.

**Clasificación de Secreto Comercial:**  
Este módulo constituye un Trade Secret bajo la Uniform Trade Secrets 
Act (UTSA) adoptada por Nevada. Medidas de protección activas:
- Repositorio privado en GitHub (acceso restringido al equipo MAZALab)
- Este ledger como evidencia de autoría con timestamp verificable
- Commits con fecha y autoría en git log auditable
- No divulgado públicamente en ninguna forma

**Aplicabilidad regulatoria:**  
El IAL está diseñado específicamente para cumplir con los requerimientos 
de transparencia algorítmica de la Nevada Gaming Control Board (NGCB) 
y es compatible con los principios de explicabilidad de modelos de IA 
bajo el marco EU AI Act Artículo 13 (por si MAZALab expande a 
jurisdicciones europeas).
