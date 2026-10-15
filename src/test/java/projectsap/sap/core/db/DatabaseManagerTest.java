package projectsap.sap.core.db;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.sql.Connection;

import static org.junit.jupiter.api.Assertions.*;

class DatabaseManagerTest {

    @Test
    @DisplayName("Should convert camelCase strings to snake_case correctly")
    void testToSnakeCase() {
        assertEquals("document_number", DatabaseManager.toSnakeCase("documentNumber"));
        assertEquals("net_amount", DatabaseManager.toSnakeCase("netAmount"));
        assertEquals("id", DatabaseManager.toSnakeCase("id"));
        assertEquals("already_snake_case", DatabaseManager.toSnakeCase("already_snake_case"));
        assertEquals("", DatabaseManager.toSnakeCase(null));
        assertEquals("", DatabaseManager.toSnakeCase(""));
    }

    @Test
    @DisplayName("Should convert snake_case strings to camelCase correctly")
    void testToCamelCase() {
        assertEquals("documentNumber", DatabaseManager.toCamelCase("document_number"));
        assertEquals("netAmount", DatabaseManager.toCamelCase("net_amount"));
        assertEquals("id", DatabaseManager.toCamelCase("id"));
        assertEquals("", DatabaseManager.toCamelCase(null));
        assertEquals("", DatabaseManager.toCamelCase(""));
    }

    @Test
    @DisplayName("Should connect to PostgreSQL or fall back to H2 cleanly")
    void testConnectionSuccess() {
        boolean connected = DatabaseManager.testConnection();
        assertTrue(connected, "Database connection must succeed (either PostgreSQL or embedded H2 fallback)");
        assertNotNull(DatabaseManager.getDbEngineName());
    }

    @Test
    @DisplayName("Should initialize database tables without error")
    void testInitDatabase() {
        assertDoesNotThrow(() -> {
            if (DatabaseManager.testConnection()) {
                DatabaseManager.initDatabase();
            }
        });
    }

    @Test
    @DisplayName("Should dynamically create service table and upsert sample records")
    void testDynamicServicePersistence() throws Exception {
        if (!DatabaseManager.testConnection()) return;

        String testJson = """
            {
                "items": [
                    {
                        "id": "UNIT-TEST-001",
                        "status": "COMPLETED",
                        "code": "TST-99",
                        "amount": 42.50
                    }
                ]
            }
            """;

        int saved = DatabaseManager.saveServiceData("test_service", testJson);
        assertTrue(saved >= 1, "Should save at least 1 record");

        String retrievedJson = DatabaseManager.getServiceData("test_service");
        assertNotNull(retrievedJson);
        assertTrue(retrievedJson.contains("UNIT-TEST-001"));

        long count = DatabaseManager.getServiceCount("test_service");
        assertTrue(count >= 1);
    }
}
