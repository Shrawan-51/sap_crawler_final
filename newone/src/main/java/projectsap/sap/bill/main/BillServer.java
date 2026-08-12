
package projectsap.sap.bill.main;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fasterxml.jackson.databind.JsonNode;
import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;
import projectsap.sap.bill.model.Bill;

import java.io.*;
import java.net.*;
import java.nio.file.*;
import java.util.*;

public class BillServer {

    private static final String API_KEY = "wITmrAEUGLzlYWC2my5UOKunJinBNwe4";
    private static final String API_URL = "https://sandbox.api.sap.com/subscriptionbilling/api/bill/v2/bills?pageNumber=1&pageSize=40&%24count=true";

    // Resolve frontend directory relative to project root
    private static final String FRONTEND_DIR = resolveFrontendDir();

    public static void main(String[] args) throws Exception {

        // ── Initialize Database ──────────────────────────────────
        System.out.println("[Server] Connecting to PostgreSQL...");
        int retries = 0;
        boolean dbReady = false;
        while (retries < 10) {
            if (DatabaseManager.testConnection()) {
                dbReady = true;
                break;
            }
            retries++;
            System.out.println("[Server] Waiting for database... attempt " + retries + "/10");
            Thread.sleep(2000);
        }

        if (dbReady) {
            DatabaseManager.initDatabase();
            System.out.println("[Server] Database ready.");
        } else {
            System.out.println("[Server] WARNING: Could not connect to PostgreSQL. Running without database.");
            System.out.println("[Server] Make sure Docker is running: docker compose up -d");
        }

        // ── Start HTTP Server ────────────────────────────────────
        HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);

        // ── API: Get bills from database ─────────────────────────
        server.createContext("/api/bills", exchange -> {
            addCorsHeaders(exchange);
            if (handlePreflight(exchange)) return;

            try {
                String path = exchange.getRequestURI().getPath();

                // /api/bills/{id} — single bill
                if (path.length() > "/api/bills/".length()) {
                    String id = path.substring("/api/bills/".length());
                    String json = DatabaseManager.getBillById(id);
                    if (json != null) {
                        sendJson(exchange, 200, json);
                    } else {
                        sendJson(exchange, 404, "{\"error\":\"Bill not found\"}");
                    }
                    return;
                }

                // /api/bills?status=X&type=Y&currency=Z — filtered list
                Map<String, String> queryParams = parseQuery(exchange.getRequestURI().getQuery());
                String status = queryParams.get("status");
                String type = queryParams.get("type");
                String currency = queryParams.get("currency");

                String json = DatabaseManager.getAllBills(status, type, currency);
                sendJson(exchange, 200, json);

            } catch (Exception e) {
                e.printStackTrace();
                sendJson(exchange, 500, "{\"error\":\"" + escapeJson(e.getMessage()) + "\"}");
            }
        });

        // ── API: Stats ───────────────────────────────────────────
        server.createContext("/api/stats", exchange -> {
            addCorsHeaders(exchange);
            if (handlePreflight(exchange)) return;

            try {
                String json = DatabaseManager.getStats();
                sendJson(exchange, 200, json);
            } catch (Exception e) {
                e.printStackTrace();
                sendJson(exchange, 500, "{\"error\":\"" + escapeJson(e.getMessage()) + "\"}");
            }
        });

        // ── API: Sync — fetch from SAP and save to DB ────────────
        server.createContext("/api/sync", exchange -> {
            addCorsHeaders(exchange);
            if (handlePreflight(exchange)) return;

            try {
                System.out.println("[Sync] Fetching bills from SAP API...");
                String json = fetchBillsFromSAP();
                int count = DatabaseManager.saveBills(json);
                sendJson(exchange, 200,
                    "{\"success\":true,\"message\":\"Synced " + count + " bills from SAP\",\"count\":" + count + "}");
            } catch (Exception e) {
                e.printStackTrace();
                DatabaseManager.logFetchError(e.getMessage());
                sendJson(exchange, 500, "{\"success\":false,\"error\":\"" + escapeJson(e.getMessage()) + "\"}");
            }
        });

