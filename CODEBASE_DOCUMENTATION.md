# SAP Subscription Billing System - Complete Codebase Documentation

**Project Name:** SAP Bill Crawler Final  
**Date:** May 15, 2026  
**Language:** Java  
**Framework:** Custom HTTP Server (Java Built-in)  
**API:** SAP Subscription Billing REST API v2  

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Design](#architecture--design)
3. [Technology Stack](#technology-stack)
4. [Directory Structure](#directory-structure)
5. [Core Components](#core-components)
6. [API Integration](#api-integration)
7. [Data Models](#data-models)
8. [Main Classes](#main-classes)
9. [How It Works](#how-it-works)
10. [Running the Application](#running-the-application)
11. [Dependencies & Libraries](#dependencies--libraries)
12. [Configuration](#configuration)
13. [Key Concepts](#key-concepts)

---

## 🎯 Project Overview

### Purpose
This project is a **SAP Subscription Billing API Client** that integrates with SAP's Cloud-to-Cash (C2C) platform. It fetches billing data from SAP's sandbox environment and provides a dashboard to visualize bills, charges, credits, and other billing-related information.

### What It Does
1. **Fetches Bills**: Connects to SAP's Bills API v2 and retrieves billing documents
2. **Displays Data**: Serves an interactive HTML dashboard showing bill statistics and data
3. **Stores Models**: Contains comprehensive Java models representing SAP billing entities
4. **Handles Payments**: Manages billing information including charges, credits, and settlements

### Target Users
- SAP Subscription Billing customers
- Finance/Billing departments
- Integration engineers
- System administrators

### Use Cases
- View all bills from SAP Subscription Billing system
- Monitor billing status (OPEN, CLOSING, CLOSED)
- Track payment information
- Analyze billing patterns and trends
- Integration testing with SAP APIs

---

## 🏗️ Architecture & Design

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    HTTP CLIENT (Java)                       │
│  Runs on localhost:8080                                     │
└────────────┬────────────────────────────────────────────────┘
             │
             ├─────────────────────────────┐
             │                             │
    ┌────────┴─────────┐         ┌────────┴─────────┐
    │ Route: /         │         │ Route: /bills    │
    │ (HTML Dashboard) │         │ (JSON API)       │
    └──────────────────┘         └────────┬─────────┘
                                          │
                                          ▼
                            ┌─────────────────────────┐
                            │  fetchBillsFromSAP()    │
                            │  Makes HTTP GET Request │
                            └────────┬────────────────┘
                                     │
                                     ▼
                    ┌──────────────────────────────────┐
                    │ SAP Sandbox API                  │
                    │ (Bills v2 REST API)              │
                    │ sandbox.api.sap.com              │
                    └──────────────────────────────────┘
```

### Design Patterns Used
- **HTTP Server Pattern**: Uses Java's built-in `HttpServer` for lightweight HTTP handling
- **Handler Pattern**: Implements `HttpHandler` interface for route handling
- **Serialization Pattern**: Uses Jackson (ObjectMapper) for JSON ↔ Java object conversion
- **Model Pattern**: POJO (Plain Old Java Objects) for data representation

### Component Interaction Flow
```
1. Client requests http://localhost:8080
2. BillServer receives request
3. Route handler (HttpHandler) processes request
4. For "/" → serves HTML dashboard
5. For "/bills" → calls fetchBillsFromSAP()
6. fetchBillsFromSAP() makes HTTP GET to SAP API
7. SAP API returns JSON response
8. Jackson ObjectMapper deserializes JSON to Java objects
9. Response sent back to client
10. Client renders dashboard
```

---

## 🛠️ Technology Stack

### Core Technologies
| Technology | Version | Purpose |
|-----------|---------|---------|
| Java | JDK (Not specified, likely 11+) | Programming language |
| HTTP Server | Java Built-in | Lightweight HTTP server |
| Jackson | (Latest via JAR) | JSON serialization/deserialization |

### External Libraries & JARs
Located in `/tools/` directory:

```
jackson-databind.jar          - Core Jackson JSON processing
jackson-core.jar               - Low-level JSON parsing
jackson-annotations.jar        - Annotation support
jackson-jsr310.jar            - Java 8+ time module
jackson-nullable.jar          - Nullable type handling
javax-annotation.jar          - Java annotations
jsr305.jar                    - JSR-305 annotations
```

### External APIs
- **SAP Subscription Billing REST API v2** - Provides bill data
- OAuth 2.0 - Authentication (API Key based)

---

## 📁 Directory Structure

```
g:\final_year_proj/
│
├── README.md                          # Project README (brief)
├── sources.txt                        # List of all Java source files
├── CODEBASE_DOCUMENTATION.md          # THIS FILE
│
├── newone/
│   └── src/main/java/
│       └── projectsap/sap/bill/
│           ├── main/
│           │   ├── BillServer.java           # Main HTTP server & dashboard
│           │   └── TestBillAPI.java          # API testing utility
│           │
│           └── model/                        # Data models (80+ classes)
│               ├── Bill.java                 # Main invoice document
│               ├── BillItem.java             # Line items in a bill
│               ├── Charge.java               # Charges/costs
│               ├── Credit.java               # Credit notes
│               ├── Customer.java             # Customer information
│               ├── Market.java               # Market/region info
│               ├── Payment.java              # Payment details
│               ├── CreditCard.java           # Credit card info
│               ├── Subscription.java         # Subscription reference
│               ├── Product.java              # Product information
│               ├── MetaData.java             # Metadata
│               ├── MonetaryAmount.java       # Currency values
│               ├── Closing.java              # Closing details
│               ├── EventLogEntry.java        # Event history
│               ├── RatePlan.java             # Rate plan information
│               ├── PricingElement.java       # Pricing details
│               └── [... 60+ more model classes ...]
│
├── tools/
│   ├── BillV2_APIs.yaml                # OpenAPI/Swagger specification
│   │
│   ├── generated/                      # Auto-generated code
│   │   ├── api/                        # API client classes
│   │   ├── docs/                       # Generated documentation (80+ MD files)
│   │   ├── gradle/                     # Gradle build files
│   │   └── src/                        # Generated source code
│   │
│   ├── jackson-*.jar                   # Jackson libraries
│   ├── javax-annotation.jar            # Javax annotations
│   ├── jsr305.jar                      # JSR-305 annotations
│   └── [other dependency JARs]
│
└── out/                               # Compiled classes (generated at build time)
```

### Key Directory Explanations

#### `/newone/src/main/java/projectsap/sap/bill/main/`
- **BillServer.java**: Main entry point - HTTP server with two routes
- **TestBillAPI.java**: Standalone test utility to validate API connectivity

#### `/newone/src/main/java/projectsap/sap/bill/model/`
- Contains 80+ model classes (POJOs) representing SAP billing entities
- Auto-generated from OpenAPI specification
- Each class represents a specific data structure from the API

#### `/tools/BillV2_APIs.yaml`
- OpenAPI 3.0.3 specification file
- Defines all REST endpoints and data models
- Generated these models automatically

#### `/tools/generated/`
- Contains auto-generated code from the OpenAPI specification
- Includes API client implementations
- Contains markdown documentation for each model

---

## 🔧 Core Components

### 1. **BillServer.java** - Main Application
**Purpose**: HTTP server and dashboard provider

**Key Responsibilities**:
- Creates HTTP server on port 8080
- Handles two routes: "/" and "/bills"
- Fetches data from SAP API
- Serves interactive HTML dashboard

**Main Methods**:
- `main(String[] args)` - Server startup
- `fetchBillsFromSAP()` - Makes API call to SAP
- `getDashboardHTML()` - Returns HTML dashboard code

**Important Constants**:
```java
private static final String API_KEY = "wITmrAEUGLzlYWC2my5UOKunJinBNwe4";
private static final String API_URL = "https://sandbox.api.sap.com/subscriptionbilling/api/bill/v2/bills?pageNumber=1&pageSize=40&%24count=true";
```

**Routes**:
| Route | Method | Returns | Purpose |
|-------|--------|---------|---------|
| `/` | GET | HTML | Interactive dashboard |
| `/bills` | GET | JSON | Raw bill data from API |

### 2. **TestBillAPI.java** - Testing Utility
**Purpose**: Standalone utility to test API connectivity and data deserialization

**Key Responsibilities**:
- Makes direct HTTP request to SAP API
- Deserializes JSON response to Bill POJOs
- Prints bill information to console
- Useful for debugging and validation

**Main Steps in Execution**:
1. Make HTTP GET request to SAP API
2. Read response based on HTTP status code
3. Deserialize JSON to Bill objects using Jackson
4. Print bill details to console

### 3. **Model Classes (80+ classes)** - Data Representation

**Auto-Generated**: All model classes are generated from OpenAPI specification

**Key Model Files**:

#### Bill.java
- Represents a billing document
- Contains reference to items, charges, credits
- Has status (OPEN, CLOSING, CLOSED)
- Properties: id, documentNumber, billingDate, dueDate, currency, amount, etc.

#### BillItem.java
- Represents a line item on a bill
- Contains charges or credits
- References subscription and product
- Contains quantities and pricing details

#### Charge.java
- Represents a charge (cost) on a bill
- Contains quantity, rating type, pricing elements
- Has monetary amounts (net/gross)
- Can be recurring, one-time, or usage-based

#### Credit.java
- Represents a credit note
- Inverse of a charge
- Reduces overall bill amount

#### Customer.java
- Contains customer information
- Properties: id, type (INDIVIDUAL/CORPORATE), country

#### Market.java
- Represents market/regional information
- Currency information
- Market-specific settings

#### Payment.java
- Contains payment information
- Payment method and status
- Associated dates

#### Subscription.java
- Reference to subscription
- Contains subscription ID and document number
- Links bill to subscription

#### Product.java
- Product information
- Name and product ID
- Rate plan references

#### Additional Models
- **MonetaryAmount**: Financial values with currency
- **MetaData**: Creation/modification timestamps and user info
- **Closing**: Bill closing information
- **EventLogEntry**: History of bill state changes
- **RatePlan**: Pricing details
- **PricingElement**: Detailed pricing breakdown
- **UsageRecord**: Usage-based charge details
- **CreditCard**: Credit card settlement information
- **CustomReference**: Custom fields/extensions
- **And 60+ more specialized models...**

---

## 🔌 API Integration

### SAP Subscription Billing REST API v2

**Base URL** (Sandbox):
```
https://sandbox.api.sap.com/subscriptionbilling/api/bill/v2
```

**Authentication**:
- Method: API Key (in header)
- Header Name: `APIKey`
- Header Value: `wITmrAEUGLzlYWC2my5UOKunJinBNwe4`

**Main Endpoint Used**:
```
GET /bills?pageNumber=1&pageSize=40&$count=true
```

**Query Parameters**:
| Parameter | Type | Example | Purpose |
|-----------|------|---------|---------|
| pageNumber | int | 1 | Page number (1-based) |
| pageSize | int | 40 | Records per page (max 100) |
| $count | boolean | true | Include total count header |
| $filter | string | billStatus eq 'OPEN' | Filter bills (OData syntax) |
| expand | string | subCharges,customReferences | Include nested fields |
| sort | string | billingDate,desc | Sort results |

**Response Format**: JSON Array of Bill Objects

**HTTP Headers Sent**:
```java
conn.setRequestProperty("APIKey", API_KEY);
conn.setRequestProperty("Accept", "application/json");
```

**Response Headers Received**:
- `Content-Type`: application/json
- `x-count`: Total number of matching bills
- `x-pagecount`: Total number of pages

**Available OData Filters**:
- billStatus (OPEN, CLOSING, CLOSED)
- transferStatus (NOT_RELEVANT, NOT_TRANSFERRED, TRANSFER_IN_PROGRESS, TRANSFERRED, FAILED)
- paymentStatus (SUCCESS, ERROR, UNKNOWN, NOT_SETTLED, FAILED)
- billingType (CHARGE, CREDIT)
- billingProfileId
- customer/id
- subscription/id
- product/id
- billingDate (YYYY-MM-DD)
- createdAt (ISO 8601 timestamp)

**Example API Response** (partial):
```json
[
  {
    "id": "bill-123",
    "documentNumber": 12345,
    "billingType": "CHARGE",
    "currency": "USD",
    "billStatus": "OPEN",
    "billingDate": "2026-05-01",
    "dueDate": "2026-05-31",
    "netAmount": {
      "amount": "1000.00",
      "currency": "USD"
    },
    "grossAmount": {
      "amount": "1100.00",
      "currency": "USD"
    },
    "customer": {
      "id": "customer-456",
      "type": "CORPORATE"
    },
    "market": {
      "id": "market-eu"
    },
    "billItems": [
      {
        "id": "item-1",
        "subscription": {"id": "sub-789"},
        "product": {"id": "product-001"}
      }
    ]
  }
]
```

---

## 📊 Data Models

### Model Hierarchy & Relationships

```
Bill (Main Document)
├── BillItem (Line items)
│   ├── Charge (Individual charges)
│   │   ├── SubCharge (Sub-components)
│   │   ├── PricingElement (Pricing breakdown)
│   │   └── UsageRecord (Usage details)
│   │
│   ├── Credit (Credit note items)
│   │
│   ├── Subscription (Reference)
│   ├── Product (Reference)
│   └── RatePlan (Reference)
│
├── Customer
├── Market
├── Payment
├── CreditCard
├── Closing (Closing details)
├── EventLog (Event history)
├── SuccessorDocument (Related bills)
├── CustomReference (Extensions)
├── NotificationSetting
└── MetaData

Monetary Amounts Used Throughout:
├── MonetaryAmount (Standard)
├── MonetaryAmountUpperBound
├── MonetaryAmountWith6DecimalPlaces
└── Quantity variants
```

### Key Model Features

**Auto-Generated Properties**:
- All models include `@JsonProperty`, `@JsonCreator`, `@JsonValue` annotations
- Builder pattern with method chaining (e.g., `bill.id("123").billingDate(date)`)
- Equals, hashCode, toString implementations
- Getters and setters for all properties

**Enum Types**:
```java
// BillingType
CHARGE, CREDIT

// Customer Type
INDIVIDUAL, CORPORATE

// Bill Status
OPEN, CLOSING, CLOSED

// Transfer Status
NOT_RELEVANT, NOT_TRANSFERRED, TRANSFER_IN_PROGRESS, TRANSFERRED, FAILED, FAILED_PARTIALLY

// Payment Status
SUCCESS, ERROR, UNKNOWN, NOT_SETTLED, FAILED

// Rating Type (for charges)
RECURRING, ONETIME, USAGE
```

**Nullable Handling**:
- Uses `@javax.annotation.Nullable` for optional fields
- `JsonNullable<T>` for sophisticated null handling
- All fields include `JsonInclude(value = JsonInclude.Include.USE_DEFAULTS)`

---

## 🎯 Main Classes

### Class: BillServer

**Location**: `newone/src/main/java/projectsap/sap/bill/main/BillServer.java`

**Purpose**: Main HTTP server application

**Key Methods**:

```
public static void main(String[] args) throws Exception
  ├── Creates HttpServer on 8080
  ├── Registers "/" route for dashboard
  ├── Registers "/bills" route for API
  ├── Sets executor to null (synchronous)
  └── Starts server

private static String fetchBillsFromSAP() throws Exception
  ├── Creates HTTP connection
  ├── Sets headers (APIKey, Accept)
  ├── Sends GET request
  ├── Reads response
  ├── Returns JSON string
  └── Handles errors

private static String getDashboardHTML()
  └── Returns complete HTML/CSS/JavaScript dashboard
```

**Features**:
- Lightweight HTTP server using Java built-in APIs
- CORS headers enabled (Access-Control-Allow-Origin: *)
- Exception handling with error responses
- Timeout configuration (10 seconds)

### Class: TestBillAPI

**Location**: `newone/src/main/java/projectsap/sap/bill/main/TestBillAPI.java`

**Purpose**: Standalone test utility for API integration

**Key Methods**:

```
public static void main(String[] args) throws Exception
  ├── Creates HTTP connection to API
  ├── Makes GET request with API key
  ├── Reads response
  ├── Deserializes JSON to Bill objects
  ├── Prints bill information
  └── Handles errors
```

**Output Format**:
```
Calling SAP BillV2 Sandbox API...

Response Code: 200
Raw JSON Response: [...]

========== BILLS FROM SAP SANDBOX ==========
Total bills fetched: X

--- Bill 1 ---
ID              : bill-xxx
Document Number : 12345
Billing Type    : CHARGE
Currency        : USD
Bill Status     : OPEN
Due Date        : 2026-05-31
Billing Date    : 2026-05-01
```

---

## 🚀 How It Works

### Application Flow

#### 1. Server Startup
```
1. Java runtime loads BillServer.main()
2. Creates HttpServer on port 8080
3. Registers two route handlers:
   - "/" → Serves HTML dashboard
   - "/bills" → Returns JSON bill data
4. Server starts in sync mode
5. Listens for incoming requests
6. Prints startup message to console
```

#### 2. Dashboard Request (http://localhost:8080/)
```
1. Client sends: GET / HTTP/1.1
2. Server receives via HttpHandler
3. Sets response header: Content-Type: text/html
4. Calls getDashboardHTML()
5. Returns HTML/CSS/JS code
6. Client renders dashboard in browser
7. Dashboard JavaScript makes subsequent /bills requests
```

#### 3. API Data Request (/bills endpoint)
```
1. Client/JavaScript sends: GET /bills HTTP/1.1
2. Server HttpHandler for "/bills" processes request
3. Calls fetchBillsFromSAP()
4. Creates HttpURLConnection to SAP API
5. Sets headers:
   - APIKey: wITmrAEUGLzlYWC2my5UOKunJinBNwe4
   - Accept: application/json
6. Sends GET request
7. Receives JSON response (200 OK)
8. Reads response into StringBuilder
9. Returns JSON string to client
```

#### 4. JSON Deserialization (In TestBillAPI)
```
1. Raw JSON string received
2. ObjectMapper created with modules:
   - JavaTimeModule (for date/time parsing)
3. Deserialization features configured:
   - FAIL_ON_UNKNOWN_PROPERTIES: false (ignores extra fields)
4. JSON parsed as JsonNode tree
5. Each node converted to Bill POJO
6. Bills added to ArrayList
7. Bill properties accessed and printed
```

### Request/Response Flow

**HTTP Request to SAP API**:
```
GET /subscriptionbilling/api/bill/v2/bills?pageNumber=1&pageSize=40&%24count=true HTTP/1.1
Host: sandbox.api.sap.com
APIKey: wITmrAEUGLzlYWC2my5UOKunJinBNwe4
Accept: application/json
Connection: close
```

**HTTP Response from SAP**:
```
HTTP/1.1 200 OK
Content-Type: application/json
x-count: 42
x-pagecount: 2
Content-Length: 65432

[
  {"id": "bill-1", "documentNumber": 12345, ...},
  {"id": "bill-2", "documentNumber": 12346, ...},
  ...
]
```

**Dashboard Response**:
```
HTTP/1.1 200 OK
Content-Type: text/html
Content-Length: 25000

<!DOCTYPE html>
<html>
...complete HTML dashboard...
</html>
```

---

## 🏃 Running the Application

### Prerequisites
1. **Java Development Kit (JDK)** - JDK 11 or higher
2. **Compiled Classes** - Must compile Java files first
3. **Dependencies** - Jackson JAR files must be in classpath

### Compilation

**Command** (from `g:\final_year_proj`):
```bash
javac -cp "newone\src\main\java;tools\*" -d newone\out newone\src\main\java\projectsap\sap\bill\main\*.java
```

**Explanation**:
- `-cp`: Classpath (includes source and JAR files)
- `-d`: Output directory for compiled classes
- Sources to compile: BillServer.java, TestBillAPI.java, all model classes

### Running BillServer

**Command** (from `g:\final_year_proj`):
```bash
java -cp "newone\out;tools\jackson-databind.jar;tools\jackson-core.jar;tools\jackson-annotations.jar;tools\jackson-jsr310.jar;tools\javax-annotation.jar;tools\jackson-nullable.jar;tools\jsr305.jar" projectsap.sap.bill.main.BillServer
```

**Output**:
```
========================================
  SAP Bill Dashboard is running!
  Open browser and go to:
  http://localhost:8080
========================================
```

**Access Dashboard**:
- Open web browser
- Navigate to: `http://localhost:8080`
- Dashboard displays bills, charts, statistics

### Running TestBillAPI

**Command** (standalone test):
```bash
java -cp "newone\out;tools\jackson-databind.jar;tools\jackson-core.jar;tools\jackson-annotations.jar;tools\jackson-jsr310.jar;tools\javax-annotation.jar;tools\jackson-nullable.jar;tools\jsr305.jar" projectsap.sap.bill.main.TestBillAPI
```

**Output**:
```
Calling SAP BillV2 Sandbox API...

Response Code: 200
Raw JSON Response: [...]
========== BILLS FROM SAP SANDBOX ==========
Total bills fetched: 25
...
```

### Stopping the Server
- Press `Ctrl+C` in terminal
- Or kill Java process

---

## 📦 Dependencies & Libraries

### Jackson Library Ecosystem

**Purpose**: JSON processing (serialization/deserialization)

**Components**:

| JAR File | Purpose |
|----------|---------|
| jackson-core.jar | Low-level JSON parsing and generation |
| jackson-databind.jar | Data binding (POJOs to JSON and vice versa) |
| jackson-annotations.jar | Annotations (@JsonProperty, @JsonCreator, etc.) |
| jackson-jsr310.jar | Java 8+ Date/Time support (LocalDate, LocalDateTime) |
| jackson-nullable.jar | JsonNullable type for sophisticated null handling |

**Usage in Code**:
```java
// Create mapper
ObjectMapper mapper = new ObjectMapper();
mapper.registerModule(new JavaTimeModule());
mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

// Deserialize JSON to object
Bill bill = mapper.readValue(jsonString, Bill.class);

// Deserialize to generic tree
JsonNode root = mapper.readTree(jsonString);

// Convert tree node to object
Bill bill = mapper.treeToValue(node, Bill.class);
```

### Annotation Libraries

| JAR File | Purpose |
|----------|---------|
| javax-annotation.jar | Standard Java annotations (@Nullable, @NotNull) |
| jsr305.jar | JSR-305 annotations for null safety and code analysis |

**Usage in Code**:
```java
@javax.annotation.Nullable
@JsonProperty(JSON_PROPERTY_ID)
public String getId() {
    return id;
}
```

### Java Built-in Libraries

| Package | Purpose |
|---------|---------|
| com.sun.net.httpserver | HTTP server implementation |
| java.io | Input/output streams |
| java.net | Network connections (HttpURLConnection) |
| java.util | Collections (ArrayList, HashMap) |
| java.time | Date/time classes (LocalDate) |

---

## ⚙️ Configuration

### API Configuration

**File**: `BillServer.java` and `TestBillAPI.java`

**Constants**:
```java
private static final String API_KEY = "wITmrAEUGLzlYWC2my5UOKunJinBNwe4";
private static final String API_URL = "https://sandbox.api.sap.com/subscriptionbilling/api/bill/v2/bills?pageNumber=1&pageSize=40&%24count=true";
```

**Modifiable Parameters**:
| Parameter | Current Value | Purpose |
|-----------|---------------|---------|
| Port | 8080 | HTTP server port |
| pageNumber | 1 | First page of results |
| pageSize | 40 | Bills per page |
| Timeout | 10000ms | Network timeout |

### Server Configuration

**Server Settings**:
```java
HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);
server.setExecutor(null);  // Synchronous mode
server.start();
```

**CORS Settings** (in response headers):
```java
exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
```

### Jackson Configuration

```java
ObjectMapper mapper = new ObjectMapper();
mapper.registerModule(new JavaTimeModule());            // Support for Java 8+ time
mapper.configure(
    DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false  // Ignore extra properties
);
```

---

## 💡 Key Concepts

### 1. Bill (Invoice Document)
A bill is the main entity representing a billing document in SAP Subscription Billing. It contains:
- Header info (ID, document number, dates, amounts)
- Line items (charges, credits, subscriptions)
- Party info (customer, payer, bill-to)
- Lifecycle info (status, closing, transfer)
- Audit trail (event log, metadata)

**Bill Status Flow**:
```
OPEN → CLOSING → CLOSED
```

**Billing Type**:
- CHARGE: Bill containing costs
- CREDIT: Credit note (negative amount)

### 2. Bill Items
Line items on a bill. Each item can contain:
- Subscription reference
- Product reference
- Charges or credits
- Pricing details
- Usage records

### 3. Charge
Represents a cost component:
- Can be recurring (monthly fee)
- Can be one-time (setup fee)
- Can be usage-based (pay per unit)
- Contains quantity and pricing information

### 4. Market & Region
Defines market-specific information:
- Currency
- Tax rules
- Market identity
- Regional configuration

### 5. Payment
Tracks payment information:
- Payment method
- Payment status
- Settlement details
- Credit card information (if applicable)

### 6. Closing
Manages bill closing process:
- Closing attempt status
- Failed attempt records
- Closing date
- Processing step

### 7. Event Log
Audit trail of bill lifecycle:
- Who created/modified the bill
- When changes occurred
- What changes were made
- Status transitions

### 8. Custom References
Extension mechanism for custom fields:
- Add custom properties to bills
- Extensibility without API changes
- Custom identifier mappings

### 9. Rate Plan
Pricing structure:
- Recurring charges
- One-time charges
- Usage-based charges
- Pricing tiers

### 10. Pricing Element
Breakdown of charges:
- Price type (fixed, linear, tiered, volume, percentage)
- Price details
- Quantity ranges
- Tier information

---

## 🔍 Important Implementation Details

### JSON Deserialization
```java
// Jackson handles:
// 1. Field name mapping (@JsonProperty)
// 2. Enum conversion (@JsonCreator)
// 3. Date/time parsing (JavaTimeModule)
// 4. Unknown properties (FAIL_ON_UNKNOWN_PROPERTIES: false)
// 5. Null values (JsonNullable)
```

### HTTP Connection Handling
```java
// Always close connections:
// - BufferedReader closed after use
// - HttpURLConnection automatically closed
// - Proper error handling for all HTTP codes
```

### Data Validation
```java
// Model classes include:
// - Required vs Optional fields
// - Enum validation
// - Type checking via Jackson
// - Property ordering (JsonPropertyOrder)
```

### Performance Considerations
- Synchronous HTTP calls (blocking)
- No connection pooling
- Single-threaded server (executor = null)
- Small page size (40 bills) for sandbox testing

### Security Notes
- API Key exposed in source code (sandbox only!)
- No HTTPS validation in test environment
- CORS headers allow all origins
- Input validation relies on Jackson

---

## 📝 Code Generation Background

### OpenAPI Generator
- **Tool**: org.openapitools.codegen
- **Source**: `BillV2_APIs.yaml`
- **Output**: 80+ model classes
- **Language**: JavaClientCodegen
- **Date Generated**: 2026-05-14

### What Was Generated
1. All model classes in `projectsap.sap.bill.model.*`
2. Documentation in `tools/generated/docs/*.md`
3. API client classes (if needed)
4. Gradle build configurations

### Manual Code
1. `BillServer.java` - HTTP server (custom)
2. `TestBillAPI.java` - Test utility (custom)

---

## 🐛 Troubleshooting

### Issue: Port 8080 Already in Use
```bash
# Windows: Find process using port 8080
netstat -ano | findstr :8080
# Kill process
taskkill /PID <PID> /F

# Change port in BillServer.java:
HttpServer server = HttpServer.create(new InetSocketAddress(8081), 0);
```

### Issue: API Key Expired
- Update `API_KEY` constant in BillServer.java and TestBillAPI.java
- Regenerate key from SAP account

### Issue: JSON Deserialization Fails
- Check that all required Jackson JARs are in classpath
- Verify API response structure matches model definitions
- Check Jackson configuration (FAIL_ON_UNKNOWN_PROPERTIES)

### Issue: Connection Timeout
- Increase timeout values in fetchBillsFromSAP()
- Check internet connectivity
- Verify SAP API is running

---

## 📚 Related Documentation

### External Resources
- **SAP Subscription Billing API Guide**: https://help.sap.com/viewer/987aec876092428f88162e438acf80d6/latest/en-US/
- **OpenAPI Specification**: https://spec.openapis.org/oas/v3.0.3
- **Jackson Documentation**: https://github.com/FasterXML/jackson
- **Java HttpServer**: https://docs.oracle.com/javase/11/docs/api/com.sun.net.httpserver/module-summary.html

### Generated Documentation
- See `tools/generated/docs/` for detailed model documentation

---

## 📋 Summary

This codebase is a **SAP Subscription Billing API integration** that:

1. **Connects** to SAP's Bills v2 REST API using HTTP
2. **Fetches** billing documents from sandbox environment
3. **Models** the data using 80+ auto-generated POJO classes
4. **Serves** a web dashboard on localhost:8080
5. **Provides** JSON API access to bill data

**Technology**: Java + Jackson + HTTP Server  
**Architecture**: Client ↔ HTTP Server ↔ SAP API  
**Use Case**: Billing data integration and visualization  
**Purpose**: Final year project for SAP Subscription Billing

---

**Generated**: May 15, 2026  
**Version**: 1.0  
**Status**: Complete Documentation

