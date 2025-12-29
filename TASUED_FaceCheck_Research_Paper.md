# FaceCheck: A Multi‑Factor, Web‑Based Attendance Verification System for Tai Solarin University of Education (TASUED)

Author(s): TASUED AttendX Team (CSC 415: Net‑Centric Computing)
Session: 2024/2025
Department: Computer Science, Tai Solarin University of Education, Ijagun, Ogun State, Nigeria

---

## Declaration
This is to certify that this research project is an original work carried out by the authors and has not been submitted elsewhere for the award of a degree. All sources have been duly acknowledged.

## Acknowledgements
[Placeholders for acknowledgements to supervisor, department, contributors, etc.]

---

## Abstract
Attendance integrity is a recurring challenge in higher education, where manual or token‑based methods can be compromised by proxy attendance. This study presents FaceCheck, a web‑based attendance system that combines facial recognition, liveness detection, and geolocation verification to ensure that only physically present, legitimate students can mark attendance. The system is implemented using Next.js/TypeScript on the frontend and Supabase for authentication, realtime, and data persistence. Face recognition is performed in‑browser via face‑api.js/TensorFlow.js to minimize biometric data movement.

Methodologically, the study adopts a design science research approach: requirements analysis, iterative prototyping, empirical evaluation, and refinement. The evaluation framework considers accuracy, latency, usability, and security. Ethical and legal compliance with the Nigeria Data Protection Regulation (NDPR 2019) is addressed through consent, data minimization, encryption, and role‑based access control.

Results from the pilot deployment will be reported in terms of recognition accuracy, false acceptance and rejection rates, time‑to‑verify, and user acceptance surveys. Comparative analysis against QR‑only and manual approaches will be presented. Findings are expected to demonstrate significant reductions in proxy attendance and administrative overhead while maintaining user privacy.

Keywords: Attendance verification, Biometrics, Facial recognition, Liveness detection, Geolocation, Educational technology, NDPR, TASUED.

---

## Table of Contents
- Abstract
- Chapter One: Introduction
  - Background to the Study
  - Statement of the Problem
  - Aim and Objectives of the Study
  - Research Questions
  - Research Hypotheses (if applicable)
  - Scope of the Study
  - Justification/Significance of the Study
  - Limitations of the Study
  - Assumptions
  - Definition of Terms
- Chapter Two: Literature Review
  - Conceptual Review
  - Theoretical Framework
  - Empirical Review
  - Summary and Research Gap
- Chapter Three: Methodology
  - Research Design
  - System Requirements and Constraints
  - System Architecture and Modules
  - Algorithms and Models
  - Data Sources and Collection Procedures
  - Evaluation Metrics and Experimental Design
  - Ethical Considerations
- Chapter Four: System Design and Implementation
  - Overview of Implementation Environment
  - Database Design
  - Application Workflows and UI
  - Security and Privacy Mechanisms
  - Deployment Considerations
- Chapter Five: Results and Discussion
  - Experimental Results
  - Usability Findings
  - Comparative Analysis
  - Discussion of Findings
- Chapter Six: Summary, Conclusion and Recommendations
  - Summary of the Study
  - Conclusion
  - Recommendations
  - Suggestions for Further Work
- References (APA 7th)
- Appendices

---

# Chapter One: Introduction

## 1.1 Background to the Study
Student attendance is a key determinant of academic engagement and performance. Conventional methods (sign‑in sheets, lecturer roll‑calls, swipe cards, or QR‑only systems) are vulnerable to proxy attendance and inefficiency. TASUED, like many institutions in Nigeria, requires scalable, reliable, and privacy‑respecting technological solutions to ensure integrity in attendance processes. Recent advances in web‑native computer vision (e.g., TensorFlow.js, face‑api.js) and secure backend platforms (e.g., Supabase) make it feasible to deploy biometric verification directly in the browser, reducing operational friction and data movement.

## 1.2 Statement of the Problem
- Proxy attendance reduces instructional effectiveness and distorts performance analytics.
- Manual processes are time‑consuming, error‑prone, and difficult to audit.
- QR‑only systems can be shared or scanned remotely, enabling collusion.
- Existing biometric systems may require specialized hardware, raising costs and hygiene concerns.

There is a need for a web‑based, low‑friction attendance system that verifies physical presence and identity, preserves privacy, and integrates with existing university workflows.

## 1.3 Aim and Objectives of the Study
Aim: To design, implement, and evaluate a secure web‑based attendance system that employs facial recognition, liveness detection, and geolocation to eliminate proxy attendance at TASUED.

Objectives:
1. Design a client‑server architecture that performs face recognition in‑browser and stores only minimal biometric templates.
2. Implement multi‑factor verification (QR/session code, geolocation proximity, liveness + face match).
3. Integrate Supabase authentication and role‑based access for students, lecturers, and administrators.
4. Evaluate accuracy, latency, usability, and security under realistic classroom conditions.
5. Ensure compliance with NDPR 2019 and institutional data governance.

