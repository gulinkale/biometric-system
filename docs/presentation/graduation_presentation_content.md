# Graduation Project Presentation Content

Project title: **Biometric Identification with Liveness Detection**

This PowerPoint-ready draft follows a CMSE/CMPE 406 capstone-style presentation/report structure. It is evidence-based and avoids unverified claims. Main deck target: **16 slides**. Detailed API/database material is moved to the Appendix.

Important claim boundary:
- Do not claim production readiness.
- Do not invent accuracy, FAR, FRR, or latency.
- AASIST is presented as a **spoof-risk scoring component**, not as a hard rejection gate in the current prototype.

## Main Slides

## Slide 1 - Title

**Bullet points**
- Biometric Identification with Liveness Detection
- Software Engineering Capstone Project
- Team/member: [Name Surname]
- Course/Semester: [CMSE/CMPE 406 / Semester]
- Supervisor: [Supervisor Name]

**Speaker notes**
Introduce the project as an end-to-end biometric authentication prototype combining face identification, voice verification, liveness-oriented checks, and web login flows.

**Suggested diagram/visual**
Simple pipeline: Web Client -> FastAPI Backend -> Biometric Models -> Authentication Decision.

**Related code evidence**
- `README.md`
- `backend/app/main.py`
- `clients/portal/pages/biometric/identify.html`
- `clients/bank/pages/biometric/identify.html`

## Slide 2 - Problem Definition

**Bullet points**
- Password-only authentication can be weak against reuse, guessing, and theft.
- Biometric login improves identity assurance but introduces spoofing risks.
- Face systems may be attacked with photos/screens; voice systems may face replay attempts.
- Secure access needs both identity matching and liveness-oriented checks.
- This project combines face, voice, challenge, and feedback mechanisms.

**Speaker notes**
The problem is not only matching a biometric sample. A usable authentication flow must also detect poor captures, suspicious behavior, and likely spoof attempts.

**Suggested diagram/visual**
Threat model: password attack, face spoof, voice replay -> multimodal verification.

**Related code evidence**
- `backend/app/services/authentication_service.py::identify_face`
- `backend/app/services/authentication_service.py::verify`
- `backend/app/api/routes_identify.py::identify_pose_check`
- `backend/app/api/routes_identify.py::identify_blink_check`
- `backend/app/services/voice_spoof_detector.py::detect_spoof`

## Slide 3 - Motivation and Impact

**Bullet points**
- Relevant to banking, portals, and secure access systems.
- Multi-client structure demonstrates reusable authentication services.
- Economic impact: may reduce account misuse and manual verification effort.
- Environmental impact: uses existing PC camera/microphone hardware.
- Societal impact: improves access security but must protect privacy and avoid unfair rejection.

**Speaker notes**
The project is motivated by real login scenarios where stronger identity verification is valuable. At the same time, biometric systems must be handled carefully because false rejection and privacy risks affect users directly.

**Suggested diagram/visual**
Four-impact grid: global, economic, environmental, societal.

**Related code evidence**
- Portal client: `clients/portal`
- Bank client: `clients/bank`
- Portal header: `clients/portal/assets/js/api.js::jsonFetch`
- Bank header: `clients/bank/assets/js/api.js::jsonFetch`
- Client-aware lookup: `backend/app/services/authentication_service.py::_get_user_by_username`

## Slide 4 - Project Objectives

**Bullet points**
- Identify users using face embeddings.
- Verify identity using voice embeddings.
- Add liveness-oriented checks: pose, blink, and voice challenge.
- Provide reason-code based user feedback.
- Support client-separated enrollment and authentication flows.

**Speaker notes**
The objective is to build a working prototype that connects biometric processing, API design, frontend flows, and security controls into one demonstrable system.

**Suggested diagram/visual**
Objective checklist: face, voice, liveness, feedback, client separation.

**Related code evidence**
- `backend/app/api/routes_auth.py::verify`
- `backend/app/api/routes_identify.py`
- `backend/app/api/routes_enrollment.py::enroll_biometric`
- `backend/app/domain/reason_codes.py::normalize_reason_code`

## Slide 5 - Main Contribution

**Bullet points**
- End-to-end biometric authentication prototype.
- Face identification + voice verification in one web flow.
- Liveness-oriented checks for pose, blink, and voice challenge.
- Multi-client portal/bank login separation.
- AASIST integrated as spoof-risk scoring, not hard blocking.

**Speaker notes**
The main contribution is integration: the project combines backend services, biometric models, frontend capture flows, reason-code feedback, client separation, and risk scoring into a coherent capstone prototype.

**Suggested diagram/visual**
Contribution map centered on "Integrated Biometric Auth Prototype".

**Related code evidence**
- `backend/app/services/authentication_service.py`
- `backend/app/api/routes_auth.py`
- `backend/app/api/routes_enrollment.py`
- `backend/app/api/routes_identify.py`
- `clients/portal/assets/js/identify.js`
- `clients/bank/assets/js/api.js`

## Slide 6 - Standards and Engineering Practices

