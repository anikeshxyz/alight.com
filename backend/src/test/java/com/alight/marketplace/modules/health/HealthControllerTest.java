package com.alight.marketplace.modules.health;

import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.modules.health.controller.HealthController;
import com.alight.marketplace.modules.health.dto.HealthData;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.SQLException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class HealthControllerTest {

    @Mock
    private DataSource dataSource;

    @Mock
    private Connection connection;

    @Mock
    private DatabaseMetaData metaData;

    @InjectMocks
    private HealthController healthController;

    @Test
    @DisplayName("Should return HTTP 200 and UP status when database is reachable")
    void testGetHealthHealthyDatabase() throws SQLException {
        when(dataSource.getConnection()).thenReturn(connection);
        when(connection.getMetaData()).thenReturn(metaData);
        when(metaData.getDatabaseProductName()).thenReturn("PostgreSQL");
        when(metaData.getDatabaseProductVersion()).thenReturn("18.0");

        ResponseEntity<ApiResponse<HealthData>> response = healthController.getHealth();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());

        HealthData data = response.getBody().getData();
        assertEquals("UP", data.getStatus());
        assertEquals("PostgreSQL", data.getDatabase().getDatabaseProductName());
        assertNotNull(data.getMemory());
        assertTrue(data.getMemory().getMaxMb() > 0);
        assertTrue(data.getUptimeSeconds() >= 0);
    }

    @Test
    @DisplayName("Should return HTTP 503 and DOWN status when database is unreachable")
    void testGetHealthUnhealthyDatabase() throws SQLException {
        when(dataSource.getConnection()).thenThrow(new SQLException("Connection refused"));

        ResponseEntity<ApiResponse<HealthData>> response = healthController.getHealth();

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().isSuccess());

        HealthData data = response.getBody().getData();
        assertEquals("DOWN", data.getStatus());
    }
}
