/**
 * DUA Traders - Professional Live Visitor Counter Engine
 * Zero external paid dependencies. Designed for GitHub Pages.
 */

(function () {
    'use strict';

    // Retrieve or default configuration
    const config = window.VISITOR_COUNTER_CONFIG || {
        mode: 'auto',
        firebaseConfig: {},
        countApi: {
            baseUrl: 'https://countapi.mileshilliard.com/api/v1',
            namespace: 'dua_traders_pk'
        },
        timezone: 'Asia/Karachi',
        onlineWindowMinutes: 5,
        pollIntervalMs: 20000,
        countUpDurationMs: 1200
    };

    // State
    const state = {
        totalVisitors: 0,
        todayVisitors: 0,
        onlineVisitors: 1,
        totalPageViews: 0,
        provider: 'initializing',
        isLoaded: false,
        lastUpdated: null,
        tabId: 'tab_' + Math.random().toString(36).substring(2, 9),
        visitorId: null,
        isNewVisitor: false,
        isNewToday: false
    };

    // Element references
    const elements = {
        totalVisitors: null,
        todayVisitors: null,
        onlineVisitors: null,
        totalPageViews: null,
        syncStatus: null,
        syncBadge: null,
        lastUpdated: null,
        container: null
    };

    /**
     * Get today's date formatted as YYYY-MM-DD in the specified timezone (PKT)
     */
    function getTodayDateString(timezone = 'Asia/Karachi') {
        try {
            const formatter = new Intl.DateTimeFormat('en-CA', {
                timeZone: timezone,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
            return formatter.format(new Date());
        } catch (e) {
            // Fallback to UTC if timezone is unsupported
            return new Date().toISOString().split('T')[0];
        }
    }

    /**
     * Generate or retrieve privacy-conscious anonymous visitor UUID
     */
    function setupVisitorIdentity() {
        const STORAGE_KEY_UUID = 'dua_traders_visitor_uuid';
        const STORAGE_KEY_DATE = 'dua_traders_visitor_date';

        let visitorId = localStorage.getItem(STORAGE_KEY_UUID);
        if (!visitorId) {
            try {
                visitorId = (crypto && crypto.randomUUID)
                    ? crypto.randomUUID()
                    : 'vid_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
            } catch (e) {
                visitorId = 'vid_' + Date.now() + '_' + Math.floor(Math.random() * 100000);
            }
            localStorage.setItem(STORAGE_KEY_UUID, visitorId);
            state.isNewVisitor = true;
        } else {
            state.isNewVisitor = false;
        }
        state.visitorId = visitorId;

        // Daily visitor check (resets at midnight in PKT timezone)
        const todayDate = getTodayDateString(config.timezone);
        const lastVisitDate = localStorage.getItem(STORAGE_KEY_DATE);
        if (lastVisitDate !== todayDate) {
            localStorage.setItem(STORAGE_KEY_DATE, todayDate);
            state.isNewToday = true;
        } else {
            state.isNewToday = false;
        }
    }

    /**
     * Smooth count-up animation using requestAnimationFrame
     */
    function animateCounter(element, targetValue, duration = 1000) {
        if (!element) return;
        const currentText = element.getAttribute('data-value') || '0';
        const startValue = parseInt(currentText, 10) || 0;
        const diff = targetValue - startValue;

        if (diff === 0 && element.getAttribute('data-value')) {
            element.textContent = targetValue.toLocaleString();
            return;
        }

        element.setAttribute('data-value', targetValue);
        const startTime = performance.now();

        function easeOutQuad(t) {
            return t * (2 - t);
        }

        function update(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeOutQuad(progress);
            const currentValue = Math.floor(startValue + (diff * easedProgress));

            element.textContent = currentValue.toLocaleString();

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                element.textContent = targetValue.toLocaleString();
            }
        }

        requestAnimationFrame(update);
    }

    /**
     * Update UI with current state values
     */
    function updateUI() {
        if (elements.totalVisitors) {
            animateCounter(elements.totalVisitors, state.totalVisitors, config.countUpDurationMs);
        }
        if (elements.todayVisitors) {
            animateCounter(elements.todayVisitors, state.todayVisitors, config.countUpDurationMs);
        }
        if (elements.onlineVisitors) {
            animateCounter(elements.onlineVisitors, Math.max(1, state.onlineVisitors), 600);
        }
        if (elements.totalPageViews) {
            animateCounter(elements.totalPageViews, state.totalPageViews, config.countUpDurationMs);
        }

        if (elements.syncStatus) {
            const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            elements.syncStatus.textContent = state.provider === 'firebase'
                ? `Live Realtime Sync (${timeStr})`
                : `Live Activity Verified (${timeStr})`;
        }

        // Remove skeleton classes if present
        document.querySelectorAll('.stat-skeleton').forEach(el => {
            el.classList.remove('stat-skeleton', 'animate-pulse');
        });

        state.isLoaded = true;
    }

    /**
     * Set UI to loading state
     */
    function setLoadingState() {
        if (elements.syncStatus) {
            elements.syncStatus.textContent = 'Connecting live feed...';
        }
    }

    /**
     * Local Tab Presence & Activity Coordination
     * Uses BroadcastChannel and localStorage heartbeats to coordinate tabs on same device
     */
    function setupLocalPresence() {
        const PRESENCE_STORAGE_KEY = 'dua_traders_tab_sessions';
        const now = Date.now();
        const cutoff = now - (config.onlineWindowMinutes * 60 * 1000);

        function cleanAndCountLocalTabs() {
            try {
                let sessions = JSON.parse(localStorage.getItem(PRESENCE_STORAGE_KEY) || '{}');
                // Clean older than activity window
                let activeCount = 0;
                const updatedSessions = {};
                for (const tab in sessions) {
                    if (sessions[tab] > cutoff) {
                        updatedSessions[tab] = sessions[tab];
                        activeCount++;
                    }
                }
                updatedSessions[state.tabId] = Date.now();
                localStorage.setItem(PRESENCE_STORAGE_KEY, JSON.stringify(updatedSessions));
                return Math.max(1, activeCount);
            } catch (e) {
                return 1;
            }
        }

        state.onlineVisitors = cleanAndCountLocalTabs();

        // BroadcastChannel coordination if supported
        if (window.BroadcastChannel) {
            try {
                const channel = new BroadcastChannel('dua_traders_channel');
                channel.onmessage = (event) => {
                    if (event.data && event.data.type === 'PING') {
                        channel.postMessage({ type: 'PONG', tabId: state.tabId });
                    }
                };
                channel.postMessage({ type: 'PING', tabId: state.tabId });
            } catch (e) { }
        }

        // Heartbeat every 45s while tab is open
        setInterval(() => {
            try {
                let sessions = JSON.parse(localStorage.getItem(PRESENCE_STORAGE_KEY) || '{}');
                sessions[state.tabId] = Date.now();
                localStorage.setItem(PRESENCE_STORAGE_KEY, JSON.stringify(sessions));
            } catch (e) { }
        }, 45000);

        // Remove tab on close / unload
        window.addEventListener('beforeunload', () => {
            try {
                let sessions = JSON.parse(localStorage.getItem(PRESENCE_STORAGE_KEY) || '{}');
                delete sessions[state.tabId];
                localStorage.setItem(PRESENCE_STORAGE_KEY, JSON.stringify(sessions));
            } catch (e) { }
        });
    }

    /**
     * COUNTAPI ENGINE
     * Performs atomic hit and read operations via CountAPI
     */
    const CountApiEngine = {
        async fetchMetric(endpoint, key) {
            const url = `${config.countApi.baseUrl}/${endpoint}/${key}`;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            try {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: { 'Accept': 'application/json' },
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP error ${response.status}`);
                }
                const data = await response.json();
                return typeof data.value === 'number' ? data.value : 0;
            } catch (err) {
                clearTimeout(timeoutId);
                console.warn(`[DUA Visitor Counter] CountAPI request error for ${key}:`, err.message);
                return null;
            }
        },

        async trackAndFetchAll() {
            const ns = config.countApi.namespace;
            const todayStr = getTodayDateString(config.timezone);

            const keyPageviews = `${ns}_pageviews`;
            const keyUniques = `${ns}_uniques`;
            const keyDaily = `${ns}_daily_${todayStr}`;

            // 1. Total Page Views: always increment on page load
            // On subsequent polls, we get instead of hit
            const isInitial = !state.isLoaded;
            const pageViewEndpoint = isInitial ? 'hit' : 'get';

            // 2. Total Unique Visitors: hit only if isNewVisitor, else get
            const uniqueEndpoint = (isInitial && state.isNewVisitor) ? 'hit' : 'get';

            // 3. Today's Unique Visitors: hit only if isNewToday, else get
            const dailyEndpoint = (isInitial && state.isNewToday) ? 'hit' : 'get';

            try {
                const [views, uniques, daily] = await Promise.all([
                    CountApiEngine.fetchMetric(pageViewEndpoint, keyPageviews),
                    CountApiEngine.fetchMetric(uniqueEndpoint, keyUniques),
                    CountApiEngine.fetchMetric(dailyEndpoint, keyDaily)
                ]);

                if (views !== null) state.totalPageViews = Math.max(state.totalPageViews, views);
                if (uniques !== null) state.totalVisitors = Math.max(state.totalVisitors, uniques);
                if (daily !== null) state.todayVisitors = Math.max(state.todayVisitors, daily);

                // For online visitors in CountAPI mode: calculate active sessions
                setupLocalPresence();

                state.provider = 'countapi';
                updateUI();
            } catch (err) {
                console.error('[DUA Visitor Counter] Error updating counters:', err);
                // Even on error, update with any stored/known values
                updateUI();
            }
        },

        startPolling() {
            if (config.pollIntervalMs > 0) {
                setInterval(() => {
                    // Only poll if tab is active and visible
                    if (!document.hidden) {
                        CountApiEngine.trackAndFetchAll();
                    }
                }, config.pollIntervalMs);
            }
        }
    };

    /**
     * FIREBASE ENGINE
     * Connects to Google Firebase Realtime Database with native WebSocket synchronization
     */
    const FirebaseEngine = {
        isAvailable() {
            return config.firebaseConfig &&
                config.firebaseConfig.databaseURL &&
                config.firebaseConfig.databaseURL.length > 5 &&
                config.firebaseConfig.apiKey &&
                config.firebaseConfig.apiKey.length > 5;
        },

        async init() {
            try {
                // Dynamically import Firebase App and Database SDKs (v10 modular)
                const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js');
                const {
                    getDatabase,
                    ref,
                    set,
                    onValue,
                    onDisconnect,
                    runTransaction,
                    serverTimestamp
                } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js');

                const app = initializeApp(config.firebaseConfig);
                const db = getDatabase(app);

                const todayStr = getTodayDateString(config.timezone);

                // Atomic Page View Increment
                const pageViewsRef = ref(db, 'dua_traders_stats/total_page_views');
                runTransaction(pageViewsRef, (current) => (current || 0) + 1);

                // Atomic Unique Visitor Increment
                if (state.isNewVisitor) {
                    const uniqueRef = ref(db, 'dua_traders_stats/total_unique_visitors');
                    runTransaction(uniqueRef, (current) => (current || 0) + 1);
                }

                // Atomic Daily Visitor Increment
                if (state.isNewToday) {
                    const dailyRef = ref(db, `dua_traders_stats/daily_visitors/${todayStr}`);
                    runTransaction(dailyRef, (current) => (current || 0) + 1);
                }

                // Live Presence Management
                const myPresenceRef = ref(db, `dua_traders_presence/${state.tabId}`);
                const connectedRef = ref(db, '.info/connected');

                onValue(connectedRef, (snap) => {
                    if (snap.val() === true) {
                        onDisconnect(myPresenceRef).remove();
                        set(myPresenceRef, {
                            lastSeen: Date.now(),
                            visitorId: state.visitorId
                        });
                    }
                });

                // Heartbeat ping every 45s while active
                setInterval(() => {
                    if (!document.hidden) {
                        set(myPresenceRef, {
                            lastSeen: Date.now(),
                            visitorId: state.visitorId
                        });
                    }
                }, 45000);

                // Real-time listener for Presence (Online Visitors)
                const presenceListRef = ref(db, 'dua_traders_presence');
                onValue(presenceListRef, (snapshot) => {
                    const data = snapshot.val() || {};
                    const cutoff = Date.now() - (config.onlineWindowMinutes * 60 * 1000);
                    const activeSessions = new Set();

                    for (const tabKey in data) {
                        const entry = data[tabKey];
                        if (entry && entry.lastSeen && entry.lastSeen > cutoff) {
                            activeSessions.add(entry.visitorId || tabKey);
                        }
                    }
                    state.onlineVisitors = Math.max(1, activeSessions.size);
                    if (elements.onlineVisitors) {
                        animateCounter(elements.onlineVisitors, state.onlineVisitors, 400);
                    }
                });

                // Real-time listener for Stats
                const statsRef = ref(db, 'dua_traders_stats');
                onValue(statsRef, (snapshot) => {
                    const data = snapshot.val() || {};
                    state.totalPageViews = data.total_page_views || 0;
                    state.totalVisitors = data.total_unique_visitors || 0;
                    state.todayVisitors = (data.daily_visitors && data.daily_visitors[todayStr]) || 0;
                    state.provider = 'firebase';
                    updateUI();
                });

                return true;
            } catch (err) {
                console.warn('[DUA Visitor Counter] Firebase init error, falling back to CountAPI:', err);
                return false;
            }
        }
    };

    /**
     * Bind DOM Elements
     */
    function bindElements() {
        elements.totalVisitors = document.getElementById('stat-total-visitors');
        elements.todayVisitors = document.getElementById('stat-today-visitors');
        elements.onlineVisitors = document.getElementById('stat-online-visitors');
        elements.totalPageViews = document.getElementById('stat-total-pageviews');
        elements.syncStatus = document.getElementById('visitor-sync-status');
        elements.syncBadge = document.getElementById('visitor-sync-badge');
        elements.container = document.getElementById('dua-visitor-stats-section');
    }

    /**
     * Main Initialization
     */
    async function init() {
        bindElements();
        if (!elements.totalVisitors) {
            // If DOM element not ready yet, wait and retry
            return;
        }

        setLoadingState();
        setupVisitorIdentity();
        setupLocalPresence();

        // Check if Firebase is configured
        let useFirebase = false;
        if (config.mode === 'firebase' || (config.mode === 'auto' && FirebaseEngine.isAvailable())) {
            useFirebase = await FirebaseEngine.init();
        }

        // If Firebase is not used or failed to init, run CountAPI engine
        if (!useFirebase) {
            state.provider = 'countapi';
            await CountApiEngine.trackAndFetchAll();
            CountApiEngine.startPolling();
        }
    }

    // Expose global controller for testing or manual refresh
    window.DUAVisitorCounter = {
        getState: () => ({ ...state }),
        refresh: () => {
            if (state.provider === 'countapi') {
                return CountApiEngine.trackAndFetchAll();
            }
        },
        init: init
    };

    // Auto-boot when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