**Bullet points**
- Secure development practices: password hashing, token auth, input validation.
- Biometric evaluation concepts: accuracy, FAR, FRR, liveness pass/fail rate.
- Privacy-aware handling: templates are sensitive biometric data.
- Ethical handling: consent, responsible testing, no pirated software.
- Open-source engineering tools: FastAPI, SQLAlchemy, pytest, ML libraries.

**Speaker notes**
This slide discusses engineering practices and evaluation concepts, not formal certification. The repository supports secure practices such as bcrypt hashing and JWT authentication, but full standards compliance is not claimed.

**Suggested diagram/visual**
Practice matrix: security, privacy, evaluation, ethics, open-source tooling.

**Related code evidence**
- Password hashing: `backend/app/core/security.py::hash_password`
- JWT: `backend/app/core/security.py::create_access_token`
- Validation: `backend/app/domain/schemas.py`
- Tests: `backend/app/tests/test_fusion.py`
- Requirements: `backend/requirements.txt`

## Slide 7 - System Overview

**Bullet points**
- FastAPI backend with auth, enroll, identify, and admin routers.
- Browser frontend clients for portal and bank.
- Enrollment stores processed face and voice templates.
- Biometric login identifies face, checks liveness/security, then verifies face+voice.
- Final response includes decision, scores, reason, and spoof-risk fields.

**Speaker notes**
The system is modular. API routes handle requests, service classes perform biometric logic, and frontend pages guide the user through login, enrollment, and verification.

**Suggested diagram/visual**
High-level architecture: clients -> API routers -> services -> database/models.

**Related code evidence**
- `backend/app/main.py`
- `backend/app/api/routes_auth.py`
- `backend/app/api/routes_enrollment.py`
- `backend/app/api/routes_identify.py`
- `backend/app/api/routes_admin.py`
- `clients/portal/assets/js/api.js`

## Slide 8 - Technologies Used

**Bullet points**
- Backend/API: FastAPI, Pydantic, SQLAlchemy async, JWT.
- Face: InsightFace Buffalo_L, OpenCV, MediaPipe FaceMesh.
- Voice: Resemblyzer, Librosa, SoundFile.
- Spoof-risk scoring: PyTorch + AASIST checkpoint.
- Testing/tools: pytest, documented CSV/manual evidence.

**Speaker notes**
Every listed technology is visible in requirements or implementation files. InsightFace extracts 512-dimensional face embeddings. Resemblyzer extracts 256-dimensional voice embeddings. AASIST produces spoof-risk output.

**Suggested diagram/visual**
Technology stack grouped by backend, face, voice, security, testing.

**Related code evidence**
- `backend/requirements.txt`
- `backend/app/services/face_processor.py`
- `backend/app/services/eye_state_detector.py`
- `backend/app/services/voice_processor.py`
- `backend/app/services/voice_spoof_detector.py`
- `backend/app/services/aasist_model.py`

## Slide 9 - System Architecture

**Bullet points**
- `backend/app/api`: HTTP route layer.
- `backend/app/services`: biometric and authentication logic.
- `backend/app/db`: SQLAlchemy models/session.
- `backend/app/domain`: request schemas and reason codes.
- `clients/portal`, `clients/bank`, `clients/shared`: frontend layers.

**Speaker notes**
The architecture follows a layered structure. Routes decode API requests and call services. Services perform matching, liveness, encryption/decryption, and fusion. Domain files keep schemas and reason codes consistent.

**Suggested diagram/visual**
Folder-to-layer architecture diagram.

**Related code evidence**
- `backend/app/main.py`
- `backend/app/db/models.py`
- `backend/app/domain/schemas.py`
- `backend/app/domain/reason_codes.py`
- `clients/shared/assets/js/reason-codes.js`

## Slide 10 - Enrollment Flow

**Bullet points**
- Enrollment requires an existing user account.
- Face enrollment captures center, left, and right samples.
- Backend requires 5 face samples per angle and 10 voice samples.
- Duplicate face/voice checks compare against same-client users.
- Security-question answers are stored after biometric enrollment.

**Speaker notes**
The frontend guides the user through face, voice, and security-question steps. The backend validates samples, averages templates, checks duplicate biometrics, encrypts feature blobs, and stores records.

**Suggested diagram/visual**
Sequence: account -> face samples -> voice samples -> security questions -> stored templates.

**Related code evidence**
- `clients/portal/pages/biometric/enroll.html`
- `clients/portal/assets/js/enroll.js`
- `backend/app/domain/schemas.py::BiometricEnrollRequest`
- `backend/app/api/routes_enrollment.py::enroll_biometric`
- `backend/app/services/authentication_service.py::_upsert_biometric_vector`
- `backend/app/services/authentication_service.py::save_voice_template_vector`
- `backend/app/services/security_question_service.py::save_user_answers`

## Slide 11 - Identification and Verification Flow

**Bullet points**
- User starts biometric login and captures a face frame.
- Backend performs 1:N face identification inside the current client.
- Face quality checks include yaw, frontal pose, eyes, face size, and blur.
- Frontend then runs security/liveness steps.
- Final `/auth/verify` combines face and voice scores.

