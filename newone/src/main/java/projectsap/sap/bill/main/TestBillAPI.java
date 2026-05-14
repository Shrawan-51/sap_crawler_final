package projectsap.sap.bill.main;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fasterxml.jackson.databind.JsonNode;
import projectsap.sap.bill.model.Bill;

import java.net.HttpURLConnection;
import java.net.URL;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;

public class TestBillAPI {

    // ✅ PASTE YOUR API KEY HERE
    private static final String API_KEY = "wITmrAEUGLzlYWC2my5UOKunJinBNwe4";

    // SAP Sandbox URL
    private static final String API_URL = "https://sandbox.api.sap.com/subscriptionbilling/api/bill/v2/bills?pageNumber=1&pageSize=40&%24count=true";

    public static void main(String[] args) throws Exception {

        System.out.println("Calling SAP BillV2 Sandbox API...\n");

        // Step 1: Make HTTP GET request
        URL url = new URL(API_URL);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("GET");
        conn.setRequestProperty("APIKey", API_KEY);
        conn.setRequestProperty("Accept", "application/json");
        conn.setConnectTimeout(10000);
        conn.setReadTimeout(10000);

        int responseCode = conn.getResponseCode();
        System.out.println("Response Code: " + responseCode);

        // Step 2: Read response
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

        String jsonResponse = response.toString();
        System.out.println("Raw JSON Response:");
        System.out.println(jsonResponse);
        System.out.println();

        if (responseCode != 200) {
            System.out.println("API call failed with code: " + responseCode);
            return;
        }

        // Step 3: Map JSON to POJOs
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

        // Response is an array of bills
        JsonNode root = mapper.readTree(jsonResponse);

        List<Bill> bills = new ArrayList<>();
        if (root.isArray()) {
            for (JsonNode node : root) {
                Bill bill = mapper.treeToValue(node, Bill.class);
                bills.add(bill);
            }
        } else {
            // Single object
            Bill bill = mapper.readValue(jsonResponse, Bill.class);
            bills.add(bill);
        }

        // Step 4: Print all bills
        System.out.println("========== BILLS FROM SAP SANDBOX ==========");
        System.out.println("Total bills fetched: " + bills.size());
        System.out.println();

        for (int i = 0; i < bills.size(); i++) {
            Bill bill = bills.get(i);
            System.out.println("--- Bill " + (i + 1) + " ---");
            System.out.println("ID              : " + bill.getId());
            System.out.println("Document Number : " + bill.getDocumentNumber());
            System.out.println("Billing Type    : " + bill.getBillingType());
            System.out.println("Currency        : " + bill.getCurrency());
            System.out.println("Bill Status     : " + bill.getBillStatus());
            System.out.println("Due Date        : " + bill.getDueDate());
            System.out.println("Billing Date    : " + bill.getBillingDate());
            System.out.println();
        }

        System.out.println("=============================================");
        System.out.println("POJO mapping from live API works!");
    }
}