package projectsap.sap.core.client;

import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;

import static org.junit.jupiter.api.Assertions.*;

class SapApiClientTest {

    private HttpServer mockServer;
    private String mockServerUrl;

    @BeforeEach
    void setUp() throws IOException {
        mockServer = HttpServer.create(new InetSocketAddress(0), 0);
        mockServer.start();
        int port = mockServer.getAddress().getPort();
        mockServerUrl = "http://localhost:" + port;
    }

    @AfterEach
    void tearDown() {
        if (mockServer != null) {
            mockServer.stop(0);
        }
    }

    @Test
    @DisplayName("Should successfully fetch payload when server responds HTTP 200")
    void testFetchFromUrlSuccess() throws Exception {
        String expectedBody = "{\"status\":\"OK\",\"count\":5}";

        mockServer.createContext("/test/success", exchange -> {
            byte[] bytes = expectedBody.getBytes();
            exchange.sendResponseHeaders(200, bytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(bytes);
            }
        });

        String response = SapApiClient.fetchFromUrl(mockServerUrl + "/test/success");
        assertEquals(expectedBody, response);
    }

    @Test
    @DisplayName("Should throw IOException when server returns HTTP 401 Unauthorized")
    void testFetchFromUrlUnauthorizedThrowsException() {
        mockServer.createContext("/test/unauthorized", exchange -> {
            String error = "{\"error\":\"Unauthorized APIKey\"}";
            exchange.sendResponseHeaders(401, error.length());
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(error.getBytes());
            }
        });

        IOException ex = assertThrows(IOException.class, () ->
                SapApiClient.fetchFromUrl(mockServerUrl + "/test/unauthorized")
        );
        assertTrue(ex.getMessage().contains("401"), "Exception should note HTTP 401");
    }

    @Test
    @DisplayName("Should throw IOException when server returns HTTP 500 Server Error")
    void testFetchFromUrlServerErrorThrowsException() {
        mockServer.createContext("/test/error", exchange -> {
            String error = "{\"error\":\"Internal Server Error\"}";
            exchange.sendResponseHeaders(500, error.length());
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(error.getBytes());
            }
        });

        IOException ex = assertThrows(IOException.class, () ->
                SapApiClient.fetchFromUrl(mockServerUrl + "/test/error")
        );
        assertTrue(ex.getMessage().contains("500"), "Exception should note HTTP 500");
    }

    @Test
    @DisplayName("Should throw IOException on connection refused / invalid address")
    void testFetchFromUrlConnectionRefused() {
        assertThrows(IOException.class, () ->
                SapApiClient.fetchFromUrl("http://127.0.0.1:59999/nonexistent")
        );
    }
}
