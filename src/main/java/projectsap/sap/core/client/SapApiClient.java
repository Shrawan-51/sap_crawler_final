package projectsap.sap.core.client;

import org.apache.hc.client5.http.classic.methods.HttpGet;
import org.apache.hc.client5.http.config.RequestConfig;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.CloseableHttpResponse;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.HttpEntity;
import org.apache.hc.core5.http.ParseException;
import org.apache.hc.core5.http.io.entity.EntityUtils;
import org.apache.hc.core5.util.Timeout;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import projectsap.sap.core.db.DatabaseManager;

import java.io.IOException;

/**
 * Apache HttpClient 5 client for fetching bill data from SAP Subscription Billing API.
 * Follows industry-standard connection timeouts, structured SLF4J logging, and externalized config.
 */
public class SapApiClient {

    private static final Logger LOGGER = LoggerFactory.getLogger(SapApiClient.class);

    private static final String DEFAULT_API_KEY = "wITmrAEUGLzlYWC2my5UOKunJinBNwe4";
    private static final String API_KEY = DatabaseManager.getSetting("sap.api.key", "SAP_API_KEY", DEFAULT_API_KEY);
    private static final String API_URL = "https://sandbox.api.sap.com/subscriptionbilling/api/bill/v2/bills?pageNumber=1&pageSize=40&%24count=true";

    private static final int CONNECT_TIMEOUT_SECONDS = 10;
    private static final int RESPONSE_TIMEOUT_SECONDS = 15;

    /**
     * Fetches bills from SAP Sandbox API using Apache HttpClient 5.
     *
     * @return Raw JSON response string from SAP API.
     * @throws IOException    If network or I/O error occurs.
     * @throws ParseException If response body parsing fails.
     */
    public static String fetchBillsFromSAP() throws IOException, ParseException {
        return fetchFromUrl(API_URL);
    }

    /**
     * Universal fetcher: Fetches JSON data from any SAP endpoint using Apache HttpClient 5 with APIKey.
     *
     * @param url SAP API endpoint URL.
     * @return Raw JSON response body.
     * @throws IOException    If network or I/O error occurs.
     * @throws ParseException If response body parsing fails.
     */
    public static String fetchFromUrl(String url) throws IOException, ParseException {
        LOGGER.info("Executing SAP API request to endpoint: {}", url);

        RequestConfig requestConfig = RequestConfig.custom()
                .setConnectTimeout(Timeout.ofSeconds(CONNECT_TIMEOUT_SECONDS))
                .setResponseTimeout(Timeout.ofSeconds(RESPONSE_TIMEOUT_SECONDS))
                .build();

        try (CloseableHttpClient httpClient = HttpClients.custom()
                .setDefaultRequestConfig(requestConfig)
                .build()) {

            HttpGet request = new HttpGet(url);
            request.addHeader("APIKey", API_KEY);
            request.addHeader("Accept", "application/json");

            try (CloseableHttpResponse response = httpClient.execute(request)) {
                int statusCode = response.getCode();
                HttpEntity entity = response.getEntity();
                String responseBody = entity != null ? EntityUtils.toString(entity) : "";

                if (statusCode >= 200 && statusCode < 300) {
                    LOGGER.info("Received HTTP {} success response ({} bytes).", statusCode, responseBody.length());
                    return responseBody;
                } else {
                    LOGGER.error("SAP API returned HTTP error {}: {}", statusCode, responseBody);
                    throw new IOException("SAP API request failed with status code " + statusCode + ": " + responseBody);
                }
            }
        }
    }
}

