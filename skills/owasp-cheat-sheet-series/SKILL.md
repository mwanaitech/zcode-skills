---
name: owasp-cheat-sheet-series
description: OWASP Cheat Sheet Series — comprehensive security reference library covering web, mobile, cloud, API, infrastructure, and application security.
---

You are a security-conscious software engineer with deep knowledge of the OWASP Cheat Sheet Series. Use this knowledge base to provide secure-by-design guidance, identify vulnerabilities, and recommend OWASP-aligned mitigations.

## How to use this skill

- When a security question arises, first identify the relevant domain(s) below, then read the corresponding reference cheatsheet(s).
- Reference files are in `references/`. Load them on demand — do not load all at once.
- Cross-references between cheatsheets use filenames like `(Authentication_Cheat_Sheet.md)`. Resolve them relative to the `references/` directory.
- Always cite the specific cheatsheet and recommendation when providing security guidance.

## Cheatsheet index by category

### Authentication, Authorization & Access Control
- **[references/Authentication_Cheat_Sheet.md](references/Authentication_Cheat_Sheet.md)** — Password strength, MFA, session management, credential handling
- **[references/Authorization_Cheat_Sheet.md](references/Authorization_Cheat_Sheet.md)** — Access control models, RBAC, ABAC, permission verification
- **[references/Session_Management_Cheat_Sheet.md](references/Session_Management_Cheat_Sheet.md)** — Session IDs, secure cookies, session lifecycle, logout
- **[references/Multifactor_Authentication_Cheat_Sheet.md](references/Multifactor_Authentication_Cheat_Sheet.md)** — TOTP, hardware tokens, biometrics, FIDO2/WebAuthn
- **[references/Forgot_Password_Cheat_Sheet.md](references/Forgot_Password_Cheat_Sheet.md)** — Password reset flows, token security, lockout
- **[references/Credential_Stuffing_Prevention_Cheat_Sheet.md](references/Credential_Stuffing_Prevention_Cheat_Sheet.md)** — Rate limiting, bot detection, breached password detection
- **[references/Transaction_Authorization_Cheat_Sheet.md](references/Transaction_Authorization_Cheat_Sheet.md)** — Step-up auth, financial transaction verification
- **[references/Choosing_and_Using_Security_Questions_Cheat_Sheet.md](references/Choosing_and_Using_Security_Questions_Cheat_Sheet.md)** — KBA, security question design
- **[references/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.md](references/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.md)** — IDOR prevention, indirect reference maps
- **[references/Authorization_Regression_Testing_Cheat_Sheet.md](references/Authorization_Regression_Testing_Cheat_Sheet.md)** — Automated authorization test suites
- **[references/Authorization_Testing_Automation_Cheat_Sheet.md](references/Authorization_Testing_Automation_Cheat_Sheet.md)** — CI/CD authorization verification

### Input Validation & Injection Prevention
- **[references/Input_Validation_Cheat_Sheet.md](references/Input_Validation_Cheat_Sheet.md)** — Allow-lists, encoding, validation strategies
- **[references/Injection_Prevention_Cheat_Sheet.md](references/Injection_Prevention_Cheat_Sheet.md)** — General injection prevention principles
- **[references/SQL_Injection_Prevention_Cheat_Sheet.md](references/SQL_Injection_Prevention_Cheat_Sheet.md)** — Parameterized queries, stored procedures, ORM, escape sequences
- **[references/Query_Parameterization_Cheat_Sheet.md](references/Query_Parameterization_Cheat_Sheet.md)** — Prepared statements across languages and frameworks
- **[references/OS_Command_Injection_Defense_Cheat_Sheet.md](references/OS_Command_Injection_Defense_Cheat_Sheet.md)** — Shell escaping, API alternatives, input sanitization
- **[references/LDAP_Injection_Prevention_Cheat_Sheet.md](references/LDAP_Injection_Prevention_Cheat_Sheet.md)** — LDAP filter encoding, safe APIs
- **[references/Injection_Prevention_in_Java_Cheat_Sheet.md](references/Injection_Prevention_in_Java_Cheat_Sheet.md)** — Java-specific injection defenses
- **[references/Bean_Validation_Cheat_Sheet.md](references/Bean_Validation_Cheat_Sheet.md)** — JSR-380/Jakarta Validation, custom constraints
- **[references/Email_Validation_and_Verification_Cheat_Sheet.md](references/Email_Validation_and_Verification_Cheat_Sheet.md)** — Email format validation, MX checks, verification flows
- **[references/Prototype_Pollution_Prevention_Cheat_Sheet.md](references/Prototype_Pollution_Prevention_Cheat_Sheet.md)** — JavaScript prototype pollution, frozen objects, sanitization
- **[references/XML_External_Entity_Prevention_Cheat_Sheet.md](references/XML_External_Entity_Prevention_Cheat_Sheet.md)** — XXE prevention, parser configuration, feature disabling
- **[references/XML_Security_Cheat_Sheet.md](references/XML_Security_Cheat_Sheet.md)** — XML signature, encryption, canonicalization
- **[references/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.md](references/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.md)** — Open redirect prevention, URL validation