## 1.4 Research Questions
1. How effective is in‑browser facial recognition with liveness and geolocation for preventing proxy attendance?
2. What verification latency is acceptable for large classes without disrupting instruction?
3. What privacy and security controls are necessary to comply with NDPR and institutional policies?
4. How do users (students/lecturers) perceive usability and fairness of biometric verification?

## 1.5 Research Hypotheses (optional)
H0: Multi‑factor biometric attendance does not significantly reduce proxy attendance compared to QR‑only methods.
H1: Multi‑factor biometric attendance significantly reduces proxy attendance compared to QR‑only methods.

## 1.6 Scope of the Study
- Context: Undergraduate courses at TASUED (pilot within the Faculty of Science).
- Platform: Web app (Next.js/TypeScript) with Supabase backend.
- Factors: QR/session code, geolocation (100 m default radius), liveness prompts, face recognition.
- Out‑of‑scope: Dedicated mobile app, offline mode, hardware turnstiles, campus‑wide SIS integration (future work).

## 1.7 Justification/Significance of the Study
- Improves academic integrity and accurate analytics.
- Minimizes hardware costs via browser‑based CV and existing webcams.
- Reduces lecturer workload; enables auditable logs and reports.
- Aligns with NDPR via privacy‑by‑design controls.

## 1.8 Limitations of the Study
- Performance may degrade in low‑light or with low‑quality cameras.
- Dependence on stable internet connectivity.
- Potential edge cases: identical twins, drastic appearance changes.

## 1.9 Assumptions
- Students will provide consent and follow liveness prompts.
- Devices have functional cameras and allow location access.
- Network and browser support for WebRTC and WebGL are available.

## 1.10 Definition of Terms
- Biometric Template: Vectorized representation of facial features used for matching rather than storing raw images.
- Liveness Detection: Techniques to distinguish a live person from spoofing attempts (e.g., photos, videos, masks).
- NDPR: Nigeria Data Protection Regulation (2019) governing personal data processing in Nigeria.
- FAR/FRR: False Acceptance Rate / False Rejection Rate.

---

# Chapter Two: Literature Review

## 2.1 Conceptual Review
Overview of attendance systems (manual, token‑based, biometric). Discussion on facial recognition pipeline: detection, alignment, embedding, and matching. Web‑based CV with TensorFlow.js and face‑api.js enables on‑device inference.

## 2.2 Theoretical Framework
- Pattern Recognition and Metric Learning (e.g., embedding spaces where cosine distance reflects identity similarity).
- Security Models for Multi‑Factor Authentication (knowledge + possession + inherence).
- Privacy‑by‑Design principles (data minimization, purpose limitation, storage limitation).

## 2.3 Empirical Review
Summarize recent studies on biometric attendance in universities, typical accuracy/latency, user acceptance, and privacy concerns. Include critiques of QR‑only and fingerprint systems (hygiene, maintenance), and success of hybrid approaches.

## 2.4 Summary and Research Gap
Most existing systems either ignore liveness/geofencing or rely on server‑side processing of raw images. Research gap: a fully browser‑based, multi‑factor approach with minimal biometric data at rest tailored to Nigerian regulatory context and TASUED operational needs.

---

# Chapter Three: Methodology

## 3.1 Research Design
Design Science Research with iterative prototyping, evaluation, and refinement. Mixed‑methods evaluation (quantitative performance metrics and qualitative user feedback).

## 3.2 System Requirements and Constraints
Functional requirements:
- Student enrollment with face embedding creation and consent capture.
- Session creation by lecturers with QR/session code.
- Attendance verification combining code, geolocation, liveness, and face match.
- Real‑time dashboards and exportable reports.

Non‑functional requirements:
- Latency: < 500 ms per verification target (placeholder).
- Availability: > 99% during class hours.
- Privacy: encryption at rest/in transit; data minimization.

Constraints: commodity webcams, classroom lighting, browser compatibility, campus network conditions.

## 3.3 System Architecture and Modules
- Frontend (Next.js + TypeScript): camera capture, model loading, on‑device inference, UI workflows.
- Backend (Supabase): Auth, Postgres DB, Realtime, storage.
- Modules: Face Recognition, Liveness Detection, Geolocation Verification, Session/QR, Reporting.

High‑level Diagram [Placeholder Figure 1]

## 3.4 Algorithms and Models
- Face detection + embedding via face‑api.js (based on FaceNet‑style embeddings).
- Similarity metric: cosine distance threshold tuning.
- Liveness: prompt‑based micro‑gestures (blink/turn head) with timing checks.
- Geolocation: Haversine distance; default max radius 100 m.

