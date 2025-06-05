package com.example.isejobsboard.security;

import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;

import java.sql.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class AuthenticatorTest {

    @Test
    void testCreateToken_success() throws Exception {
        Connection mockConnection = mock(Connection.class);
        PreparedStatement mockStatement = mock(PreparedStatement.class);
        when(mockConnection.prepareStatement(anyString())).thenReturn(mockStatement);

        try (MockedStatic<DriverManager> dm = mockStatic(DriverManager.class)) {
            dm.when(() -> DriverManager.getConnection(any(), any(), any()))
                    .thenReturn(mockConnection);

            String token = Authenticator.createToken(1);

            assertNotNull(token);
            verify(mockStatement).setInt(eq(1), eq(1));
            verify(mockStatement).setString(eq(2), eq(token));
            verify(mockStatement).setTimestamp(eq(3), any(Timestamp.class));
            verify(mockStatement).executeUpdate();
        }
    }

    @Test
    void testCreateToken_error() {
        SQLException ex = new SQLException("DB error");
        try (MockedStatic<DriverManager> dm = mockStatic(DriverManager.class)) {
            dm.when(() -> DriverManager.getConnection(any(), any(), any()))
                    .thenThrow(ex);

            RuntimeException thrown = assertThrows(
                    RuntimeException.class,
                    () -> Authenticator.createToken(1)
            );
            assertTrue(thrown.getCause() instanceof SQLException);
        }
    }

    @Test
    void testDestroyToken_success() throws Exception {
        Connection mockConnection = mock(Connection.class);
        PreparedStatement mockStatement = mock(PreparedStatement.class);
        when(mockConnection.prepareStatement(anyString())).thenReturn(mockStatement);

        try (MockedStatic<DriverManager> dm = mockStatic(DriverManager.class)) {
            dm.when(() -> DriverManager.getConnection(any(), any(), any()))
                    .thenReturn(mockConnection);

            Authenticator.destroyToken("token123");

            verify(mockStatement).setString(1, "token123");
            verify(mockStatement).executeUpdate();
        }
    }

    @Test
    void testDestroyToken_error() {
        SQLException ex = new SQLException("DB error");
        try (MockedStatic<DriverManager> dm = mockStatic(DriverManager.class)) {
            dm.when(() -> DriverManager.getConnection(any(), any(), any()))
                    .thenThrow(ex);

            SQLException thrown = assertThrows(
                    SQLException.class,
                    () -> Authenticator.destroyToken("token123")
            );
            assertEquals("DB error", thrown.getMessage());
        }
    }

    @Test
    void testIsTokenValidReturnsTrue_success() throws Exception {
        Connection mockConnection = mock(Connection.class);
        PreparedStatement mockStatement = mock(PreparedStatement.class);
        ResultSet mockResultSet = mock(ResultSet.class);

        when(mockConnection.prepareStatement(anyString())).thenReturn(mockStatement);
        when(mockStatement.executeQuery()).thenReturn(mockResultSet);
        when(mockResultSet.next()).thenReturn(true, false);
        when(mockResultSet.getTimestamp("expiry")).thenReturn(new Timestamp(System.currentTimeMillis() + 10000));
        when(mockResultSet.getString("token")).thenReturn("tokenABC");

        try (MockedStatic<DriverManager> dm = mockStatic(DriverManager.class)) {
            dm.when(() -> DriverManager.getConnection(any(), any(), any()))
                    .thenReturn(mockConnection);

            assertTrue(Authenticator.isTokenValid("tokenABC"));
        }
    }

    @Test
    void testIsTokenValidReturnsFalseIfTokenIsExpired() throws Exception {
        Connection mockConnection = mock(Connection.class);
        PreparedStatement mockStatement = mock(PreparedStatement.class);
        ResultSet mockResultSet = mock(ResultSet.class);

        when(mockConnection.prepareStatement(anyString())).thenReturn(mockStatement);
        when(mockStatement.executeQuery()).thenReturn(mockResultSet);
        when(mockResultSet.next()).thenReturn(true, false);
        when(mockResultSet.getTimestamp("expiry")).thenReturn(new Timestamp(System.currentTimeMillis() - 10000));
        when(mockResultSet.getString("token")).thenReturn("tokenDEF");

        try (
                MockedStatic<DriverManager> dm = mockStatic(DriverManager.class);
                MockedStatic<Authenticator> authMock = mockStatic(Authenticator.class)
        ) {
            dm.when(() -> DriverManager.getConnection(any(), any(), any()))
                    .thenReturn(mockConnection);
            authMock.when(() -> Authenticator.destroyToken(anyString())).thenAnswer(invocation -> null);

            assertFalse(Authenticator.isTokenValid("tokenDEF"));
        }
    }

    @Test
    void testIsTokenValidReturnsFalseIfTokenNotFound() throws Exception {
        Connection mockConnection = mock(Connection.class);
        PreparedStatement mockStatement = mock(PreparedStatement.class);
        ResultSet mockResultSet = mock(ResultSet.class);

        when(mockConnection.prepareStatement(anyString())).thenReturn(mockStatement);
        when(mockStatement.executeQuery()).thenReturn(mockResultSet);
        when(mockResultSet.next()).thenReturn(false);

        try (MockedStatic<DriverManager> dm = mockStatic(DriverManager.class)) {
            dm.when(() -> DriverManager.getConnection(any(), any(), any()))
                    .thenReturn(mockConnection);

            assertFalse(Authenticator.isTokenValid("tokenGHI"));
        }
    }

    @Test
    void testGetUserIdFromTokenReturnsUserId() throws Exception {
        Connection mockConnection = mock(Connection.class);
        PreparedStatement mockStatement = mock(PreparedStatement.class);
        ResultSet mockResultSet = mock(ResultSet.class);

        when(mockConnection.prepareStatement(anyString())).thenReturn(mockStatement);
        when(mockStatement.executeQuery()).thenReturn(mockResultSet);
        when(mockResultSet.next()).thenReturn(true);
        when(mockResultSet.getInt("user_id")).thenReturn(42);

        try (MockedStatic<DriverManager> dm = mockStatic(DriverManager.class)) {
            dm.when(() -> DriverManager.getConnection(any(), any(), any()))
                    .thenReturn(mockConnection);

            assertEquals(42, Authenticator.getUserIdFromToken("tokenXYZ"));
        }
    }

    @Test
    void testGetUserIdFromTokenReturnsMinusOneIfNotFound() throws Exception {
        Connection mockConnection = mock(Connection.class);
        PreparedStatement mockStatement = mock(PreparedStatement.class);
        ResultSet mockResultSet = mock(ResultSet.class);

        when(mockConnection.prepareStatement(anyString())).thenReturn(mockStatement);
        when(mockStatement.executeQuery()).thenReturn(mockResultSet);
        when(mockResultSet.next()).thenReturn(false);

        try (MockedStatic<DriverManager> dm = mockStatic(DriverManager.class)) {
            dm.when(() -> DriverManager.getConnection(any(), any(), any()))
                    .thenReturn(mockConnection);

            assertEquals(-1, Authenticator.getUserIdFromToken("tokenXYZ"));
        }
    }

    @Test
    void testGetAccessLevelReturnsAdmin() throws Exception {
        Connection mockConnection = mock(Connection.class);
        PreparedStatement mockStatement = mock(PreparedStatement.class);
        ResultSet mockResultSet = mock(ResultSet.class);

        when(mockConnection.prepareStatement(anyString())).thenReturn(mockStatement);
        when(mockStatement.executeQuery()).thenReturn(mockResultSet);
        when(mockResultSet.next()).thenReturn(true);
        when(mockResultSet.getString("table_name")).thenReturn("admins");

        try (MockedStatic<DriverManager> dm = mockStatic(DriverManager.class)) {
            dm.when(() -> DriverManager.getConnection(any(), any(), any()))
                    .thenReturn(mockConnection);

            assertEquals("admin", Authenticator.getAccessLevel(10));
        }
    }

    @Test
    void testGetAccessLevelReturnsStudent() throws Exception {
        Connection mockConnection = mock(Connection.class);
        PreparedStatement mockStatement = mock(PreparedStatement.class);
        ResultSet mockResultSet = mock(ResultSet.class);

        when(mockConnection.prepareStatement(anyString())).thenReturn(mockStatement);
        when(mockStatement.executeQuery()).thenReturn(mockResultSet);
        when(mockResultSet.next()).thenReturn(true);
        when(mockResultSet.getString("table_name")).thenReturn("students");

        try (MockedStatic<DriverManager> dm = mockStatic(DriverManager.class)) {
            dm.when(() -> DriverManager.getConnection(any(), any(), any()))
                    .thenReturn(mockConnection);

            assertEquals("student", Authenticator.getAccessLevel(20));
        }
    }

    @Test
    void testGetAccessLevelReturnsRep() throws Exception {
        Connection mockConnection = mock(Connection.class);
        PreparedStatement mockStatement = mock(PreparedStatement.class);
        ResultSet mockResultSet = mock(ResultSet.class);

        when(mockConnection.prepareStatement(anyString())).thenReturn(mockStatement);
        when(mockStatement.executeQuery()).thenReturn(mockResultSet);
        when(mockResultSet.next()).thenReturn(true);
        when(mockResultSet.getString("table_name")).thenReturn("rep");

        try (MockedStatic<DriverManager> dm = mockStatic(DriverManager.class)) {
            dm.when(() -> DriverManager.getConnection(any(), any(), any()))
                    .thenReturn(mockConnection);

            assertEquals("rep", Authenticator.getAccessLevel(30));
        }
    }

    @Test
    void testGetAccessLevelThrowsSQLExceptionIfNotFound() throws Exception {
        Connection mockConnection = mock(Connection.class);
        PreparedStatement mockStatement = mock(PreparedStatement.class);
        ResultSet mockResultSet = mock(ResultSet.class);

        when(mockConnection.prepareStatement(anyString())).thenReturn(mockStatement);
        when(mockStatement.executeQuery()).thenReturn(mockResultSet);
        when(mockResultSet.next()).thenReturn(false);

        try (MockedStatic<DriverManager> dm = mockStatic(DriverManager.class)) {
            dm.when(() -> DriverManager.getConnection(any(), any(), any()))
                    .thenReturn(mockConnection);

            assertThrows(SQLException.class, () -> Authenticator.getAccessLevel(123));
        }
    }
}