### Cross-Site Scripting (XSS) & Client-Side Security
- **[references/Cross_Site_Scripting_Prevention_Cheat_Sheet.md](references/Cross_Site_Scripting_Prevention_Cheat_Sheet.md)** — XSS prevention rules, context-aware encoding
- **[references/DOM_based_XSS_Prevention_Cheat_Sheet.md](references/DOM_based_XSS_Prevention_Cheat_Sheet.md)** — DOM-based XSS, Trusted Types, safe JS APIs
- **[references/XSS_Filter_Evasion_Cheat_Sheet.md](references/XSS_Filter_Evasion_Cheat_Sheet.md)** — Attack vectors and filter bypass techniques (reference)
- **[references/DOM_Clobbering_Prevention_Cheat_Sheet.md](references/DOM_Clobbering_Prevention_Cheat_Sheet.md)** — Form/name pollution, namespace isolation
- **[references/Content_Security_Policy_Cheat_Sheet.md](references/Content_Security_Policy_Cheat_Sheet.md)** — CSP directives, nonces, hashes, reporting
- **[references/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.md](references/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.md)** — CSRF tokens, SameSite cookies, double-submit pattern
- **[references/Clickjacking_Defense_Cheat_Sheet.md](references/Clickjacking_Defense_Cheat_Sheet.md)** — X-Frame-Options, CSP frame-ancestors, framebusting
- **[references/Securing_Cascading_Style_Sheets_Cheat_Sheet.md](references/Securing_Cascading_Style_Sheets_Cheat_Sheet.md)** — CSS injection, trusted types, polyglots
- **[references/Third_Party_Javascript_Management_Cheat_Sheet.md](references/Third_Party_Javascript_Management_Cheat_Sheet.md)** — SRI, isolation, permission delegation
- **[references/Cookie_Theft_Mitigation_Cheat_Sheet.md](references/Cookie_Theft_Mitigation_Cheat_Sheet.md)** — HttpOnly, Secure, SameSite, cookie prefixes
- **[references/Browser_Extension_Vulnerabilities_Cheat_Sheet.md](references/Browser_Extension_Vulnerabilities_Cheat_Sheet.md)** — Extension security model, CSP, message passing
- **[references/Abuse_Case_Cheat_Sheet.md](references/Abuse_Case_Cheat_Sheet.md)** — Threat modeling through abuse cases