Matching Threshold Selection [Placeholder Table 1]

## 3.5 Data Sources and Collection Procedures
- Enrollment captures via webcam; embeddings stored as JSON vectors in DB.
- Logs of verification attempts, device info (non‑PII), and outcomes.
- Pilot deployment across selected classes; collect survey responses from students/lecturers.

## 3.6 Evaluation Metrics and Experimental Design
Metrics:
- Accuracy, FAR, FRR, EER.
- Latency (model load, detection, embedding, end‑to‑end verify).
- Usability (SUS score), acceptance rates, error reports.
- Security: number of thwarted spoofing attempts, geofence violations.

Experimental Design:
- Within‑classroom tests under varied lighting.
- Spoofing tests with printed photos and replayed videos.
- Baseline comparison: manual and QR‑only flows.

Placeholders for Results:
- Table 2: Recognition accuracy across lighting conditions [to be filled]
- Table 3: Latency distribution (p50/p90/p99) [to be filled]
- Table 4: Survey responses summary [to be filled]

## 3.7 Ethical Considerations
- Informed consent at enrollment; opt‑out provisions with alternatives.
- NDPR compliance: lawful basis, purpose limitation, data minimization, retention schedules.
- Encryption of embeddings; separation of identity and biometric templates.
- Access controls; audit logs; DPIA (Data Protection Impact Assessment) recommended.

---

# Chapter Four: System Design and Implementation

## 4.1 Overview of Implementation Environment
- OS: Any (development on macOS/Linux/Windows)
- Node.js: 18+
- Frameworks: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- CV: face‑api.js, TensorFlow.js
- Backend: Supabase (Auth, Postgres, Storage, Realtime)

## 4.2 Database Design (Supabase)
Core tables (aligned with repository schema in lib/supabase/database.sql):
- users(id PK, email, role, first_name, last_name, other_names, phone_number, date_of_birth, profile_photo_url, bio, matric_number, department, level, staff_id, title, office_location, face_descriptor JSONB, is_active, is_email_verified, email_verified_at, created_at, updated_at, last_login_at)
- courses(id PK, code, title, description, credits, department, level, semester, academic_year, lecturer_id FK→users.id, schedule, min_attendance_percentage, max_students, is_active, created_at, updated_at)
- course_enrollments(id PK, course_id FK→courses.id, student_id FK→users.id, enrolled_at, status, attendance_percentage, classes_attended, total_classes, created_at, updated_at) with UNIQUE(course_id, student_id)
- lecture_sessions(id PK, course_id FK→courses.id, lecturer_id FK→users.id, topic, venue, session_date, start_time, end_time, duration_minutes, attendance_code UNIQUE, code_expires_at, status, stats fields, created_at, updated_at, started_at, closed_at)
- attendance_records(id PK, session_id FK→lecture_sessions.id, student_id FK→users.id, course_id FK→courses.id, status, marked_at, marked_by FK→users.id, marking_method, check_in_time, minutes_late, excuse_reason, excuse_approved_by FK→users.id, excuse_approved_at, created_at, updated_at) with UNIQUE(session_id, student_id)
- notifications(id PK, user_id FK→users.id, type, title, message, action_url, is_read, read_at, created_at)
- achievements(id PK, student_id FK→users.id, type, title, description, icon, course_id FK→courses.id, earned_at, metadata)
- attendance_excuses(id PK, attendance_record_id FK→attendance_records.id, student_id FK→users.id, reason, supporting_document_url, status, reviewed_by FK→users.id, reviewed_at, reviewer_notes, created_at, updated_at)
- system_settings(id PK, key UNIQUE, value JSONB, category, description, updated_by FK→users.id, updated_at)
- audit_logs(id PK, user_id FK→users.id, action, resource_type, resource_id, details JSONB, ip_address, user_agent, created_at)

Row Level Security (RLS) is enabled on core tables with policies for self‑access and public reads during development. Production should tighten policies to least privilege.

Figure 2. Entity–Relationship (ER) schema (textual) for FaceCheck
```
users (id PK) ──< courses.lecturer_id (nullable)
users (id PK) ──< course_enrollments.student_id
users (id PK) ──< lecture_sessions.lecturer_id (nullable)
users (id PK) ──< attendance_records.marked_by (nullable)
users (id PK) ──< notifications.user_id
users (id PK) ──< achievements.student_id
users (id PK) ──< attendance_excuses.reviewed_by (nullable)

courses (id PK)
  └──< course_enrollments.course_id
  └──< lecture_sessions.course_id
  └──< attendance_records.course_id
  └──< achievements.course_id (nullable)

lecture_sessions (id PK)
  └──< attendance_records.session_id
  └──< attendance_excuses.attendance_record_id (via attendance_records)
```

