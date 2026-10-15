package projectsap.sap.common;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import projectsap.sap.bill.model.Bill;
import projectsap.sap.subscription.model.Subscription;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class GenericSapParserTest {

    private ObjectMapper mapper;

    @BeforeEach
    void setUp() {
        mapper = new ObjectMapper();
    }

    @Test
    @DisplayName("Should extract array from root array node")
    void testExtractArrayNodeFromRootArray() throws Exception {
        String json = "[{\"id\":\"item1\"},{\"id\":\"item2\"}]";
        JsonNode root = mapper.readTree(json);
        JsonNode result = GenericSapParser.extractArrayNode(root);

        assertNotNull(result);
        assertTrue(result.isArray());
        assertEquals(2, result.size());
    }

    @Test
    @DisplayName("Should unwrap standard SAP wrapper keys: bills, subscriptions, value, items")
    void testExtractArrayNodeFromStandardWrappers() throws Exception {
        String[] wrappers = {"bills", "subscriptions", "value", "items", "data", "results", "content"};
        for (String wrapper : wrappers) {
            String json = String.format("{\"%s\": [{\"id\":\"item1\"}]}", wrapper);
            JsonNode root = mapper.readTree(json);
            JsonNode result = GenericSapParser.extractArrayNode(root);

            assertNotNull(result, "Failed for wrapper: " + wrapper);
            assertTrue(result.isArray(), "Result is not array for: " + wrapper);
            assertEquals(1, result.size());
            assertEquals("item1", result.get(0).get("id").asText());
        }
    }

    @Test
    @DisplayName("Should unwrap SAP OData wrapper d.results")
    void testExtractArrayNodeFromODataWrapper() throws Exception {
        String json = "{\"d\": {\"results\": [{\"id\":\"odata1\"},{\"id\":\"odata2\"}]}}";
        JsonNode root = mapper.readTree(json);
        JsonNode result = GenericSapParser.extractArrayNode(root);

        assertNotNull(result);
        assertTrue(result.isArray());
        assertEquals(2, result.size());
        assertEquals("odata1", result.get(0).get("id").asText());
    }

    @Test
    @DisplayName("Should return null for non-array / empty payloads")
    void testExtractArrayNodeNullAndEmpty() throws Exception {
        assertNull(GenericSapParser.extractArrayNode(null));

        JsonNode emptyObj = mapper.readTree("{\"unknown\": 123}");
        assertNull(GenericSapParser.extractArrayNode(emptyObj));
    }

    @Test
    @DisplayName("Should parse wrapped JSON into List of Bill POJOs")
    void testParseListBillsSuccess() throws Exception {
        String json = """
            {
                "bills": [
                    {
                        "id": "BILL-001",
                        "documentNumber": 5001,
                        "billStatus": "OPEN",
                        "currency": "EUR"
                    }
                ]
            }
            """;

        List<Bill> bills = GenericSapParser.parseList(json, Bill.class);
        assertNotNull(bills);
        assertEquals(1, bills.size());
        assertEquals("BILL-001", bills.get(0).getId());
        assertEquals(5001L, bills.get(0).getDocumentNumber());
        assertEquals("EUR", bills.get(0).getCurrency());
    }

    @Test
    @DisplayName("Should parse wrapped JSON into List of Subscription POJOs")
    void testParseListSubscriptionsSuccess() throws Exception {
        String json = """
            {
                "subscriptions": [
                    {
                        "subscriptionId": "SUB-999",
                        "subscriptionDocumentId": "DOC-999",
                        "status": "ACTIVE"
                    }
                ]
            }
            """;

        List<Subscription> subs = GenericSapParser.parseList(json, Subscription.class);
        assertNotNull(subs);
        assertEquals(1, subs.size());
        assertEquals("SUB-999", subs.get(0).getSubscriptionId());
        assertEquals("DOC-999", subs.get(0).getSubscriptionDocumentId());
        assertEquals("ACTIVE", subs.get(0).getStatus());
    }

    @Test
    @DisplayName("Should throw Exception when given invalid JSON")
    void testParseListInvalidJsonThrowsException() {
        String invalidJson = "{ malformed json ::: ";
        assertThrows(Exception.class, () -> GenericSapParser.parseList(invalidJson, Bill.class));
    }
}
