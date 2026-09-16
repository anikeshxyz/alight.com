package com.alight.marketplace.common.filter;

import jakarta.servlet.ServletException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.io.IOException;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;

class MdcCorrelationFilterTest {

    private final MdcCorrelationFilter filter = new MdcCorrelationFilter();

    @Test
    @DisplayName("Should preserve incoming X-Request-ID header in response and MDC")
    void testIncomingCorrelationIdPreserved() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(MdcCorrelationFilter.CORRELATION_ID_HEADER, "client-req-999");
        MockHttpServletResponse response = new MockHttpServletResponse();

        AtomicReference<String> mdcValueDuringFilter = new AtomicReference<>();

        MockFilterChain chain = new MockFilterChain() {
            @Override
            public void doFilter(jakarta.servlet.ServletRequest req, jakarta.servlet.ServletResponse res) {
                mdcValueDuringFilter.set(MDC.get(MdcCorrelationFilter.CORRELATION_ID_KEY));
            }
        };

        filter.doFilter(request, response, chain);

        assertEquals("client-req-999", response.getHeader(MdcCorrelationFilter.CORRELATION_ID_HEADER));
        assertEquals("client-req-999", mdcValueDuringFilter.get());
        // Verify MDC cleaned up after filter execution
        assertNull(MDC.get(MdcCorrelationFilter.CORRELATION_ID_KEY));
    }

    @Test
    @DisplayName("Should generate new correlation ID if X-Request-ID is absent")
    void testGeneratedCorrelationId() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        AtomicReference<String> mdcValueDuringFilter = new AtomicReference<>();

        MockFilterChain chain = new MockFilterChain() {
            @Override
            public void doFilter(jakarta.servlet.ServletRequest req, jakarta.servlet.ServletResponse res) {
                mdcValueDuringFilter.set(MDC.get(MdcCorrelationFilter.CORRELATION_ID_KEY));
            }
        };

        filter.doFilter(request, response, chain);

        String generatedId = response.getHeader(MdcCorrelationFilter.CORRELATION_ID_HEADER);
        assertNotNull(generatedId);
        assertFalse(generatedId.isBlank());
        assertEquals(generatedId, mdcValueDuringFilter.get());
        assertNull(MDC.get(MdcCorrelationFilter.CORRELATION_ID_KEY));
    }
}
