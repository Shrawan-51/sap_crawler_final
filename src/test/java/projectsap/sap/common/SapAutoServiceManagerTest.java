package projectsap.sap.common;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class SapAutoServiceManagerTest {

    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    @DisplayName("Should infer valid OpenAPI 3.0 specification from JSON item")
    void testInferOpenApiSpecFromObject() throws Exception {
        String sampleJson = """
            {
                "id": "PROD-100",
                "name": "Cloud Subscription",
                "active": true,
                "units": 10,
                "price": 49.99,
                "details": {
                    "tier": "PREMIUM",
                    "code": 101
                }
            }
            """;

        JsonNode data = mapper.readTree(sampleJson);
        String specJson = SapAutoServiceManager.inferOpenApiSpec("product", data);

        assertNotNull(specJson);
        JsonNode spec = mapper.readTree(specJson);

        assertEquals("3.0.0", spec.get("openapi").asText());
        assertEquals("SAP Product Service API", spec.get("info").get("title").asText());

        JsonNode schemas = spec.get("components").get("schemas");
        assertNotNull(schemas);
        assertTrue(schemas.has("Product"));

        JsonNode props = schemas.get("Product").get("properties");
        assertEquals("string", props.get("id").get("type").asText());
        assertEquals("string", props.get("name").get("type").asText());
        assertEquals("boolean", props.get("active").get("type").asText());
        assertEquals("integer", props.get("units").get("type").asText());
        assertEquals("number", props.get("price").get("type").asText());
        assertTrue(props.has("details"));
    }

    @Test
    @DisplayName("Should infer specification correctly when input is wrapped in standard array")
    void testInferOpenApiSpecFromArray() throws Exception {
        String wrappedJson = """
            {
                "items": [
                    {
                        "usageId": "USG-1",
                        "meterCount": 500
                    }
                ]
            }
            """;

        JsonNode data = mapper.readTree(wrappedJson);
        String specJson = SapAutoServiceManager.inferOpenApiSpec("usage", data);

        assertNotNull(specJson);
        JsonNode spec = mapper.readTree(specJson);
        JsonNode schemas = spec.get("components").get("schemas");
        assertTrue(schemas.has("Usage"));
    }
}
