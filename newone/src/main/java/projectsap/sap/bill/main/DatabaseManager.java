package projectsap.sap.bill.main;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import projectsap.sap.bill.model.Bill;

import java.math.BigDecimal;
import java.sql.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Manages PostgreSQL database operations for SAP Bill data.
 * Handles connection management, schema initialization, and CRUD operations.
 */
public class DatabaseManager {

    private static final String DB_URL = "jdbc:postgresql://localhost:5432/sap_bills";
    private static final String DB_USER = "sapuser";
    private static final String DB_PASS = "sappass";

    private static final ObjectMapper mapper = new ObjectMapper();

    static {
        mapper.registerModule(new JavaTimeModule());
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }

    // ─── Connection ─────────────────────────────────────────────

    /**
     * Get a new database connection.
     */
    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(DB_URL, DB_USER, DB_PASS);
    }

    /**
     * Test if the database is reachable.
     */
    public static boolean testConnection() {
        try (Connection conn = getConnection()) {
            return conn.isValid(5);
        } catch (SQLException e) {
            System.err.println("[DB] Connection test failed: " + e.getMessage());
            return false;
        }
    }

    // ─── Schema ─────────────────────────────────────────────────

    /**
     * Initialize database tables if they don't exist.
     */
    public static void initDatabase() throws SQLException {
        String createBills = """
            CREATE TABLE IF NOT EXISTS bills (
                id                 VARCHAR(255) PRIMARY KEY,
                document_number    BIGINT,
                billing_type       VARCHAR(50),
                bill_status        VARCHAR(50),
                transfer_status    VARCHAR(50),
                currency           VARCHAR(10),
                due_date           DATE,
                billing_date       DATE,
                billing_profile_id VARCHAR(255),
                time_zone          VARCHAR(100),
                split_element      VARCHAR(255),
                contract_account   VARCHAR(255),
                create_invoice     BOOLEAN,
                customer_id        VARCHAR(255),
                customer_type      VARCHAR(50),
                customer_country   VARCHAR(100),
                market_id          VARCHAR(255),
                net_amount         DECIMAL(18,2),
                net_currency       VARCHAR(10),
                gross_amount       DECIMAL(18,2),
                gross_currency     VARCHAR(10),
                raw_json           TEXT,
                fetched_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """;

        String createFetchLog = """
            CREATE TABLE IF NOT EXISTS fetch_log (
                id          SERIAL PRIMARY KEY,
                fetched_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                bill_count  INTEGER,
                status      VARCHAR(50),
                message     TEXT
            )
            """;

        try (Connection conn = getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.execute(createBills);
            stmt.execute(createFetchLog);
            System.out.println("[DB] Database tables initialized successfully.");
        }
    }

    // ─── Save Bills ─────────────────────────────────────────────

    /**
     * Save a list of bills to the database, upserting on conflict.
     * Returns the number of bills saved.
     */
    public static int saveBills(String jsonArrayString) throws Exception {
        JsonNode root = mapper.readTree(jsonArrayString);
        if (!root.isArray()) {
            throw new IllegalArgumentException("Expected JSON array of bills");
        }

        String upsertSql = """
            INSERT INTO bills (id, document_number, billing_type, bill_status, transfer_status,
                               currency, due_date, billing_date, billing_profile_id, time_zone,
                               split_element, contract_account, create_invoice,
                               customer_id, customer_type, customer_country,
                               market_id, net_amount, net_currency, gross_amount, gross_currency,
                               raw_json, fetched_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (id) DO UPDATE SET
                document_number = EXCLUDED.document_number,
                billing_type = EXCLUDED.billing_type,
                bill_status = EXCLUDED.bill_status,
                transfer_status = EXCLUDED.transfer_status,
                currency = EXCLUDED.currency,
                due_date = EXCLUDED.due_date,
                billing_date = EXCLUDED.billing_date,
                billing_profile_id = EXCLUDED.billing_profile_id,
                time_zone = EXCLUDED.time_zone,
                split_element = EXCLUDED.split_element,
                contract_account = EXCLUDED.contract_account,
                create_invoice = EXCLUDED.create_invoice,
                customer_id = EXCLUDED.customer_id,
                customer_type = EXCLUDED.customer_type,
                customer_country = EXCLUDED.customer_country,
                market_id = EXCLUDED.market_id,
                net_amount = EXCLUDED.net_amount,
                net_currency = EXCLUDED.net_currency,
                gross_amount = EXCLUDED.gross_amount,
                gross_currency = EXCLUDED.gross_currency,
                raw_json = EXCLUDED.raw_json,
                updated_at = CURRENT_TIMESTAMP
            """;

        int count = 0;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(upsertSql)) {

            for (JsonNode node : root) {
                ps.setString(1, getTextOrNull(node, "id"));
                ps.setObject(2, node.has("documentNumber") && !node.get("documentNumber").isNull()
                        ? node.get("documentNumber").asLong() : null);
                ps.setString(3, getTextOrNull(node, "billingType"));
                ps.setString(4, getTextOrNull(node, "billStatus"));
                ps.setString(5, getTextOrNull(node, "transferStatus"));
                ps.setString(6, getTextOrNull(node, "currency"));

                // Dates
                LocalDate dueDate = parseDate(getTextOrNull(node, "dueDate"));
                LocalDate billingDate = parseDate(getTextOrNull(node, "billingDate"));
                ps.setObject(7, dueDate);
                ps.setObject(8, billingDate);

                ps.setString(9, getTextOrNull(node, "billingProfileId"));
                ps.setString(10, getTextOrNull(node, "timeZone"));
                ps.setString(11, getTextOrNull(node, "splitElement"));
                ps.setString(12, getTextOrNull(node, "contractAccount"));

                // createInvoice
                if (node.has("createInvoice") && !node.get("createInvoice").isNull()) {
                    ps.setBoolean(13, node.get("createInvoice").asBoolean());
                } else {
                    ps.setNull(13, Types.BOOLEAN);
                }

                // Customer
                JsonNode customer = node.get("customer");
                if (customer != null && !customer.isNull()) {
                    ps.setString(14, getTextOrNull(customer, "id"));
                    ps.setString(15, getTextOrNull(customer, "type"));
                    ps.setString(16, getTextOrNull(customer, "country"));
                } else {
                    ps.setNull(14, Types.VARCHAR);
                    ps.setNull(15, Types.VARCHAR);
                    ps.setNull(16, Types.VARCHAR);
                }

                // Market
                JsonNode market = node.get("market");
                ps.setString(17, market != null && !market.isNull() ? getTextOrNull(market, "id") : null);

                // Net Amount
                JsonNode netAmount = node.get("netAmount");
                if (netAmount != null && !netAmount.isNull() && netAmount.has("amount")) {
                    ps.setBigDecimal(18, new BigDecimal(netAmount.get("amount").asText()));
                    ps.setString(19, getTextOrNull(netAmount, "currency"));
                } else {
                    ps.setNull(18, Types.DECIMAL);
                    ps.setNull(19, Types.VARCHAR);
                }

                // Gross Amount
                JsonNode grossAmount = node.get("grossAmount");
                if (grossAmount != null && !grossAmount.isNull() && grossAmount.has("amount")) {
                    ps.setBigDecimal(20, new BigDecimal(grossAmount.get("amount").asText()));
                    ps.setString(21, getTextOrNull(grossAmount, "currency"));
                } else {
                    ps.setNull(20, Types.DECIMAL);
                    ps.setNull(21, Types.VARCHAR);
                }

                // Raw JSON
                ps.setString(22, node.toString());

                ps.addBatch();
                count++;
            }

            ps.executeBatch();
            System.out.println("[DB] Saved " + count + " bills to database.");

            // Log the fetch
            logFetch(conn, count, "SUCCESS", "Fetched and saved " + count + " bills from SAP API");
        }

        return count;
    }

    // ─── Query Bills ────────────────────────────────────────────

    /**
     * Get all bills from database as JSON array string.
     * Supports optional filters: status, type, currency.
     */
    public static String getAllBills(String status, String type, String currency) throws SQLException {
        StringBuilder sql = new StringBuilder("SELECT raw_json FROM bills WHERE 1=1");
        List<String> params = new ArrayList<>();

        if (status != null && !status.isEmpty()) {
            sql.append(" AND bill_status = ?");
            params.add(status);
        }
        if (type != null && !type.isEmpty()) {
            sql.append(" AND billing_type = ?");
            params.add(type);
        }
        if (currency != null && !currency.isEmpty()) {
            sql.append(" AND currency = ?");
            params.add(currency);
        }

        sql.append(" ORDER BY billing_date DESC, document_number DESC");

        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {

            for (int i = 0; i < params.size(); i++) {
                ps.setString(i + 1, params.get(i));
            }

            ResultSet rs = ps.executeQuery();
            StringBuilder jsonArray = new StringBuilder("[");
            boolean first = true;

            while (rs.next()) {
                if (!first) jsonArray.append(",");
                jsonArray.append(rs.getString("raw_json"));
                first = false;
            }

            jsonArray.append("]");
            return jsonArray.toString();
        }
    }

    /**
     * Get a single bill by ID as JSON string.
     */
    public static String getBillById(String id) throws SQLException {
        String sql = "SELECT raw_json FROM bills WHERE id = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, id);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                return rs.getString("raw_json");
            }
            return null;
        }
    }

    /**
     * Get aggregated statistics as JSON.
     */
    public static String getStats() throws SQLException {
        StringBuilder json = new StringBuilder("{");

        try (Connection conn = getConnection();
             Statement stmt = conn.createStatement()) {

            // Total count
            ResultSet rs = stmt.executeQuery("SELECT COUNT(*) as total FROM bills");
            rs.next();
            json.append("\"totalBills\":").append(rs.getInt("total")).append(",");

            // By status
            rs = stmt.executeQuery(
                "SELECT bill_status, COUNT(*) as cnt FROM bills GROUP BY bill_status ORDER BY bill_status");
            json.append("\"byStatus\":{");
            boolean first = true;
            while (rs.next()) {
                if (!first) json.append(",");
                String status = rs.getString("bill_status");
                json.append("\"").append(status != null ? status : "UNKNOWN").append("\":")
                    .append(rs.getInt("cnt"));
                first = false;
            }
            json.append("},");

            // By type
            rs = stmt.executeQuery(
                "SELECT billing_type, COUNT(*) as cnt FROM bills GROUP BY billing_type ORDER BY billing_type");
            json.append("\"byType\":{");
            first = true;
            while (rs.next()) {
                if (!first) json.append(",");
                String type = rs.getString("billing_type");
                json.append("\"").append(type != null ? type : "UNKNOWN").append("\":")
                    .append(rs.getInt("cnt"));
                first = false;
            }
            json.append("},");

            // By currency
            rs = stmt.executeQuery(
                "SELECT currency, COUNT(*) as cnt FROM bills GROUP BY currency ORDER BY currency");
            json.append("\"byCurrency\":{");
            first = true;
            while (rs.next()) {
                if (!first) json.append(",");
                String cur = rs.getString("currency");
                json.append("\"").append(cur != null ? cur : "UNKNOWN").append("\":")
                    .append(rs.getInt("cnt"));
                first = false;
            }
            json.append("},");

            // Total amounts
            rs = stmt.executeQuery(
                "SELECT COALESCE(SUM(net_amount), 0) as total_net, COALESCE(SUM(gross_amount), 0) as total_gross FROM bills");
            rs.next();
            json.append("\"totalNetAmount\":").append(rs.getBigDecimal("total_net")).append(",");
            json.append("\"totalGrossAmount\":").append(rs.getBigDecimal("total_gross")).append(",");

            // Currencies list
            rs = stmt.executeQuery("SELECT DISTINCT currency FROM bills WHERE currency IS NOT NULL ORDER BY currency");
            json.append("\"currencies\":[");
            first = true;
            while (rs.next()) {
                if (!first) json.append(",");
                json.append("\"").append(rs.getString("currency")).append("\"");
                first = false;
            }
            json.append("],");

            // Last fetch info
            rs = stmt.executeQuery(
                "SELECT fetched_at, bill_count, status, message FROM fetch_log ORDER BY fetched_at DESC LIMIT 1");
            if (rs.next()) {
                json.append("\"lastSync\":{");
                json.append("\"at\":\"").append(rs.getTimestamp("fetched_at")).append("\",");
                json.append("\"count\":").append(rs.getInt("bill_count")).append(",");
                json.append("\"status\":\"").append(rs.getString("status")).append("\",");
                json.append("\"message\":\"").append(escapeJson(rs.getString("message"))).append("\"");
                json.append("}");
            } else {
                json.append("\"lastSync\":null");
            }

            json.append("}");
        }

        return json.toString();
    }

    /**
     * Get fetch log history as JSON array.
     */
    public static String getFetchLog() throws SQLException {
        String sql = "SELECT id, fetched_at, bill_count, status, message FROM fetch_log ORDER BY fetched_at DESC LIMIT 50";
        try (Connection conn = getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {

            StringBuilder json = new StringBuilder("[");
            boolean first = true;
            while (rs.next()) {
                if (!first) json.append(",");
                json.append("{");
                json.append("\"id\":").append(rs.getInt("id")).append(",");
                json.append("\"fetchedAt\":\"").append(rs.getTimestamp("fetched_at")).append("\",");
                json.append("\"billCount\":").append(rs.getInt("bill_count")).append(",");
                json.append("\"status\":\"").append(rs.getString("status")).append("\",");
                json.append("\"message\":\"").append(escapeJson(rs.getString("message"))).append("\"");
                json.append("}");
                first = false;
            }
            json.append("]");
            return json.toString();
        }
    }

    // ─── Helpers ────────────────────────────────────────────────

    private static void logFetch(Connection conn, int count, String status, String message) {
        String sql = "INSERT INTO fetch_log (bill_count, status, message) VALUES (?, ?, ?)";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, count);
            ps.setString(2, status);
            ps.setString(3, message);
            ps.executeUpdate();
        } catch (SQLException e) {
            System.err.println("[DB] Failed to log fetch: " + e.getMessage());
        }
    }

    /**
     * Log a failed fetch attempt.
     */
    public static void logFetchError(String message) {
        try (Connection conn = getConnection()) {
            logFetch(conn, 0, "ERROR", message);
        } catch (SQLException e) {
            System.err.println("[DB] Failed to log fetch error: " + e.getMessage());
        }
    }

    private static String getTextOrNull(JsonNode node, String field) {
        if (node == null || !node.has(field) || node.get(field).isNull()) {
            return null;
        }
        return node.get(field).asText();
    }

    private static LocalDate parseDate(String dateStr) {
        if (dateStr == null || dateStr.isEmpty()) return null;
        try {
            return LocalDate.parse(dateStr);
        } catch (Exception e) {
            return null;
        }
    }

    private static String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}