        // ── API: Fetch log history ───────────────────────────────
        server.createContext("/api/fetch-log", exchange -> {
            addCorsHeaders(exchange);
            if (handlePreflight(exchange)) return;

            try {
                String json = DatabaseManager.getFetchLog();
                sendJson(exchange, 200, json);
            } catch (Exception e) {
                e.printStackTrace();
                sendJson(exchange, 500, "{\"error\":\"" + escapeJson(e.getMessage()) + "\"}");
            }
        });

        // ── Legacy: Direct SAP API proxy ─────────────────────────
        server.createContext("/bills", exchange -> {
            addCorsHeaders(exchange);
            exchange.getResponseHeaders().add("Content-Type", "application/json");

            try {
                String json = fetchBillsFromSAP();
                byte[] response = json.getBytes();
                exchange.sendResponseHeaders(200, response.length);
                OutputStream os = exchange.getResponseBody();
                os.write(response);
                os.close();
            } catch (Exception e) {
                String error = "{\"error\":\"" + e.getMessage() + "\"}";
                byte[] response = error.getBytes();
                exchange.sendResponseHeaders(500, response.length);
                OutputStream os = exchange.getResponseBody();
                os.write(response);
                os.close();
            }
        });

        // ── Static Files: Frontend ───────────────────────────────
        server.createContext("/frontend/", exchange -> {
            String path = exchange.getRequestURI().getPath();
            // Remove /frontend/ prefix to get the file path
            String filePath = path.substring("/frontend/".length());

            File file = new File(FRONTEND_DIR, filePath);
            if (file.exists() && file.isFile()) {
                String contentType = getContentType(filePath);
                exchange.getResponseHeaders().add("Content-Type", contentType);
                byte[] bytes = Files.readAllBytes(file.toPath());
                exchange.sendResponseHeaders(200, bytes.length);
                OutputStream os = exchange.getResponseBody();
                os.write(bytes);
                os.close();
            } else {
                String notFound = "File not found: " + filePath;
                exchange.sendResponseHeaders(404, notFound.length());
                OutputStream os = exchange.getResponseBody();
                os.write(notFound.getBytes());
                os.close();
            }
        });

        // ── Root: Serve index.html ───────────────────────────────
        server.createContext("/", exchange -> {
            String path = exchange.getRequestURI().getPath();

            // Only serve index.html for root path
            if (path.equals("/") || path.equals("/index.html")) {
                File indexFile = new File(FRONTEND_DIR, "index.html");
                if (indexFile.exists()) {
                    exchange.getResponseHeaders().add("Content-Type", "text/html; charset=UTF-8");
                    byte[] bytes = Files.readAllBytes(indexFile.toPath());
                    exchange.sendResponseHeaders(200, bytes.length);
                    OutputStream os = exchange.getResponseBody();
                    os.write(bytes);
                    os.close();
                } else {
                    // Fallback to embedded dashboard if frontend not found
                    exchange.getResponseHeaders().add("Content-Type", "text/html");
                    String html = getFallbackHTML();
                    byte[] response = html.getBytes();
                    exchange.sendResponseHeaders(200, response.length);
                    OutputStream os = exchange.getResponseBody();
                    os.write(response);
                    os.close();
                }
            } else {
                // Try to serve as a static file from frontend dir
                String filePath = path.substring(1); // remove leading /
                File file = new File(FRONTEND_DIR, filePath);
                if (file.exists() && file.isFile()) {
                    String contentType = getContentType(filePath);
                    exchange.getResponseHeaders().add("Content-Type", contentType);
                    byte[] bytes = Files.readAllBytes(file.toPath());
                    exchange.sendResponseHeaders(200, bytes.length);
                    OutputStream os = exchange.getResponseBody();
                    os.write(bytes);
                    os.close();
                } else {
                    String notFound = "404 Not Found";
                    exchange.sendResponseHeaders(404, notFound.length());
                    OutputStream os = exchange.getResponseBody();
                    os.write(notFound.getBytes());
                    os.close();
                }
            }
        });

