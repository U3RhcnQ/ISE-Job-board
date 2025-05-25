package com.example.isejobsboard.security;

import java.security.SecureRandom;
import java.util.Base64;

public class Authenticator {
    public void createToken() {
        String token = _buildToken();

        
    }

    public void destroyToken(String token) {

    }

    public boolean isTokenValid(String token) {

    }

    /**
     * Builds a cryptographically random token which can be used for user authentication.
     */
    private String _buildToken() {
        SecureRandom random = new SecureRandom();
        Base64.Encoder encoder = Base64.getUrlEncoder().withoutPadding();

        byte[] tokenBytes = new byte[256];

        // Filling array with cryptographically random bytes
        random.nextBytes(tokenBytes);

        String encodedTokenBytes = encoder.encodeToString(tokenBytes);

        return encodedTokenBytes;
    }
}