Data Privacy Notes:
- face_descriptor stored as JSONB embedding; encrypt at rest and separate from PII fields; avoid storing raw images by default (NDPR, 2019).
- RLS should ensure students can only read their own records; lecturers can only read records for their courses; admins/HODs have broader read scopes.

## 4.3 Application Workflows and UI
- Enrollment: capture -> detect -> align -> embed -> consent -> store.
- Verification: scan QR/enter code -> get geolocation -> liveness prompts -> face match -> record attendance.
- Reporting: lecturer dashboards; export to CSV/PDF.

Screenshots [Appendix A]: enrollment UI, verification UI, dashboards.

## 4.4 Security and Privacy Mechanisms
- Supabase auth tokens; role‑based policies (RLS) on tables.
- TLS in transit; encryption for face_descriptor; key management guidance.
- Rate limiting and anomaly detection on verification attempts.
- No storage of raw videos/images by default; optional ephemeral buffering only.

## 4.5 Deployment Considerations
- Model hosting under /public/models with caching headers.
- CDN for static assets; prefetch models after login.
- Environment variables for Supabase; secrets rotation.
- Monitoring: error tracking, performance metrics.

---

# Chapter Five: Results and Discussion

## 5.1 Experimental Results [Placeholders]
- Table 2: Recognition accuracy per condition – to be populated after pilot.
- Table 3: Latency distribution – to be populated after pilot.
- Table 4: Survey summary (SUS, acceptance) – to be populated after pilot.
- Figure 3: ROC/DET curves – placeholder.

## 5.2 Usability Findings [Placeholder]
- Summarize qualitative feedback from students and lecturers.

## 5.3 Comparative Analysis [Placeholder]
- Manual vs QR‑only vs FaceCheck (proxy incidents, time‑to‑mark, lecturer overhead).

## 5.4 Discussion of Findings [Placeholder]
- Interpret results vis‑à‑vis literature; discuss trade‑offs and threats to validity.

---

# Chapter Six: Summary, Conclusion and Recommendations

## 6.1 Summary of the Study
This research designed and implemented a browser‑based, multi‑factor attendance system tailored for TASUED, integrating geolocation, liveness detection, and facial recognition to mitigate proxy attendance.

## 6.2 Conclusion
FaceCheck operationalizes privacy‑preserving biometric verification within a standard web stack, demonstrating a practical path for Nigerian universities to enhance academic integrity with minimal hardware investment.

## 6.3 Recommendations
- Institutionalize a consent‑based policy and clear SOPs for biometric attendance.
- Provide classroom lighting and connectivity guidelines.
- Conduct threshold tuning per venue; continuous monitoring of FAR/FRR.
- Extend to offline‑tolerant modes and mobile apps in future iterations.

## 6.4 Suggestions for Further Work
- Multimodal biometrics (voice, keystroke dynamics) for accessibility.
- Federated learning for on‑device model updates without raw data sharing.
- Deeper SIS/LMS integration; attendance‑performance analytics.

---

## References (APA 7th)
- Jain, A. K., Ross, A., & Nandakumar, K. (2011). Introduction to biometrics. Springer.
- Schroff, F., Kalenichenko, D., & Philbin, J. (2015). FaceNet: A unified embedding for face recognition and clustering. In Proceedings of the IEEE Conference on Computer Vision and Pattern Recognition (pp. 815–823).
- Taigman, Y., Yang, M., Ranzato, M., & Wolf, L. (2014). DeepFace: Closing the gap to human-level performance in face verification. In Proceedings of the IEEE Conference on Computer Vision and Pattern Recognition (pp. 1701–1708).
- Nigeria Data Protection Regulation. (2019). National Information Technology Development Agency (NITDA). https://nitda.gov.ng
- TensorFlow.js. (n.d.). Machine learning for JavaScript developers. https://www.tensorflow.org/js
- face-api.js. (n.d.). GitHub repository. https://github.com/justadudewhohacks/face-api.js
- Supabase. (n.d.). The open source Firebase alternative. https://supabase.com
- WebRTC. (n.d.). Media capture and streams. https://developer.mozilla.org/en-US/docs/Web/API/Media_Capture_and_Streams_API

[Add course texts, regional studies, and TASUED policy documents as needed; ensure all in‑text citations match reference list.]

---

## Appendices

### Appendix A: System Screenshots [Placeholders]
- Enrollment UI
- Verification flow (QR -> geofence -> liveness -> match)
- Lecturer dashboard and reports

### Appendix B: Technical Specifications
- Model files and versions; embedding dimensions; matching thresholds (to be finalized post‑tuning).
- Hardware profiles used in tests (CPU/GPU, camera types).
- Browser versions, caching strategies.

### Appendix C: Data Collection Instruments
- Student survey questionnaire (SUS and acceptance items)
- Lecturer interview guide
- Consent form template aligned with NDPR