**Speaker notes**
Initial face identification finds the candidate user. Final verification confirms the same identity using voice and fusion scoring. This separation makes the flow easier to explain and debug.

**Suggested diagram/visual**
Pipeline: Face capture -> identify user -> liveness/security -> voice capture -> final verify.

**Related code evidence**
- `clients/portal/pages/biometric/identify.html`
- `clients/portal/assets/js/api.js::apiIdentifyFace`
- `clients/portal/assets/js/api.js::apiAuthVerify`
- `backend/app/api/routes_identify.py::identify`
- `backend/app/services/authentication_service.py::identify_face`
- `backend/app/api/routes_auth.py::verify`

## Slide 12 - Liveness Detection and Spoof-Risk Scoring

**Bullet points**
- Pose checks validate right/left movement and expected identity.
- Blink check uses multiple frames and eye aspect ratio.
- Dynamic voice challenge validates expected words/numbers.
- AASIST produces `spoof_score` and `spoof_decision`.
- Current limitation: AASIST is not enforced as mandatory rejection.

**Speaker notes**
Current limitation: AASIST is integrated and produces a spoof score/spoof decision field, but in the current prototype it is not enforced as a mandatory rejection rule in the final authentication decision. It should be treated as risk scoring until calibrated.

**Suggested diagram/visual**
Liveness gates with AASIST shown as "risk signal" feeding the final response.

**Related code evidence**
- `backend/app/api/routes_identify.py::identify_pose_check`
- `backend/app/api/routes_identify.py::identify_blink_check`
- `backend/app/api/routes_identify.py::generate_voice_challenge`
- `backend/app/api/routes_identify.py::validate_identify_voice_challenge`
- `backend/app/services/eye_state_detector.py::are_eyes_open`
- `backend/app/services/voice_spoof_detector.py::detect_spoof`
- `backend/app/services/authentication_service.py::verify`

## Slide 13 - Security Features and Ethical Issues

**Bullet points**
- JWT authentication and client-aware user lookup.
- Bcrypt password hashing and hashed security answers.
- Biometric feature encryption helpers used for template storage.
- Reason-code feedback helps users understand failures.
- Ethical risks: privacy, consent, data theft, false accept/reject consequences.

**Speaker notes**
Security and ethics are linked. Biometric data is sensitive, cannot be reset like a password, and must be protected. False accepts can allow unauthorized access; false rejects can unfairly block real users.

**Suggested diagram/visual**
Security/ethics balance scale: protection, usability, privacy, fairness.

**Related code evidence**
- JWT: `backend/app/core/security.py::create_access_token`, `decode_access_token`
- Auth dependency: `backend/app/api/dependencies/auth.py::get_current_user`
- Password hashing: `backend/app/core/security.py::hash_password`, `verify_password`
- Security answers: `backend/app/core/security.py::hash_security_answer`
- Biometric encryption: `backend/app/core/security.py::encrypt_feature_blob`, `decrypt_feature_blob`
- Reason codes: `backend/app/domain/reason_codes.py`

## Slide 14 - Testing and Evaluation

**Bullet points**
- Fusion logic has pytest unit tests.
- Voice spoof CSV exists with live/replay examples.
- Endpoint paths exist for common failure cases.
- Manual scenario tests are defined for core authentication flows.
- Full FAR/FRR/accuracy/latency benchmark is future work.

**Manual scenario testing table**

