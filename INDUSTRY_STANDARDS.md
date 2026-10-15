# Industry-Standard Software Engineering Practices

This document details the software engineering standards, security controls, and design patterns implemented in the project on branch `clean_code`.

---

## 1. Clean Code & Architecture (SOLID Principles)

- **Single Responsibility Principle (SRP):**
  - `SapApiClient`: Exclusively manages outbound HTTP communications with SAP API endpoints, headers, and response status validation.
  - `DatabaseManager`: Exclusively manages relational database connections, automated schema creation, dual-engine fallback (PostgreSQL/H2), and CRUD operations.
  - `BillServer`: Exclusively handles HTTP routing, query parsing, JSON serialization, and static asset serving.
  - `GenericSapParser`: Generic JSON conversion layer with zero domain entanglement.
- **Open/Closed Principle (OCP):**
  - Dynamic service registry (`SapServiceRegistry`) permits registering new SAP services and OpenAPI schemas without modifying existing server routes or database persistence logic.
- **Dependency & Resource Hygiene:**
  - Standardized on Apache HttpClient 5 with explicit connection and socket timeouts (`CONNECT_TIMEOUT_SECONDS = 10`, `RESPONSE_TIMEOUT_SECONDS = 15`) preventing socket starvation.

---

## 2. Structured Logging (SLF4J Facade)

- **Replaced Raw Console Dumps:**
  - Removed unstructured `System.out.println`, `System.err.println`, and `e.printStackTrace()`.
  - Integrated `org.slf4j.Logger` across all core classes via `LoggerFactory.getLogger(Class)`.
- **Log Levels & Parameterization:**
  - Used appropriate log levels (`DEBUG`, `INFO`, `WARN`, `ERROR`).
  - Utilized parameterized SLF4J formatting (`LOGGER.info("Successfully connected to: {}", db)`) to eliminate unnecessary runtime string concatenation.
- **Production-Ready Provider:**
  - Integrated `slf4j-simple` into `pom.xml` for formatted console and thread-context output with zero boilerplate.

---

## 3. Robust Exception Handling & Resource Management

- **No Swallowed Exceptions:**
  - All catch blocks log with full error context and preserve root causes (`LOGGER.error("...", e)`).
- **Deterministic Resource Management (Zero Leaks):**
  - All JDBC connections, `PreparedStatement`, `Statement`, and `ResultSet` instances are managed inside `try-with-resources` blocks.
  - Transactions on multi-step inserts use atomic `conn.setAutoCommit(false)`, `conn.commit()`, and `conn.rollback()` inside `finally { conn.setAutoCommit(true); }`.

---

## 4. Security & Hardening (OWASP Guidelines)

- **A01: Broken Access Control & Path Traversal (CWE-22):**
  - In `BillServer.serveFile()`, file paths are validated against canonical base directories using `.getCanonicalFile().getPath().startsWith(baseDir.getPath())` to block `../` directory traversal attempts with HTTP 403 Forbidden.
- **A03: SQL Injection Prevention (CWE-89):**
  - All dynamic queries use parameterized `PreparedStatement` with `?` markers.
  - Database and table names are strictly sanitized against alphanumeric regex (`^[a-zA-Z0-9_]+$`) prior to executing DDL statements.
- **A07: Identification and Authentication Failures / Hardcoded Secrets:**
  - Externalized credentials and API keys (`SAP_API_KEY`, `DB_USER`, `DB_PASS`) into `.env` configuration files.
  - Added template tracking via `.env.example`.
  - Protected `.env` files from version control via `.gitignore`.

---

## 5. Documentation & Maintainability

- **Javadoc:**
  - Comprehensive Javadoc across all public classes, methods, parameters, and exceptions.
- **Test Coverage:**
  - 28 unit tests (JUnit 5 + Mockito) covering positive, negative, and edge-case paths.
  - 7 end-to-end integration scenarios executed via `MainApiTestRunner`.