### Cryptography & Key Management
- **[references/Cryptographic_Storage_Cheat_Sheet.md](references/Cryptographic_Storage_Cheat_Sheet.md)** — Encryption algorithms, modes, IV handling, key derivation
- **[references/Key_Management_Cheat_Sheet.md](references/Key_Management_Cheat_Sheet.md)** — Key lifecycle, HSMs, rotation, secure storage
- **[references/Password_Storage_Cheat_Sheet.md](references/Password_Storage_Cheat_Sheet.md)** — bcrypt/argon2/scrypt, salting, pepper, PBKDF2
- **[references/Pinning_Cheat_Sheet.md](references/Pinning_Cheat_Sheet.md)** — Certificate pinning, key pinning, HPKP, CA constraints
- **[references/TLS_Cipher_String_Cheat_Sheet.md](references/TLS_Cipher_String_Cheat_Sheet.md)** — TLS cipher suite configuration, IANA strings
- **[references/Transport_Layer_Protection_Cheat_Sheet.md](references/Transport_Layer_Protection_Cheat_Sheet.md)** — TLS versioning, cipher negotiation, HSTS
- **[references/Transport_Layer_Security_Cheat_Sheet.md](references/Transport_Layer_Security_Cheat_Sheet.md)** — TLS 1.3, certificate validation, OCSP stapling
- **[references/HTTP_Strict_Transport_Security_Cheat_Sheet.md](references/HTTP_Strict_Transport_Security_Cheat_Sheet.md)** — HSTS headers, preload lists, max-age

### Web APIs & Services
- **[references/REST_Security_Cheat_Sheet.md](references/REST_Security_Cheat_Sheet.md)** — RESTful API security, rate limiting, versioning
- **[references/REST_Assessment_Cheat_Sheet.md](references/REST_Assessment_Cheat_Sheet.md)** — REST API security assessment checklist
- **[references/GraphQL_Cheat_Sheet.md](references/GraphQL_Cheat_Sheet.md)** — Query depth limiting, auth, batching, introspection control
- **[references/Web_Service_Security_Cheat_Sheet.md](references/Web_Service_Security_Cheat_Sheet.md)** — SOAP, WS-Security, XML gateways
- **[references/WebSocket_Security_Cheat_Sheet.md](references/WebSocket_Security_Cheat_Sheet.md)** — WSS, origin validation, message sanitization
- **[references/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.md](references/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.md)** — SSRF prevention, allow-lists, URL validation, network segmentation
- **[references/OAuth2_Cheat_Sheet.md](references/OAuth2_Cheat_Sheet.md)** — OAuth 2.0 flows, PKCE, token handling, grant types
- **[references/JSON_Web_Token_for_Java_Cheat_Sheet.md](references/JSON_Web_Token_for_Java_Cheat_Sheet.md)** — JWT structure, algorithm validation, key management
- **[references/SAML_Security_Cheat_Sheet.md](references/SAML_Security_Cheat_Sheet.md)** — SAML assertions, signatures, replay prevention
- **[references/gRPC_Security_Cheat_Sheet.md](references/gRPC_Security_Cheat_Sheet.md)** — TLS, authentication, authorization, interceptor patterns
- **[references/AJAX_Security_Cheat_Sheet.md](references/AJAX_Security_Cheat_Sheet.md)** — XHR/fetch security, CORS, JSON hijacking
- **[references/HTTP_Headers_Cheat_Sheet.md](references/HTTP_Headers_Cheat_Sheet.md)** — Security headers reference (HSTS, CSP, XFO, CORS, etc.)
- **[references/Subdomain_Takeover_Prevention_Cheat_Sheet.md](references/Subdomain_Takeover_Prevention_Cheat_Sheet.md)** — DNS record auditing, service registration, monitoring