| Test Case | Expected Result | Actual Result | Pass/Fail | Evidence |
| --------- | --------------- | ------------- | --------- | -------- |
| Correct enrolled user | Accepted after face, liveness, and voice verification | Manual scenario confirms successful end-to-end flow when enrolled samples match | Pass | `/identify/`, `/identify/pose-check`, `/identify/blink-check`, `/auth/verify`; frontend result screen |
| Wrong user face | Rejected before access | Access is rejected because the identity does not match. Error handling and retry flow can be improved if needed. | Pass / UX improvement needed | `AuthenticationService.identify_face`; `FACE_NOT_IDENTIFIED`, `ACQ_FACE_MISMATCH` |
| No face detected | Rejected with clear retry option | Access is rejected. In some cases, the flow may stop with an error message instead of smooth retry. | Pass / UX improvement needed | `routes_identify.py::identify`; `FaceProcessor.extract_embedding_and_pose`; `ACQ_NO_FACE` |
| Multiple faces detected | Rejected to avoid ambiguous identity | Access is rejected to avoid ambiguous identity. User-facing recovery can be improved. | Pass / UX improvement needed | `AuthenticationService.identify_face`; `routes_identify.py::identify_pose_check`; `ACQ_MULTIPLE_FACES` |
| Pose mismatch | Rejected during pose challenge | Access is rejected when expected movement is not satisfied. Retry guidance can be improved. | Pass / UX improvement needed | `routes_identify.py::identify_pose_check`; `ACQ_POSE_MISMATCH`, `ACQ_POSE_NOT_ENOUGH_TURN` |
| Blink not detected | Rejected during blink challenge | Access is rejected when blink evidence is not clear. Better retry feedback is future work. | Pass / UX improvement needed | `routes_identify.py::identify_blink_check`; `EyeStateDetector`; `ACQ_BLINK_NOT_DETECTED` |
| Face quality failure | Rejected when capture quality is insufficient | The system fails closed for blurry, non-frontal, too-small, or eyes-closed captures. User-facing recovery flow should be improved. | Pass / UX improvement needed | `ACQ_FACE_BLURRY`, `ACQ_FACE_NOT_FRONTAL`, `ACQ_FACE_TOO_SMALL`, `ACQ_EYES_CLOSED` |
| Duplicate face enrollment | Blocked | Duplicate face precheck/save flow compares against same-client users and blocks high similarity | Pass | `routes_enrollment.py::precheck_face_duplicate`; `AuthenticationService.precheck_face_duplicate`; `ENROLL_DUPLICATE_FACE` |
| Duplicate voice enrollment | Blocked | Duplicate voice precheck/save flow compares against same-client users and blocks high similarity | Pass | `routes_enrollment.py::precheck_voice_duplicate`; `AuthenticationService.precheck_voice_duplicate`; `ENROLL_DUPLICATE_VOICE` |
| Voice replay/spoof attempt | Spoof risk should be reported | AASIST produces `spoof_score` and `spoof_decision`, but it is not yet enforced as a hard rejection rule in the final authentication decision | Observed/Partial | `VoiceSpoofDetector.detect_spoof`; `/auth/verify` response fields; hard blocking is future work |

**AASIST note**
AASIST produces `spoof_score` and `spoof_decision`, but it is not yet enforced as a hard rejection rule in the final authentication decision. Therefore this test is reported as Observed/Partial, and hard blocking is listed as future work.

**Corrective Actions / Future Testing**
- Calibrate thresholds using live and replay samples.
- Connect AASIST spoof decision to final authentication after calibration.
- Measure FAR, FRR, accuracy, liveness pass/fail rate, and latency.
- Record screenshots/logs for each manual test case.

**Speaker notes**
The current prototype includes implementation-level tests and manual scenario tests. A complete statistical benchmark with FAR, FRR, accuracy, and latency requires a larger controlled dataset and is listed as future work. For failure scenarios, the system follows a fail-closed behavior: it does not grant access when face, pose, blink, duplicate, or quality checks fail. Some rejection cases may still need smoother retry flow and clearer user-facing messages.

**Suggested diagram/visual**
Testing matrix plus "future benchmark" callout.

**Related code evidence**
- `backend/app/tests/test_fusion.py`
- `backend/test_audio_spoof_results.csv`
- `backend/app/api/routes_identify.py`
- `backend/app/api/routes_enrollment.py`
- `backend/app/services/authentication_service.py`

## Slide 15 - Limitations and Realistic Constraints

**Bullet points**
- Prototype, not production-ready.
- No complete FAR/FRR benchmark yet.
- AASIST score is not yet connected to hard rejection.
- Camera, microphone, lighting, browser, and pose quality affect performance.
- Some failed liveness or capture scenarios may stop the flow instead of providing a smooth retry experience.
- Thresholds, dataset size, and migration/security state require verification.

**Speaker notes**
Realistic constraints include standard PC webcams, microphone quality, limited test data, browser/device differences, threshold sensitivity, privacy constraints, and prototype-level deployment.

**Suggested diagram/visual**
Constraints table: hardware, environment, model, evaluation, security.

**Related code evidence**
- Thresholds: `backend/app/core/config.py`
- Face quality: `backend/app/services/face_processor.py`
- Voice preprocessing: `backend/app/services/voice_processor.py`
- Migration scripts: `backend/scripts/hash_existing_passwords.py`, `backend/scripts/encrypt_existing_biometric_data.py`
- Frontend token storage: `clients/portal/assets/js/portal.js`

## Slide 16 - Future Improvements and Conclusion

**Bullet points**
- Calibrate AASIST with live/replay samples before hard blocking.
- Report FAR, FRR, accuracy, liveness pass/fail rate, and latency.
- Improve recovery flow and user guidance after failed capture, pose, blink, or face-quality checks.
- Improve audit logging, deployment security, and browser/mobile compatibility.
- Add larger and more diverse evaluation data.
- The project demonstrates an integrated multimodal biometric login prototype.

**Speaker notes**
Future work should connect AASIST spoof decision to final authentication only after threshold calibration. Evaluate false reject impact before enabling hard blocking to avoid blocking legitimate users due to poorly calibrated spoof thresholds.

**Suggested diagram/visual**
Roadmap ending in "validated secure biometric authentication prototype".

**Related code evidence**
- AASIST: `backend/app/services/voice_spoof_detector.py`
- Fusion: `backend/app/services/fusion.py`
- Audit model/logger: `backend/app/db/models.py::AuditLog`, `backend/app/services/audit_logger.py`
- Full flow: `backend/app/services/authentication_service.py`

