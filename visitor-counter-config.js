/**
 * DUA Traders - Visitor Counter Configuration
 * Compatible with GitHub Pages (Static Hosting)
 *
 * This configuration supports two operating modes:
 * 1. "auto" / "firebase": Uses Google Firebase Realtime Database (100% free Spark plan)
 *    to provide full real-time WebSocket synchronization across all devices,
 *    including live concurrent active visitor presence and disconnect tracking.
 * 2. "countapi": Uses the free public CountAPI service (no keys or setup required)
 *    to immediately track Total Page Views, Total Unique Visitors, and Today's Unique Visitors.
 *
 * When Firebase credentials are provided below, the tracker automatically uses
 * Firebase Realtime Database for all 4 metrics. If empty, it smoothly operates in
 * CountAPI mode with zero configuration needed.
 */

window.VISITOR_COUNTER_CONFIG = {
    // Mode: 'auto' | 'firebase' | 'countapi'
    // 'auto' will automatically use Firebase if databaseURL is provided, or CountAPI if not.
    mode: 'auto',

    // Google Firebase Realtime Database Configuration (Free Spark Tier)
    // To enable Firebase multi-device live presence:
    // 1. Visit https://console.firebase.google.com/ and create a free project.
    // 2. Click "Build" -> "Realtime Database" -> "Create Database".
    // 3. Register a Web App and paste the firebaseConfig object below.
    // (Firebase client configs are public identifiers intended for frontend JavaScript).
    firebaseConfig: {
        apiKey: "",
        authDomain: "",
        databaseURL: "",
        projectId: "",
        storageBucket: "",
        messagingSenderId: "",
        appId: ""
    },

    // CountAPI Configuration (Zero setup required)
    countApi: {
        baseUrl: 'https://countapi.mileshilliard.com/api/v1',
        namespace: 'dua_traders_pk'
    },

    // Timezone for daily visitor reset (DUA Traders official timezone)
    // Resets automatically at 00:00:00 PKT (Asia/Karachi, UTC+5)
    timezone: 'Asia/Karachi',

    // Activity window for online visitor calculation (in minutes)
    onlineWindowMinutes: 5,

    // Polling interval for live automatic updates when in CountAPI mode (in milliseconds)
    pollIntervalMs: 20000,

    // Smooth count-up animation duration (in milliseconds)
    countUpDurationMs: 1200
};