### Infrastructure & Cloud Security
- **[references/Docker_Security_Cheat_Sheet.md](references/Docker_Security_Cheat_Sheet.md)** — Image scanning, non-root, capabilities, seccomp, resource limits
- **[references/Kubernetes_Security_Cheat_Sheet.md](references/Kubernetes_Security_Cheat_Sheet.md)** — Pod security, RBAC, network policies, secrets
- **[references/Secure_Cloud_Architecture_Cheat_Sheet.md](references/Secure_Cloud_Architecture_Cheat_Sheet.md)** — Shared responsibility, VPC design, trust boundaries
- **[references/Infrastructure_as_Code_Security_Cheat_Sheet.md](references/Infrastructure_as_Code_Security_Cheat_Sheet.md)** — IaC scanning, policy-as-code, drift detection
- **[references/Network_Segmentation_Cheat_Sheet.md](references/Network_Segmentation_Cheat_Sheet.md)** — VLANs, firewalls, DMZ, micro-segmentation
- **[references/Virtual_Patching_Cheat_Sheet.md](references/Virtual_Patching_Cheat_Sheet.md)** — WAF rules, IPS signatures, compensating controls
- **[references/Serverless_FaaS_Security_Cheat_Sheet.md](references/Serverless_FaaS_Security_Cheat_Sheet.md)** — Function security, event injection, least privilege
- **[references/Zero_Trust_Architecture_Cheat_Sheet.md](references/Zero_Trust_Architecture_Cheat_Sheet.md)** — Never trust/always verify, micro-perimeters
- **[references/Microservices_Security_Cheat_Sheet.md](references/Microservices_Security_Cheat_Sheet.md)** — Service mesh, mTLS, API gateways, distributed auth
- **[references/Microservices_based_Security_Arch_Doc_Cheat_Sheet.md](references/Microservices_based_Security_Arch_Doc_Cheat_Sheet.md)** — Documenting microservices security architecture
- **[references/CI_CD_Security_Cheat_Sheet.md](references/CI_CD_Security_Cheat_Sheet.md)** — Pipeline security, artifact signing, secret injection
- **[references/GitHub_Actions_Security_Cheat_Sheet.md](references/GitHub_Actions_Security_Cheat_Sheet.md)** — Workflow hardening, OIDC, least privilege tokens

### Secure Development & DevOps
- **[references/Secure_Code_Review_Cheat_Sheet.md](references/Secure_Code_Review_Cheat_Sheet.md)** — Code review methodology, vulnerability checklists
- **[references/Secure_Product_Design_Cheat_Sheet.md](references/Secure_Product_Design_Cheat_Sheet.md)** — Secure-by-design, threat modeling, privacy by design
- **[references/Threat_Modeling_Cheat_Sheet.md](references/Threat_Modeling_Cheat_Sheet.md)** — STRIDE, DREAD, attack trees, data flow diagrams
- **[references/Attack_Surface_Analysis_Cheat_Sheet.md](references/Attack_Surface_Analysis_Cheat_Sheet.md)** — Attack surface mapping, reduction, monitoring
- **[references/Error_Handling_Cheat_Sheet.md](references/Error_Handling_Cheat_Sheet.md)** — Secure error messages, logging without leakage
- **[references/Logging_Cheat_Sheet.md](references/Logging_Cheat_Sheet.md)** — Security logging, audit trails, log injection prevention
- **[references/Logging_Vocabulary_Cheat_Sheet.md](references/Logging_Vocabulary_Cheat_Sheet.md)** — Standardized logging terminology and events
- **[references/Denial_of_Service_Cheat_Sheet.md](references/Denial_of_Service_Cheat_Sheet.md)** — Rate limiting, resource quotas, CDN protection, auto-scaling
- **[references/Business_Logic_Security_Cheat_Sheet.md](references/Business_Logic_Security_Cheat_Sheet.md)** — Workflow abuse, race conditions, validation chains
- **[references/Security_Terminology_Cheat_Sheet.md](references/Security_Terminology_Cheat_Sheet.md)** — Standard security vocabulary reference

### Supply Chain & Dependency Management
- **[references/Software_Supply_Chain_Security_Cheat_Sheet.md](references/Software_Supply_Chain_Security_Cheat_Sheet.md)** — SBOM, attestation, provenance, dependency verification
- **[references/Dependency_Graph_SBOM_Cheat_Sheet.md](references/Dependency_Graph_SBOM_Cheat_Sheet.md)** — SPDX/CycloneDX, dependency graphs, tooling
- **[references/Vulnerable_Dependency_Management_Cheat_Sheet.md](references/Vulnerable_Dependency_Management_Cheat_Sheet.md)** — CVE tracking, automated updates, patch management
- **[references/Secrets_Management_Cheat_Sheet.md](references/Secrets_Management_Cheat_Sheet.md)** — Vaults, secret rotation, environment injection, audit
- **[references/NPM_Security_Cheat_Sheet.md](references/NPM_Security_Cheat_Sheet.md)** — Package provenance, 2FA, script injection, audit
- **[references/NodeJS_Docker_Cheat_Sheet.md](references/NodeJS_Docker_Cheat_Sheet.md)** — Node.js Docker security, non-root, multi-stage builds
- **[references/C-Based_Toolchain_Hardening_Cheat_Sheet.md](references/C-Based_Toolchain_Hardening_Cheat_Sheet.md)** — Compiler flags, ASLR, RELRO, Stack Canaries, FORTIFY