## Appendix A - API Endpoints

| Endpoint | Method | Purpose | Request data | Response data | Related file/function |
| --- | --- | --- | --- | --- | --- |
| `/health` | GET | Health check | none | status/app | `backend/app/main.py::health` |
| `/auth/login` | POST | Password login and JWT issue | username, password | token, username, role | `routes_auth.py::login` |
| `/auth/me/biometric-status` | GET | Check enrolled templates | Bearer token | face/voice enrolled flags | `routes_auth.py::get_my_biometric_status` |
| `/auth/verify` | POST | Final face+voice verification | face image, voice wav | decision, scores, spoof fields | `routes_auth.py::verify` |
| `/identify/` | POST | 1:N face identify | face image | identified user, score, debug fields | `routes_identify.py::identify` |
| `/identify/voice-challenge` | GET | Create dynamic phrase | none | prompt, expected terms | `routes_identify.py::get_identify_voice_challenge` |
| `/identify/voice-challenge/validate` | POST | Validate spoken phrase transcript | answer text | passed/reason/hits | `routes_identify.py::validate_identify_voice_challenge` |
| `/identify/pose-check` | POST | Validate pose/turn | image, required turn | passed/reason/similarity | `routes_identify.py::identify_pose_check` |
| `/identify/blink-check` | POST | Validate blink frames | frame list | passed/reason/EAR stats | `routes_identify.py::identify_blink_check` |
| `/identify/security-question` | GET | Get one user question | user_id | question | `routes_identify.py::get_security_question` |
| `/identify/security-answer` | POST | Verify security answer | user_id, question_id, answer | answer_ok | `routes_identify.py::verify_security_answer_endpoint` |
| `/enroll/precheck/face` | POST | Face duplicate precheck | username, face image | duplicate result | `routes_enrollment.py::precheck_face_duplicate` |
| `/enroll/precheck/voice` | POST | Voice duplicate precheck | username, voice wav | duplicate result | `routes_enrollment.py::precheck_voice_duplicate` |
| `/enroll/biometric` | POST | Save biometric enrollment | username, role, face/voice samples | enrollment status | `routes_enrollment.py::enroll_biometric` |
| `/enroll/security-questions` | GET | List questions | none | question list | `routes_enrollment.py::get_security_questions` |
| `/enroll/security-answers` | POST | Save answer hashes | user_id, answers | success message | `routes_enrollment.py::save_security_answers` |
| `/admin/users` | POST | Admin user creation | username, password, role, client | created user | `routes_admin.py::create_user` |

## Appendix B - Database Models

**User**
- Fields: `user_id`, `username`, `client`, `password_hash`, `role`, `is_active`
- Evidence: `backend/app/db/models.py::User`

**BiometricData**
- Fields: `data_id`, `type`, `timestamp`, `enc_feature_blob`, `user_id`
- Stores processed biometric templates/features, not raw photos or raw audio recordings.
- Evidence: `backend/app/db/models.py::BiometricData`

**SecurityQuestion / UserSecurityAnswer**
- Stores active questions and hashed user answers.
- Evidence: `backend/app/db/models.py::SecurityQuestion`, `UserSecurityAnswer`

**AuditLog**
- Database audit model exists.
- Separate JSONL audit logger also exists.
- Evidence: `backend/app/db/models.py::AuditLog`, `backend/app/services/audit_logger.py`

**Needs verification**
- Whether production/Supabase data has been migrated.
- Whether DB-level `(username, client)` uniqueness has been added outside the SQLAlchemy model.

## Appendix C - Extra Code Evidence

**Face processing**
- InsightFace Buffalo_L: `backend/app/services/face_processor.py::FaceProcessor.__init__`
- 512-dimensional embeddings stated in docstring: `FaceProcessor`
- Blur/yaw/bbox/nose ratio: `extract_embedding_and_pose`

**Voice processing**
- Resemblyzer encoder: `backend/app/services/voice_processor.py::_get_encoder`
- 256-dimensional embeddings stated in `extract_embedding`
- Audio preprocessing: `_validate_and_preprocess`

**Fusion**
- Weighted score: `backend/app/services/fusion.py::fuse`
- Unit tests: `backend/app/tests/test_fusion.py`

**AASIST**
- Model class: `backend/app/services/aasist_model.py`
- Detector: `backend/app/services/voice_spoof_detector.py::VoiceSpoofDetector`
- Checkpoint file exists: `backend/models/AASIST.pth`

**Migrations/security scripts**
- Password migration: `backend/scripts/hash_existing_passwords.py`
- Biometric encryption migration: `backend/scripts/encrypt_existing_biometric_data.py`

## Appendix D - 3-Minute Presentation Script

Hello, today I will present my graduation project, **Biometric Identification with Liveness Detection**.

The problem is that password-only authentication is not enough for many secure systems. Passwords can be stolen or reused, and biometric systems also have risks such as photo spoofing and replayed voice. This project addresses that problem by combining face identification, voice verification, and liveness-oriented checks.

