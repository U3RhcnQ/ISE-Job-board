package com.example.isejobsboard.security;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class SHA256Test {

    @Test
    void testHash_KnownValue() {
        String expected = "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08"; // test
        assertEquals(expected, SHA256.hash("test"));
    }

    @Test
    void testHash_EmptyString() {
        String expected = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"; // empty string
        assertEquals(expected, SHA256.hash(""));
    }

    @Test
    void testHash_UnicodeString() {
        String expected = "6aa8f49cc992dfd75a114269ed26de0ad6d4e7d7a70d9c8afb3d7a57a88a73ed"; // test in chinese simplified (测试)
        assertEquals(expected, SHA256.hash("测试"));
    }

    @Test
    void testHash_SameInputSameHash() {
        String input = "test";
        String hash1 = SHA256.hash(input);
        String hash2 = SHA256.hash(input);
        assertEquals(hash1, hash2);
    }

    @Test
    void testHash_DifferentInputsDifferentHashes() {
        String input1 = "test1";
        String input2 = "test2";
        assertNotEquals(SHA256.hash(input1), SHA256.hash(input2));
    }

    @Test
    void testHash_NullInputThrowsException() {
        assertThrows(NullPointerException.class, () -> SHA256.hash(null));
    }
}