        server.setExecutor(null);
        server.start();
        System.out.println("========================================");
        System.out.println("  SAP Bill Dashboard is running!");
        System.out.println("  Open browser and go to:");
        System.out.println("  http://localhost:8080");
        System.out.println("========================================");
    }

    // ── Fetch bills from SAP sandbox ─────────────────────────────
    private static String fetchBillsFromSAP() throws Exception {
        URL url = new URL(API_URL);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("GET");
        conn.setRequestProperty("APIKey", API_KEY);
        conn.setRequestProperty("Accept", "application/json");
        conn.setConnectTimeout(10000);
        conn.setReadTimeout(10000);

        int responseCode = conn.getResponseCode();

        BufferedReader reader;
        if (responseCode == 200) {
            reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
        } else {
            reader = new BufferedReader(new InputStreamReader(conn.getErrorStream()));
        }

        StringBuilder response = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            response.append(line);
        }
        reader.close();

        return response.toString();
    }

    // ── Helpers ──────────────────────────────────────────────────

    private static void addCorsHeaders(HttpExchange exchange) {
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");
    }

    private static boolean handlePreflight(HttpExchange exchange) throws IOException {
        if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
            exchange.sendResponseHeaders(204, -1);
            return true;
        }
        return false;
    }

    private static void sendJson(HttpExchange exchange, int status, String json) throws IOException {
        exchange.getResponseHeaders().add("Content-Type", "application/json; charset=UTF-8");
        byte[] response = json.getBytes("UTF-8");
        exchange.sendResponseHeaders(status, response.length);
        OutputStream os = exchange.getResponseBody();
        os.write(response);
        os.close();
    }

    private static Map<String, String> parseQuery(String query) {
        Map<String, String> params = new HashMap<>();
        if (query == null || query.isEmpty()) return params;
        for (String pair : query.split("&")) {
            String[] kv = pair.split("=", 2);
            if (kv.length == 2) {
                try {
                    params.put(URLDecoder.decode(kv[0], "UTF-8"),
                               URLDecoder.decode(kv[1], "UTF-8"));
                } catch (UnsupportedEncodingException e) {
                    params.put(kv[0], kv[1]);
                }
            }
        }
        return params;
    }

    private static String getContentType(String path) {
        if (path.endsWith(".html")) return "text/html; charset=UTF-8";
        if (path.endsWith(".css"))  return "text/css; charset=UTF-8";
        if (path.endsWith(".js"))   return "application/javascript; charset=UTF-8";
        if (path.endsWith(".json")) return "application/json; charset=UTF-8";
        if (path.endsWith(".png"))  return "image/png";
        if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
        if (path.endsWith(".svg"))  return "image/svg+xml";
        if (path.endsWith(".ico"))  return "image/x-icon";
        if (path.endsWith(".woff")) return "font/woff";
        if (path.endsWith(".woff2")) return "font/woff2";
        return "application/octet-stream";
    }

    private static String resolveFrontendDir() {
        // Try to locate frontend/ relative to working directory
        String[] candidates = {
            "frontend",                        // running from project root
            "../frontend",                     // running from newone/
            "../../frontend"                   // running from deeper
        };
        for (String candidate : candidates) {
            File dir = new File(candidate);
            if (dir.exists() && dir.isDirectory()) {
                try {
                    return dir.getCanonicalPath();
                } catch (IOException e) {
                    return dir.getAbsolutePath();
                }
            }
        }
        // Default
        return "frontend";
    }

    private static String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r");
    }

    // Minimal fallback if frontend files are missing
    private static String getFallbackHTML() {
        return """
<!DOCTYPE html>
<html>
<head><title>SAP Bill Dashboard</title></head>
<body style="font-family:sans-serif;text-align:center;padding:50px;">
    <h1>SAP Bill Dashboard</h1>
    <p>Frontend files not found in <code>frontend/</code> directory.</p>
    <p>Please ensure the <code>frontend/</code> folder exists with index.html, styles.css, and app.js.</p>
    <p><a href="/api/stats">View API Stats</a> | <a href="/api/sync">Sync from SAP</a> | <a href="/bills">Raw Bills</a></p>
</body>
</html>
        """;
    }
}