The system has a FastAPI backend and browser-based portal and bank clients. During enrollment, an existing user records face samples from center, left, and right angles, records voice samples, and saves security-question answers. The backend checks for duplicate face and voice templates before saving.

For biometric login, the user first captures a face image. The backend uses InsightFace to extract a face embedding and compares it against enrolled templates for the selected client. The flow then continues with security and liveness steps, including a security answer, head-turn checks, blink detection, and a dynamic voice challenge.

The final verification combines face and voice scores using weighted fusion. Voice embeddings are generated with Resemblyzer. The system also integrates AASIST, but currently AASIST is used as a spoof-risk scoring component. It returns a spoof score and spoof decision field; it is not yet enforced as a mandatory rejection rule.

Security features include JWT authentication, client separation, bcrypt password hashing, hashed security answers, encrypted biometric feature handling, reason-code feedback, and duplicate biometric prevention. However, this is a capstone prototype, not a production-ready system. A full FAR, FRR, accuracy, and latency evaluation remains future work.

In conclusion, this project demonstrates an end-to-end multimodal biometric login prototype with face, voice, liveness-oriented checks, and web integration.

## Appendix E - 7-10 Minute Presentation Script

Good [morning/afternoon]. My project is called **Biometric Identification with Liveness Detection**.

The motivation comes from a common security issue: password-only authentication is weak when passwords are reused, guessed, or stolen. Biometric authentication improves identity assurance, but it also creates new risks. A face recognition system may be attacked using a photo or a screen, and a voice system may be attacked using replayed audio. Therefore, this project combines biometric identification with liveness-oriented checks and spoof-risk scoring.

At a high level, the system consists of a FastAPI backend, a database, and two browser-based clients: portal and bank. The backend is organized into route modules for authentication, enrollment, identification, and admin operations. The frontend calls the backend through JavaScript API wrappers. Each client sends an `X-Client` header, so authentication and biometric comparisons are separated by client.

The main contribution is integration. The project connects face identification, voice verification, liveness-oriented checks, multi-client web login, reason-code based feedback, and AASIST spoof-risk scoring into a single working prototype.

During enrollment, the user must already have an account. The user records face samples from three angles: center, left, and right. The backend requires five samples per angle. These samples are averaged into pose-aware face templates. The user also records ten voice samples, and the backend creates a speaker embedding template. Finally, the user saves three security-question answers, which are normalized and hashed.

Face recognition is implemented in the `FaceProcessor` service. It uses InsightFace with the Buffalo_L model configuration and extracts 512-dimensional face embeddings. It also estimates quality signals such as nose position, yaw, bounding box size, and blur. During identification, the backend compares the captured face embedding against stored templates using cosine similarity. It can reject poor-quality cases such as no face, multiple faces, non-frontal pose, eyes closed, small face, or blurry face.

Voice verification uses the `VoiceProcessor` service. It uses Librosa for preprocessing and Resemblyzer to generate 256-dimensional speaker embeddings. In the final verification flow, the backend compares the captured voice embedding with the stored voice template. It then computes a fused score using the fusion function, where face has a default weight of 0.55 and voice has a default weight of 0.45.

The liveness-oriented flow has multiple parts. Pose checks validate right and left turns. Blink checks use multiple frames and eye aspect ratio. The voice challenge generates a dynamic Turkish sentence containing date or number information, and the backend validates expected keywords and numbers.

In failed capture or liveness cases, the system is designed to fail closed and not grant access. However, smoother retry handling and clearer user feedback are future improvements.

The system also includes AASIST for voice spoof-risk scoring. Current limitation: AASIST is integrated and produces a spoof score/spoof decision field, but in the current prototype it is not enforced as a mandatory rejection rule in the final authentication decision. A future improvement is to collect live and replay samples, calibrate the threshold, evaluate false reject impact, and then connect high spoof risk to automatic rejection.

Security features include JWT authentication, bcrypt password hashing, hashed security answers, client-aware lookup, biometric feature encryption helpers, and reason-code feedback. Ethical issues are also important because biometric data is sensitive. The system must consider user consent, data theft risk, false accept consequences, and false reject consequences.

Testing evidence is limited but present. There are unit tests for fusion scoring and a CSV with audio spoof experiments. However, the repository does not contain a full controlled benchmark. Therefore, I do not claim specific accuracy, FAR, FRR, or latency values. These should be measured in future work with a defined dataset.

The main limitations are prototype-level deployment, threshold sensitivity, camera and microphone quality, limited testing data, and the fact that AASIST is not yet a hard-blocking decision. Future improvements include controlled live/replay spoof testing, FAR and FRR reporting, stronger audit logging, improved browser/mobile compatibility, and larger evaluation datasets.

To conclude, this project demonstrates an integrated multimodal biometric authentication prototype. It shows how face identification, voice verification, liveness-oriented checks, security controls, and web clients can work together in a capstone-level software engineering system.

## Appendix F - Jury Questions and Answers

**Q1: Is this system production-ready?**  
A: No. It is a capstone prototype. Production use would require controlled evaluation, hardening, rate limiting, stronger audit integration, deployment security, and operational monitoring.