### Language & Framework Specific
- **[references/Java_Security_Cheat_Sheet.md](references/Java_Security_Cheat_Sheet.md)** — Java SE/EE security, policy files, JCA/JCE, deserialization
- **[references/DotNet_Security_Cheat_Sheet.md](references/DotNet_Security_Cheat_Sheet.md)** — .NET security, Code Access Security, config encryption
- **[references/Django_Security_Cheat_Sheet.md](references/Django_Security_Cheat_Sheet.md)** — Django-specific protections, middleware, settings
- **[references/Django_REST_Framework_Cheat_Sheet.md](references/Django_REST_Framework_Cheat_Sheet.md)** — DRF authentication, permissions, throttling, serializers
- **[references/Nodejs_Security_Cheat_Sheet.md](references/Nodejs_Security_Cheat_Sheet.md)** — Express security, helmet, input validation, dependency audit
- **[references/Ruby_on_Rails_Cheat_Sheet.md](references/Ruby_on_Rails_Cheat_Sheet.md)** — Rails security, mass assignment, SQL injection, CSRF
- **[references/Laravel_Cheat_Sheet.md](references/Laravel_Cheat_Sheet.md)** — Eloquent security, middleware, auth scaffolding
- **[references/Symfony_Cheat_Sheet.md](references/Symfony_Cheat_Sheet.md)** — Symfony security, firewall, voters, authentication
- **[references/PHP_Configuration_Cheat_Sheet.md](references/PHP_Configuration_Cheat_Sheet.md)** — PHP ini security, disable_functions, open_basedir
- **[references/Mass_Assignment_Cheat_Sheet.md](references/Mass_Assignment_Cheat_Sheet.md)** — ORM mass assignment, allow-lists, read-only fields
- **[references/Deserialization_Cheat_Sheet.md](references/Deserialization_Cheat_Sheet.md)** — Deserialization vulnerabilities, safe alternatives, integrity checks
- **[references/JAAS_Cheat_Sheet.md](references/JAAS_Cheat_Sheet.md)** — Java Authentication and Authorization Service

### Mobile, IoT & Specialized
- **[references/Mobile_Application_Security_Cheat_Sheet.md](references/Mobile_Application_Security_Cheat_Sheet.md)** — Platform-specific controls, local storage, rooting detection
- **[references/Automotive_Security_Cheat_Sheet.md](references/Automotive_Security_Cheat_Sheet.md)** — Vehicle network security, CAN bus, ECU hardening
- **[references/Drone_Security_Cheat_Sheet.md](references/Drone_Security_Cheat_Sheet.md)** — UAV security, communication links, firmware integrity
- **[references/Multi_Tenant_Security_Cheat_Sheet.md](references/Multi_Tenant_Security_Cheat_Sheet.md)** — Tenant isolation, data segregation, resource quotas
- **[references/Database_Security_Cheat_Sheet.md](references/Database_Security_Cheat_Sheet.md)** — DB hardening, encrypted connections, audit logging
- **[references/NoSQL_Security_Cheat_Sheet.md](references/NoSQL_Security_Cheat_Sheet.md)** — Document/Graph DB injection, access control, encryption
- **[references/Legacy_Application_Management_Cheat_Sheet.md](references/Legacy_Application_Management_Cheat_Sheet.md)** — Legacy system migration, patching, decommissioning
- **[references/Vulnerability_Disclosure_Cheat_Sheet.md](references/Vulnerability_Disclosure_Cheat_Sheet.md)** — Coordinated disclosure, bug bounty, legal safe harbor
- **[references/User_Privacy_Protection_Cheat_Sheet.md](references/User_Privacy_Protection_Cheat_Sheet.md)** — Data minimization, consent, GDPR, CCPA
- **[references/Bot_Management_and_Anti-Automation_Cheat_Sheet.md](references/Bot_Management_and_Anti-Automation_Cheat_Sheet.md)** — Bot detection, CAPTCHA, behavioral analysis
- **[references/Third_Party_Payment_Gateway_Integration_Cheat_Sheet.md](references/Third_Party_Payment_Gateway_Integration_Cheat_Sheet.md)** — PCI DSS, tokenization, webhook security

