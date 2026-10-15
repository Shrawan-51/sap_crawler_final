package projectsap.sap.common;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import projectsap.sap.bill.model.Bill;

import static org.junit.jupiter.api.Assertions.*;

class SapServiceRegistryTest {

    @Test
    @DisplayName("Should contain default services: bills and subscriptions")
    void testDefaultServicesRegistered() {
        var services = SapServiceRegistry.getAvailableServices();
        assertNotNull(services);
        assertTrue(services.contains("bills"));
        assertTrue(services.contains("subscriptions"));
    }

    @Test
    @DisplayName("Should look up descriptor case-insensitively")
    void testCaseInsensitiveLookup() {
        var lower = SapServiceRegistry.getDescriptor("bills");
        var upper = SapServiceRegistry.getDescriptor("BILLS");
        var mixed = SapServiceRegistry.getDescriptor("BiLLs");

        assertNotNull(lower);
        assertSame(lower, upper);
        assertSame(lower, mixed);
        assertEquals(Bill.class, lower.getPojoClass());
        assertNotNull(lower.getDefaultEndpoint());
    }

    @Test
    @DisplayName("Should return null safely for unknown or null service ID")
    void testUnknownServiceReturnsNull() {
        assertNull(SapServiceRegistry.getDescriptor("unknown_service_xyz"));
        assertNull(SapServiceRegistry.getDescriptor(null));
    }

    @Test
    @DisplayName("Should dynamically register a service with valid POJO class")
    void testRegisterDynamicValidClass() {
        boolean success = SapServiceRegistry.registerDynamic(
                "custom_test_service",
                "Custom Test Service",
                "https://api.test/service",
                "projectsap.sap.bill.model.Bill",
                "A dynamic test service"
        );

        assertTrue(success);
        var desc = SapServiceRegistry.getDescriptor("custom_test_service");
        assertNotNull(desc);
        assertEquals("Custom Test Service", desc.getDisplayName());
        assertEquals(Bill.class, desc.getPojoClass());
    }

    @Test
    @DisplayName("Should return false when registering dynamic service with non-existent class")
    void testRegisterDynamicInvalidClassReturnsFalse() {
        boolean success = SapServiceRegistry.registerDynamic(
                "invalid_service",
                "Invalid Service",
                "https://api.test/service",
                "projectsap.sap.nonexistent.NoSuchClass",
                "Will fail class loading"
        );

        assertFalse(success);
        assertNull(SapServiceRegistry.getDescriptor("invalid_service"));
    }
}