**Q2: What is the main contribution?**  
A: The main contribution is an integrated end-to-end prototype combining face identification, voice verification, liveness-oriented checks, multi-client login, reason-code feedback, and AASIST spoof-risk scoring.

**Q3: Why use both face and voice?**  
A: Face and voice provide different biometric signals. Combining them reduces dependence on one modality and enables fusion scoring.

**Q4: Why not hash biometric templates?**  
A: Biometric matching needs similarity comparison between vectors. Hashing is suitable for exact password verification, but biometric embeddings must be recoverable for comparison. Therefore, encryption is more appropriate.

**Q5: What model is used for face recognition?**  
A: The code uses InsightFace `FaceAnalysis(name="buffalo_l")` in `backend/app/services/face_processor.py`.

**Q6: What model is used for voice identity?**  
A: The code uses Resemblyzer `VoiceEncoder` in `backend/app/services/voice_processor.py`.

**Q7: Does AASIST block spoof attacks?**  
A: Not yet as a mandatory rule. Current limitation: AASIST is integrated and produces a spoof score/spoof decision field, but in the current prototype it is not enforced as a mandatory rejection rule in the final authentication decision.

**Q8: How should AASIST be improved?**  
A: After collecting live and replay voice samples, calibrate the spoof threshold and connect the AASIST spoof decision to the final authentication policy. If spoof risk is above the threshold, the system should reject the login attempt, while avoiding false rejection of real users.

**Q9: How is the final score calculated?**  
A: `backend/app/services/fusion.py` computes a weighted score with default weights of 0.55 for face and 0.45 for voice.

**Q10: How is portal/bank separation implemented?**  
A: Each frontend sends an `X-Client` header, and backend queries filter users/templates by client.

**Q11: What are the current test results?**  
A: The repository contains fusion unit tests and a small voice spoof CSV, but no complete benchmark. Accuracy, FAR, FRR, and latency should be measured in controlled future evaluation.

**Q12: What are the main ethical risks?**  
A: Biometric privacy, data theft, user consent, false accept consequences, false reject consequences, and misuse of access control.

**Q13: What happens if the system gives an error during no-face, pose, or blink failure?**  
A: The important security behavior is fail-closed: access is not granted when the required biometric or liveness evidence is missing. Some rejection cases may still need smoother retry flow and clearer user-facing messages, so this is listed as a UX and robustness improvement.

## Appendix G - Technical Terms

- **Biometric authentication:** Verifying identity using traits such as face or voice.
- **Enrollment:** Registering biometric templates for later comparison.
- **Embedding:** Numeric vector representing a face or voice sample.
- **Template:** Stored biometric embedding.
- **Cosine similarity:** Similarity measure for comparing embeddings.
- **Liveness detection:** Checks intended to confirm that the user is physically present.
- **Spoofing:** Attempting to fool a biometric system with fake or replayed data.
- **Replay attack:** Using recorded voice instead of live speech.
- **JWT:** Signed token used for authenticated API access.
- **FAR:** False Accept Rate; impostors accepted incorrectly.
- **FRR:** False Reject Rate; real users rejected incorrectly.
- **Fusion score:** Combined score from face and voice matching.
- **EAR:** Eye Aspect Ratio, used for blink/eye-open detection.

## Appendix H - Do-Not-Claim Checklist

- Do not claim production readiness.
- Do not claim official banking-grade security.
- Do not claim formal standards certification or full compliance.
- Do not claim specific accuracy, FAR, FRR, liveness pass/fail rate, or latency unless measured.
- Do not claim AASIST blocks spoof attacks in the current final decision.
- Do not claim all existing DB records are migrated unless migration output is available.
- Do not claim mobile support beyond browser compatibility unless tested.
- Do not claim dataset diversity or large-scale evaluation unless documented.
- Do not claim biometric templates are irreversible; embeddings remain sensitive biometric data.
- Do not claim audit logging is fully integrated unless route/service usage is confirmed.
- Do not claim DB-level username+client uniqueness unless a unique constraint is verified.

## Appendix I - Presentation Rubric Alignment

Use this as a rehearsal checklist against the CMSE/CMPE 406 jury presentation rubric.

**Organization**
- Start with a clear problem, motivation, objective, and contribution.
- Keep the main deck focused on the project contribution, not implementation trivia.
- End with limitations, future improvements, and a concise conclusion.
- Do not let appendix API/database tables interrupt the story.

**Time usage**
- Target 7-10 minutes for the detailed version.
- Spend more time on contribution, architecture, enrollment/verification, liveness, security, and testing.
- Spend less time on file names and endpoint details unless the jury asks.
- Keep appendix slides ready for Q&A, not as mandatory presentation content.

**Slide quality and relevance**
- Prefer diagrams over dense text where possible.
- Recommended visuals:
  - system architecture diagram
  - enrollment sequence diagram
  - identification/verification flow diagram
  - liveness and spoof-risk scoring flow
  - testing matrix
  - limitations/future roadmap