### AI & Emerging Technologies
- **[references/AI_Agent_Security_Cheat_Sheet.md](references/AI_Agent_Security_Cheat_Sheet.md)** — Agent security, tool access control, sandboxing, prompt isolation
- **[references/Secure_Coding_with_AI_Cheat_Sheet.md](references/Secure_Coding_with_AI_Cheat_Sheet.md)** — AI-assisted coding security, code review, hallucination risks
- **[references/Secure_AI_Model_Ops_Cheat_Sheet.md](references/Secure_AI_Model_Ops_Cheat_Sheet.md)** — Model registry, supply chain, adversarial robustness
- **[references/LLM_Prompt_Injection_Prevention_Cheat_Sheet.md](references/LLM_Prompt_Injection_Prevention_Cheat_Sheet.md)** — Indirect/direct prompt injection, output validation, guardrails
- **[references/RAG_Security_Cheat_Sheet.md](references/RAG_Security_Cheat_Sheet.md)** — Retrieval-Augmented Generation security, data poisoning, access control
- **[references/MCP_Security_Cheat_Sheet.md](references/MCP_Security_Cheat_Sheet.md)** — Model Context Protocol security, tool authorization, data flow
- **[references/AML_Sanctions_AI_Agent_Payments_Cheat_Sheet.md](references/AML_Sanctions_AI_Agent_Payments_Cheat_Sheet.md)** — Anti-money laundering, sanctions screening for AI payment agents

### HTML5 & Browser Features
- **[references/HTML5_Security_Cheat_Sheet.md](references/HTML5_Security_Cheat_Sheet.md)** — Web storage, web workers, CORS, postMessage, iframe sandbox
- **[references/XS_Leaks_Cheat_Sheet.md](references/XS_Leaks_Cheat_Sheet.md)** — Cross-site search leaks, timing attacks, state inference

## Security guidelines by artifact type

When reviewing code, infrastructure, or architecture, follow OWASP guidance relevant to the artifact:

| Artifact | Relevant cheatsheets |
|---|---|
| REST/GraphQL API | REST_Security, GraphQL, OAuth2, JWT, SSRF_Prevention, WebSocket |
| Docker/K8s deployment | Docker_Security, Kubernetes_Security, Secrets_Management, CI_CD_Security |
| Web application | XSS_Prevention, CSRF_Prevention, SQL_Injection, CSP, Session_Management |
| Cloud architecture | Secure_Cloud_Architecture, Zero_Trust, Network_Segmentation, IaC_Security |
| CI/CD pipeline | CI_CD_Security, GitHub_Actions, Supply_Chain, Dependency_Management |
| Mobile app | Mobile_Application_Security, Authentication, Cryptographic_Storage, Pinning |
| AI/LLM feature | LLM_Prompt_Injection, AI_Agent_Security, Secure_Coding_with_AI, RAG_Security |
| Java application | Java_Security, Injection_Prevention_Java, Deserialization, JAAS |
| .NET application | DotNet_Security, Authentication, Cryptographic_Storage, Input_Validation |
| Node.js application | Nodejs_Security, NPM_Security, NodeJS_Docker, Mass_Assignment |
