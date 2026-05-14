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
import java.util.*;

public class BillServer {

    // ✅ PASTE YOUR API KEY HERE
    private static final String API_KEY = "wITmrAEUGLzlYWC2my5UOKunJinBNwe4";
    private static final String API_URL = "https://sandbox.api.sap.com/subscriptionbilling/api/bill/v2/bills?pageNumber=1&pageSize=40&%24count=true";

    public static void main(String[] args) throws Exception {

        // Start HTTP server on port 8080
        HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);

        // Route: /bills → returns JSON data
        server.createContext("/bills", new HttpHandler() {
            public void handle(HttpExchange exchange) throws IOException {
                // Add CORS headers
                exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
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
            }
        });

        // Route: / → serves the HTML dashboard
        server.createContext("/", new HttpHandler() {
            public void handle(HttpExchange exchange) throws IOException {
                exchange.getResponseHeaders().add("Content-Type", "text/html");
                String html = getDashboardHTML();
                byte[] response = html.getBytes();
                exchange.sendResponseHeaders(200, response.length);
                OutputStream os = exchange.getResponseBody();
                os.write(response);
                os.close();
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

    // Fetch bills from SAP sandbox and return as JSON string
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

    // Returns the full HTML dashboard page
    private static String getDashboardHTML() {
        return """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SAP Bill Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', sans-serif; background: #f0f2f5; color: #333; }

        .header {
            background: linear-gradient(135deg, #003366, #0066cc);
            color: white; padding: 20px 30px;
            display: flex; align-items: center; gap: 15px;
        }
        .header h1 { font-size: 24px; }
        .header p { font-size: 13px; opacity: 0.8; }

        .container { padding: 25px; max-width: 1300px; margin: auto; }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px; margin-bottom: 25px;
        }
        .stat-card {
            background: white; border-radius: 12px;
            padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            border-left: 5px solid #0066cc;
        }
        .stat-card.green { border-left-color: #28a745; }
        .stat-card.orange { border-left-color: #fd7e14; }
        .stat-card.red { border-left-color: #dc3545; }
        .stat-card h3 { font-size: 13px; color: #888; margin-bottom: 8px; }
        .stat-card .value { font-size: 28px; font-weight: 700; color: #003366; }

        .charts-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px; margin-bottom: 25px;
        }
        .chart-card {
            background: white; border-radius: 12px;
            padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .chart-card h3 { margin-bottom: 15px; color: #003366; font-size: 15px; }

        .table-card {
            background: white; border-radius: 12px;
            padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .table-header {
            display: flex; justify-content: space-between;
            align-items: center; margin-bottom: 15px;
        }
        .table-header h3 { color: #003366; font-size: 15px; }

        .search-box {
            padding: 8px 15px; border: 1px solid #ddd;
            border-radius: 20px; font-size: 13px;
            width: 250px; outline: none;
        }
        .search-box:focus { border-color: #0066cc; }

        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        thead th {
            background: #003366; color: white;
            padding: 12px 15px; text-align: left;
            font-weight: 500;
        }
        tbody tr { border-bottom: 1px solid #f0f0f0; }
        tbody tr:hover { background: #f8f9ff; }
        tbody td { padding: 12px 15px; }

        .badge {
            padding: 4px 10px; border-radius: 20px;
            font-size: 11px; font-weight: 600;
        }
        .badge.open { background: #e3f2fd; color: #1565c0; }
        .badge.closed { background: #e8f5e9; color: #2e7d32; }
        .badge.charge { background: #fff3e0; color: #e65100; }
        .badge.credit { background: #fce4ec; color: #c62828; }

        .loading {
            text-align: center; padding: 50px;
            color: #888; font-size: 16px;
        }
        .error {
            text-align: center; padding: 30px;
            color: #dc3545; font-size: 14px;
        }
    </style>
</head>
<body>

<div class="header">
    <div>
        <h1>🧾 SAP Bill Dashboard</h1>
        <p>Live data from SAP BillV2 Sandbox API</p>
    </div>
</div>

<div class="container">

    <!-- Stats -->
    <div class="stats-grid">
        <div class="stat-card">
            <h3>TOTAL BILLS</h3>
            <div class="value" id="totalBills">--</div>
        </div>
        <div class="stat-card green">
            <h3>CLOSED BILLS</h3>
            <div class="value" id="closedBills">--</div>
        </div>
        <div class="stat-card orange">
            <h3>OPEN BILLS</h3>
            <div class="value" id="openBills">--</div>
        </div>
        <div class="stat-card red">
            <h3>CURRENCIES</h3>
            <div class="value" id="currencies">--</div>
        </div>
    </div>

    <!-- Charts -->
    <div class="charts-grid">
        <div class="chart-card">
            <h3>📊 Bill Status Distribution</h3>
            <canvas id="statusChart"></canvas>
        </div>
        <div class="chart-card">
            <h3>📈 Billing Type Distribution</h3>
            <canvas id="typeChart"></canvas>
        </div>
    </div>

    <!-- Table -->
    <div class="table-card">
        <div class="table-header">
            <h3>📋 All Bills</h3>
            <input type="text" class="search-box"
                   placeholder="🔍 Search bills..."
                   onkeyup="filterTable(this.value)">
        </div>
        <div id="tableContainer">
            <div class="loading">⏳ Loading bills from SAP...</div>
        </div>
    </div>

</div>

<script>
    let allBills = [];

    // Fetch data from Java server
    async function loadBills() {
        try {
            const response = await fetch('/bills');
            const data = await response.json();

            if (data.error) {
                document.getElementById('tableContainer').innerHTML =
                    '<div class="error">❌ Error: ' + data.error + '</div>';
                return;
            }

            allBills = Array.isArray(data) ? data : [data];
            renderDashboard(allBills);

        } catch (err) {
            document.getElementById('tableContainer').innerHTML =
                '<div class="error">❌ Could not connect to SAP API: ' + err.message + '</div>';
        }
    }

    function renderDashboard(bills) {
        // Stats
        document.getElementById('totalBills').textContent = bills.length;

        const closed = bills.filter(b => b.billStatus === 'CLOSED').length;
        const open = bills.filter(b => b.billStatus === 'OPEN').length;
        const currencies = [...new Set(bills.map(b => b.currency).filter(Boolean))].length;

        document.getElementById('closedBills').textContent = closed;
        document.getElementById('openBills').textContent = open;
        document.getElementById('currencies').textContent = currencies;

        // Status Chart
        const statusCounts = {};
        bills.forEach(b => {
            const s = b.billStatus || 'UNKNOWN';
            statusCounts[s] = (statusCounts[s] || 0) + 1;
        });

        new Chart(document.getElementById('statusChart'), {
            type: 'doughnut',
            data: {
                labels: Object.keys(statusCounts),
                datasets: [{
                    data: Object.values(statusCounts),
                    backgroundColor: ['#0066cc', '#28a745', '#fd7e14', '#dc3545', '#6f42c1']
                }]
            },
            options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
        });

        // Type Chart
        const typeCounts = {};
        bills.forEach(b => {
            const t = b.billingType || 'UNKNOWN';
            typeCounts[t] = (typeCounts[t] || 0) + 1;
        });

        new Chart(document.getElementById('typeChart'), {
            type: 'bar',
            data: {
                labels: Object.keys(typeCounts),
                datasets: [{
                    label: 'Count',
                    data: Object.values(typeCounts),
                    backgroundColor: '#0066cc'
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
            }
        });

        // Table
        renderTable(bills);
    }

    function renderTable(bills) {
        if (bills.length === 0) {
            document.getElementById('tableContainer').innerHTML =
                '<div class="loading">No bills found</div>';
            return;
        }

        let html = `<table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Document No</th>
                    <th>Billing Type</th>
                    <th>Status</th>
                    <th>Currency</th>
                    <th>Due Date</th>
                    <th>Billing Date</th>
                </tr>
            </thead>
            <tbody>`;

        bills.forEach(b => {
            const statusClass = (b.billStatus || '').toLowerCase();
            const typeClass = (b.billingType || '').toLowerCase();
            html += `<tr>
                <td>${b.id || '-'}</td>
                <td>${b.documentNumber || '-'}</td>
                <td><span class="badge ${typeClass}">${b.billingType || '-'}</span></td>
                <td><span class="badge ${statusClass}">${b.billStatus || '-'}</span></td>
                <td>${b.currency || '-'}</td>
                <td>${b.dueDate || '-'}</td>
                <td>${b.billingDate || '-'}</td>
            </tr>`;
        });

        html += '</tbody></table>';
        document.getElementById('tableContainer').innerHTML = html;
    }

    function filterTable(query) {
        const filtered = allBills.filter(b => {
            const str = JSON.stringify(b).toLowerCase();
            return str.includes(query.toLowerCase());
        });
        renderTable(filtered);
    }

    // Load on page start
    loadBills();
</script>

</body>
</html>
        """;
    }
}