- Keep each main slide to a maximum of 5 bullets.

**Communication skills**
- Explain technical terms briefly before using them heavily.
- Use consistent wording: "prototype", "risk score", "liveness-oriented checks", "future benchmark".
- Be precise when discussing AASIST: it returns spoof-risk fields but is not a hard rejection rule yet.

**Questions and answers**
- Be ready to explain why biometric templates need encryption rather than hashing.
- Be ready to explain why accuracy/FAR/FRR are not claimed without a defined dataset.
- Be ready to discuss privacy, false accepts, false rejects, and ethical handling of biometric data.

## Appendix J - Suggested 7-10 Minute Timing Plan

| Time | Slides | Focus |
| --- | --- | --- |
| 0:00-0:45 | 1-2 | Title and problem definition |
| 0:45-1:30 | 3-5 | Motivation, objectives, main contribution |
| 1:30-2:30 | 6-9 | Technologies and architecture |
| 2:30-4:30 | 10-12 | Enrollment, identification, verification, liveness |
| 4:30-5:30 | 13 | Security and ethical issues |
| 5:30-6:45 | 14 | Testing and evaluation status |
| 6:45-8:00 | 15-16 | Limitations, future work, conclusion |
| Q&A | Appendix | API, database, code evidence, terms, jury questions |

## Appendix K - Report Rubric Coverage Map

The attached rubric also evaluates the written report. These items should be covered in the report, even if not all are presented in the main slide deck.

| Rubric area | Current presentation coverage | Report action |
| --- | --- | --- |
| Organization and format | Main slides + appendices are structured | Match the official CMSE/CMPE report chapter format exactly |
| Proper citations | Code evidence is listed per slide | Add formal references for frameworks, models, libraries, and any external claims |
| Writing quality | Draft is written in clear English | Proofread final report and slides |
| Motivation | Slides 2-3 | Expand Chapter 1 with background and need |
| Project planning and management | Not covered in main deck | Add timeline, milestones, progress reports, roles, and supervisor meeting log |
| Realistic constraints | Slide 15 | Expand economic, environmental, social, political, ethical, health/safety, manufacturability, sustainability constraints |
| Ethical issues | Slide 13 | Expand privacy, consent, data theft, false accept/reject impact, malware, pirated software avoidance |
| System design | Slides 7, 9-12 and appendices | Add high-level architecture, ER diagram, sequence diagram, class/module diagram, and state/liveness flow diagram |
| Implementation | Slides 8-13 and Appendix C | Explain tools, algorithms, thresholds, routes, services, frontend modules |
| Standards | Slide 6 | Discuss secure software practices, biometric evaluation concepts, privacy-aware storage; do not claim certification |
| QA/QC testing | Slide 14 | Add test cases, test data, expected/actual results, corrective actions, future metrics |
| User guide | Not main-slide focused | Add installation, setup, login, enrollment, biometric verification, admin create user instructions |
| Global/economic/environmental/societal impact | Slide 3 | Expand Chapter 8 discussion |
| References | Not yet formalized | Add 10+ major references if required by report rubric |
| Appendices | Appendices A-K in this draft | For report, include Appendix A installation guide and Appendix B significant code excerpts |

## Appendix L - Suggested Formal References To Add To Report

These are suggested reference categories, not final citations. Verify and format them according to the required citation style.

- FastAPI official documentation.
- SQLAlchemy official documentation.
- Pydantic official documentation.
- Python-JOSE or JWT documentation.
- bcrypt documentation or password hashing guidance.
- InsightFace project/model documentation.
- MediaPipe FaceMesh documentation.
- OpenCV documentation.
- Resemblyzer project documentation.
- Librosa documentation.
- PyTorch documentation.
- AASIST paper or official repository, if used as the source for the model architecture.
- OWASP authentication and secure storage guidance.
- Biometric evaluation references explaining FAR, FRR, accuracy, and liveness evaluation.

## Appendix M - Team Presentation Distribution

| Team Member | Slides | Main Responsibility | Difficulty Type |
| ----------- | ------ | ------------------- | --------------- |
| Member 1 | Slides 1-4 | Title, problem definition, motivation/impact, project objectives | Conceptual / opening |
| Member 2 | Slides 5-8 | Main contribution, standards/practices, system overview, technologies used | Medium technical |
| Member 3 | Slides 9-12 | System architecture, enrollment flow, identification/verification flow, liveness/AASIST | Technical flow |
| Member 4 | Slides 13-16 | Security/ethics, testing/evaluation, limitations, future improvements/conclusion | Defense / critical discussion |

This distribution keeps the main presentation visually equal with four slides per member, while balancing difficulty by assigning conceptual, technical, and defense-oriented sections.

**Shared Q&A Preparation**
All team members should know:
- AASIST produces spoof-risk output but is not a hard rejection gate yet.
- The system is a capstone prototype, not production-ready.
- Full FAR/FRR/accuracy/latency benchmark is future work.
- Failure cases follow fail-closed behavior: access is not granted.
- Some retry/error UX improvements remain future work.
