package projectsap.sap.core.server;

import com.sun.net.httpserver.Headers;
import com.sun.net.httpserver.HttpExchange;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.IOException;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BillServerTest {

    @Mock
    private HttpExchange exchange;

    @Test
    @DisplayName("Should parse query string with multiple and encoded parameters")
    void testParseQuery() {
        Map<String, String> params = BillServer.parseQuery("service=bills&status=OPEN&search=hello%20world");
        assertEquals(3, params.size());
        assertEquals("bills", params.get("service"));
        assertEquals("OPEN", params.get("status"));
        assertEquals("hello world", params.get("search"));

        assertTrue(BillServer.parseQuery(null).isEmpty());
        assertTrue(BillServer.parseQuery("").isEmpty());
    }

    @Test
    @DisplayName("Should identify proper MIME types by extension")
    void testGetContentType() {
        assertEquals("text/html; charset=UTF-8", BillServer.getContentType("index.html"));
        assertEquals("text/css; charset=UTF-8", BillServer.getContentType("styles.css"));
        assertEquals("application/javascript; charset=UTF-8", BillServer.getContentType("app.js"));
        assertEquals("application/json; charset=UTF-8", BillServer.getContentType("data.json"));
        assertEquals("image/png", BillServer.getContentType("logo.png"));
        assertEquals("application/octet-stream", BillServer.getContentType("archive.unknown"));
    }

    @Test
    @DisplayName("Should add CORS headers to HttpExchange via Mockito")
    void testAddCorsHeaders() {
        Headers headers = new Headers();
        when(exchange.getResponseHeaders()).thenReturn(headers);

        BillServer.addCorsHeaders(exchange);

        assertEquals("*", headers.getFirst("Access-Control-Allow-Origin"));
        assertTrue(headers.getFirst("Access-Control-Allow-Methods").contains("GET"));
        assertEquals("Content-Type", headers.getFirst("Access-Control-Allow-Headers"));
    }

    @Test
    @DisplayName("Should handle OPTIONS preflight request with HTTP 204")
    void testHandlePreflightOptions() throws IOException {
        when(exchange.getRequestMethod()).thenReturn("OPTIONS");

        boolean handled = BillServer.handlePreflight(exchange);

        assertTrue(handled);
        verify(exchange, times(1)).sendResponseHeaders(204, -1);
    }

    @Test
    @DisplayName("Should pass non-OPTIONS request through handlePreflight")
    void testHandlePreflightGet() throws IOException {
        when(exchange.getRequestMethod()).thenReturn("GET");

        boolean handled = BillServer.handlePreflight(exchange);

        assertFalse(handled);
        verify(exchange, never()).sendResponseHeaders(anyInt(), anyLong());
    }
}
