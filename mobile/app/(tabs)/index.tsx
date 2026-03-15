// app/(tabs)/index.tsx  ✅ FULL UPDATED (UI SAME + LOGIC OPTIMIZED + TOKEN DEBUG ADDED + STABLE USER ID + IN-APP DANGER POPUP)
// ✅ ADDED NOW:
// 5) ✅ Stable civilian user_id per device using Expo push token (no random civ_ on reload)
// 6) ✅ Foreground animated in-app danger popup on notification receive (⚠️ + buttons)

import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  Linking,
  StatusBar,
  Platform,
  Animated,
  Easing,
  AppState,
} from "react-native";
import axios from "axios";
import { Accelerometer } from "expo-sensors";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { router } from "expo-router";

// ✅ Set your backend IP (same)
const API = "http://10.121.183.124:4000";

/**
 * ✅ Foreground notification popup (safe)
 */
try {
  Notifications.setNotificationHandler({
    handleNotification: async () =>
      ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      } as Notifications.NotificationBehavior),
  });
} catch {}

// --------------------- Helpers ---------------------
function callNumber(phone: string) {
  Linking.openURL(`tel:${phone}`);
}

function openMaps(lat: number, lng: number) {
  const url =
    Platform.OS === "ios"
      ? `http://maps.apple.com/?ll=${lat},${lng}`
      : `https://www.google.com/maps?q=${lat},${lng}`;
  Linking.openURL(url);
}

/**
 * ✅ Location permission only once + safe fetch
 */
let hasLocationPerm = false;

async function ensureLocationPerm() {
  if (hasLocationPerm) return true;
  const perm = await Location.requestForegroundPermissionsAsync();
  hasLocationPerm = perm.status === "granted";
  return hasLocationPerm;
}

async function getLiveLocationOnce() {
  const ok = await ensureLocationPerm();
  if (!ok) throw new Error("Location permission denied");

  // ✅ more stable than High; High can trigger OS kills on some devices
  try {
    const last = await Location.getLastKnownPositionAsync({});
    if (last?.coords?.latitude && last?.coords?.longitude) {
      return { lat: last.coords.latitude, lng: last.coords.longitude };
    }
  } catch {}

  const loc = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return { lat: loc.coords.latitude, lng: loc.coords.longitude };
}

// --------------------- UI: Background ---------------------
function FancyBackground() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={styles.bgBase} />
      <View style={[styles.blob, styles.blobA]} />
      <View style={[styles.blob, styles.blobB]} />
      <View style={[styles.blob, styles.blobC]} />
      <View style={[styles.blob, styles.blobD]} />
      <View style={styles.bgVignette} />
    </View>
  );
}

/** Reusable press animation wrapper (bounce) */
function BouncePressable({
  onPress,
  disabled,
  style,
  children,
}: {
  onPress?: () => void;
  disabled?: boolean;
  style?: any;
  children: React.ReactNode;
}) {
  const s = useRef(new Animated.Value(1)).current;

  const down = () => {
    if (disabled) return;
    Animated.spring(s, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 28,
      bounciness: 8,
    }).start();
  };

  const up = () => {
    Animated.spring(s, {
      toValue: 1,
      useNativeDriver: true,
      speed: 18,
      bounciness: 10,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: s }] }}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        onPressIn={down}
        onPressOut={up}
        style={style}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

/** Shimmer background for buttons (no libs) */
function Shimmer({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const x = useRef(new Animated.Value(-140)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(x, {
          toValue: 420,
          duration: 1700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(x, {
          toValue: -140,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.delay(600),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [x]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.shimmer,
        variant === "dark" ? styles.shimmerDark : styles.shimmerLight,
        { transform: [{ translateX: x }, { rotate: "18deg" }] },
      ]}
    />
  );
}

export default function HomeScreen() {
  const [loading, setLoading] = useState(false);
  const [eventId, setEventId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(0);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isMonitoring, setIsMonitoring] = useState(false);
  const accelSubscription = useRef<any>(null);
  const lastTriggerMsRef = useRef<number>(0);

  // ✅ Civilian Alerts Mode
  const [civilianOn, setCivilianOn] = useState(false);

  // ✅ STABLE: will be derived from push token (so reload won't create new civilian)
  const civilUserIdRef = useRef<string>("");

  const lastSeenEventRef = useRef<string | null>(null);

  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const registerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ✅ Debug states
  const [pushToken, setPushToken] = useState<string>("");
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [myLoc, setMyLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [lastRegisterAt, setLastRegisterAt] = useState<string>("");
  const [civilianErr, setCivilianErr] = useState<string>("");

  // ✅ prevent setState after unmount
  const mountedRef = useRef(true);

  // ✅ cache token (avoid repeated getExpoPushTokenAsync)
  const tokenRef = useRef<string>("");

  // ✅ show token alert only once (so it doesn't spam)
  const tokenAlertShownRef = useRef(false);

  // ✅ cache location (avoid heavy GPS on timers)
  const lastLocRef = useRef<{ lat: number; lng: number; t: number } | null>(null);

  async function getCachedLocation(maxAgeMs = 15000) {
    const now = Date.now();
    if (lastLocRef.current && now - lastLocRef.current.t < maxAgeMs) {
      return { lat: lastLocRef.current.lat, lng: lastLocRef.current.lng };
    }
    const loc = await getLiveLocationOnce();
    lastLocRef.current = { ...loc, t: now };
    return loc;
  }

  // ✅ In-app animated danger popup (foreground)
  const [inAppAlert, setInAppAlert] = useState<{
    title: string;
    body: string;
    lat?: number;
    lng?: number;
  } | null>(null);

  const alertScale = useRef(new Animated.Value(0.6)).current;
  const alertOpacity = useRef(new Animated.Value(0)).current;

  function showInAppAlert(data: { title: string; body: string; lat?: number; lng?: number }) {
    setInAppAlert(data);
    alertScale.setValue(0.6);
    alertOpacity.setValue(0);

    Animated.parallel([
      Animated.timing(alertOpacity, { toValue: 1, duration: 160, useNativeDriver: true }),
      Animated.spring(alertScale, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 10 }),
    ]).start();
  }

  function hideInAppAlert() {
    Animated.parallel([
      Animated.timing(alertOpacity, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(alertScale, { toValue: 0.9, duration: 120, useNativeDriver: true }),
    ]).start(() => setInAppAlert(null));
  }

  // --- Entrance animations (SAME)
  const headerY = useRef(new Animated.Value(16)).current;
  const headerO = useRef(new Animated.Value(0)).current;

  const chipsY = useRef(new Animated.Value(18)).current;
  const chipsO = useRef(new Animated.Value(0)).current;

  const cardY = useRef(new Animated.Value(22)).current;
  const cardO = useRef(new Animated.Value(0)).current;

  // Chip pulse when monitoring ON (SAME)
  const chipPulse = useRef(new Animated.Value(1)).current;
  const chipPulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  // ✅ API health check
  async function checkApiHealth() {
    try {
      const r = await axios.get(`${API}/health`, { timeout: 2500 });
      if (mountedRef.current) setApiOk(!!r.data?.ok);
    } catch {
      if (mountedRef.current) setApiOk(false);
    }
  }

  /**
   * ✅ Push token (cached) + Android channel + DEBUG
   * ✅ ALSO sets stable user_id from token
   */
  async function ensurePushTokenOnce(opts?: { showAlert?: boolean }) {
    const showAlert = opts?.showAlert ?? false;

    try {
      if (tokenRef.current) {
        if (mountedRef.current) setPushToken(tokenRef.current);

        // ✅ ensure stable id exists
        if (!civilUserIdRef.current) civilUserIdRef.current = tokenRef.current;

        return tokenRef.current;
      }

      if (!Device.isDevice) {
        if (mountedRef.current) setPushToken("");
        if (showAlert && !tokenAlertShownRef.current) {
          tokenAlertShownRef.current = true;
          Alert.alert(
            "Push Token Missing",
            "Emulator/Simulator me Expo push token reliable nahi hota.\nReal phone + Dev Build/APK use karo."
          );
        }
        return "";
      }

      // ✅ Android channel (important)
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          sound: "default",
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (finalStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        if (mountedRef.current) setPushToken("");
        if (showAlert && !tokenAlertShownRef.current) {
          tokenAlertShownRef.current = true;
          Alert.alert(
            "Notifications Permission Denied",
            "Phone settings me CrashGuard Notifications ON karo.\n(Allow Notifications)"
          );
        }
        return "";
      }

      const token = (await Notifications.getExpoPushTokenAsync()).data;
      tokenRef.current = token;

      // ✅ STABLE user_id per device
      civilUserIdRef.current = token; // (optional short: token.slice(-10))

      if (mountedRef.current) setPushToken(token);

      // ✅ DEBUG: log + (optional) alert once
      console.log("✅ EXPO PUSH TOKEN =>", token);
      if (showAlert && !tokenAlertShownRef.current) {
        tokenAlertShownRef.current = true;
        Alert.alert("Push Token ✅", token);
      }

      return token;
    } catch (e: any) {
      if (mountedRef.current) setPushToken("");

      console.log("❌ PUSH TOKEN ERROR =>", e?.message || e);

      if (showAlert && !tokenAlertShownRef.current) {
        tokenAlertShownRef.current = true;
        Alert.alert(
          "Push Token Error",
          "Token generate nahi ho pa raha.\nCommon reason: Expo Go / Dev build missing expo-notifications config.\nDev Build/APK use karo."
        );
      }
      return "";
    }
  }

  /**
   * ✅ Listen notifications when app open
   * - Foreground: animated in-app popup
   * - Tap: open map
   */
  useEffect(() => {
    mountedRef.current = true;

    const sub = Notifications.addNotificationReceivedListener((notif) => {
      const content = notif.request.content;
      const data: any = content.data || {};

      // ✅ Foreground me animated popup
      showInAppAlert({
        title: content.title || "Alert 🚨",
        body: content.body || "Accident nearby",
        lat: data?.lat ? Number(data.lat) : undefined,
        lng: data?.lng ? Number(data.lng) : undefined,
      });
    });

    const sub2 = Notifications.addNotificationResponseReceivedListener((resp) => {

      const data:any = resp.notification.request.content.data;

      if(data?.lat && data?.lng){

        router.push({
          pathname: "/helper-map",
          params:{
            eventId:data.eventId,
            lat:data.lat,
            lng:data.lng
          }
        });

      }

    });

    return () => {
      mountedRef.current = false;
      sub.remove();
      sub2.remove();
    };
  }, []);

  // Entrance + boot (SAME UI)
  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerO, { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.timing(headerY, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),

      Animated.timing(chipsO, { toValue: 1, duration: 520, delay: 80, useNativeDriver: true }),
      Animated.timing(chipsY, {
        toValue: 0,
        duration: 520,
        delay: 80,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),

      Animated.timing(cardO, { toValue: 1, duration: 620, delay: 120, useNativeDriver: true }),
      Animated.timing(cardY, {
        toValue: 0,
        duration: 620,
        delay: 120,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    checkApiHealth();

    // ✅ Token boot: no popup by default (only logs)
    ensurePushTokenOnce({ showAlert: false });
  }, [cardO, cardY, chipsO, chipsY, headerO, headerY]);

  function startMonitoring() {
    if (isMonitoring) return;
    setIsMonitoring(true);

    Accelerometer.setUpdateInterval(250);

    accelSubscription.current = Accelerometer.addListener((data) => {
      const { x = 0, y = 0, z = 0 } = data;
      const gForce = Math.sqrt(x * x + y * y + z * z);

      const now = Date.now();
      const cooldownMs = 5000;

      if (
        gForce > 2.5 &&
        !eventId &&
        countdown === 0 &&
        now - lastTriggerMsRef.current > cooldownMs
      ) {
        lastTriggerMsRef.current = now;
        startSOS("CRASH", { g_force_peak: Number(gForce.toFixed(2)), confidence: 0.85 });
      }
    });
  }

  function stopMonitoring() {
    accelSubscription.current?.remove?.();
    accelSubscription.current = null;
    setIsMonitoring(false);
  }

  useEffect(() => {
    startMonitoring();
    return () => stopMonitoring();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Chip pulse (SAME)
  useEffect(() => {
    if (isMonitoring) {
      chipPulseLoop.current?.stop?.();
      chipPulse.setValue(1);
      chipPulseLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(chipPulse, {
            toValue: 1.05,
            duration: 900,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(chipPulse, {
            toValue: 1.0,
            duration: 900,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      chipPulseLoop.current.start();
    } else {
      chipPulseLoop.current?.stop?.();
      chipPulse.setValue(1);
    }
  }, [isMonitoring, chipPulse]);

  // Countdown tick
  useEffect(() => {
    if (countdown <= 0) return;
    timerRef.current = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [countdown]);

  // Auto dispatch
  useEffect(() => {
    async function autoDispatch() {
      if (countdown === 0 && eventId) {
        try {
          await axios.post(`${API}/v1/events/${eventId}/dispatch`, { radius_m: 1500 });
          Alert.alert("Dispatched 🚨", `Emergency dispatched`, [
            { text: "Call Ambulance (102)", onPress: () => callNumber("102") },
            { text: "Call Police (112)", onPress: () => callNumber("112") },
            { text: "OK" },
          ]);
        } catch (e: any) {
          Alert.alert("Dispatch Error", e?.response?.data?.error || e.message);
        } finally {
          setEventId(null);
        }
      }
    }
    autoDispatch();
  }, [countdown, eventId]);

  async function startSOS(
    type: "MANUAL_SOS" | "VOICE_SOS" | "CRASH",
    signals?: { confidence?: number; g_force_peak?: number }
  ) {
    if (loading || eventId || countdown > 0) return;

    setLoading(true);
    try {
      await checkApiHealth();

      const loc = await getCachedLocation();
      if (mountedRef.current) setMyLoc(loc);

      const res = await axios.post(`${API}/v1/events`, {
        type,
        source: "MOBILE",
        location: loc,
        device: Device.modelName,
        timestamp: new Date().toISOString(),
        signals: signals ?? { confidence: 1.0 },
        countdown_sec: 12,
      });

      const id = res.data.event.id as string;
      setEventId(id);
      setCountdown(12);
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  }

  async function cancelSOS() {
    if (!eventId) return;
    try {
      await axios.post(`${API}/v1/events/${eventId}/cancel`, { reason: "user_ok" });
      Alert.alert("Cancelled ✅", "Marked as false alarm");
    } catch (e: any) {
      Alert.alert("Cancel Error", e?.response?.data?.error || e.message);
    } finally {
      setEventId(null);
      setCountdown(0);
    }
  }

  // ✅ Civilian register (token cached + location cached) + ✅ stable user_id safeguard
  async function registerCivilian(opt_in: boolean) {
    await checkApiHealth();

    const loc = await getCachedLocation();
    if (mountedRef.current) setMyLoc(loc);

    // ✅ IMPORTANT: showAlert true ONLY when user is enabling alerts
    const token = await ensurePushTokenOnce({ showAlert: opt_in });

    // ✅ ensure stable user id is always set
    if (!civilUserIdRef.current && token) {
      civilUserIdRef.current = token;
    }

    const safeUserId = civilUserIdRef.current || (token ? token : `civ_fallback_${Date.now()}`);

    await axios.post(`${API}/v1/civilians/register`, {
      user_id: safeUserId,
      location: loc,
      opt_in,
      push_token: token || null,
    });

    if (mountedRef.current) {
      setLastRegisterAt(new Date().toLocaleTimeString());
      setCivilianErr("");
    }

    // ✅ Extra warning if token still empty
    if (opt_in && !token) {
      Alert.alert(
        "Push Token Missing ❌",
        "Backend me token_present:false aa raha hoga.\nFix: Dev Build/APK use karo + Notifications ON karo."
      );
    }
  }

  async function enableCivilianAlerts() {
    try {
      await registerCivilian(true);
      setCivilianOn(true);
      Alert.alert("Civilian Alerts ✅", "Now you will get notifications on dispatch.");
    } catch (e: any) {
      if (mountedRef.current)
        setCivilianErr(e?.response?.data?.error || e.message || "Register failed");
      Alert.alert("Civilian Mode Error", e?.response?.data?.error || e.message);
    }
  }

  async function disableCivilianAlerts() {
    try {
      await registerCivilian(false);
    } catch {}
    finally {
      setCivilianOn(false);
      lastSeenEventRef.current = null;
      if (mountedRef.current) setCivilianErr("");
    }
  }

  // ✅ Polling fallback (location cached)
  async function pollNearbyEventsOnce() {
    try {
      const loc = await getCachedLocation();
      if (mountedRef.current) setMyLoc(loc);

      const r = await axios.get(`${API}/v1/events/nearby`, {
        params: { lat: loc.lat, lng: loc.lng },
        timeout: 2500,
      });

      if (!r.data?.found) return;

      const ev = r.data.event;
      if (!ev?.id) return;

      if (lastSeenEventRef.current === ev.id) return;
      lastSeenEventRef.current = ev.id;

      // ✅ In-app alert (foreground)
      showInAppAlert({
        title: "Accident Nearby 🚨",
        body: `Someone may need help.\nDistance: ~${r.data.distance_m}m\nAlert radius: ${r.data.radius_m}m`,
        lat: ev.location?.lat,
        lng: ev.location?.lng,
      });
    } catch {}
  }

  /**
   * ✅ Timers optimized (not too aggressive)
   * Poll: 8s, Register: 25s  (stable + still responsive)
   */
  useEffect(() => {
    if (civilianOn) {
      pollNearbyEventsOnce();
      registerCivilian(true).catch(() => {});

      pollTimerRef.current = setInterval(() => pollNearbyEventsOnce(), 8000);
      registerTimerRef.current = setInterval(() => registerCivilian(true).catch(() => {}), 25000);
    } else {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;

      if (registerTimerRef.current) clearInterval(registerTimerRef.current);
      registerTimerRef.current = null;
    }

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;

      if (registerTimerRef.current) clearInterval(registerTimerRef.current);
      registerTimerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [civilianOn]);

  // Foreground refresh
  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") {
        checkApiHealth();
        ensurePushTokenOnce({ showAlert: false });
        if (civilianOn) {
          registerCivilian(true).catch(() => {});
          pollNearbyEventsOnce();
        }
      }
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [civilianOn]);

  const isCounting = countdown > 0 && !!eventId;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <FancyBackground />

      {/* Header entrance */}
      <Animated.View style={{ opacity: headerO, transform: [{ translateY: headerY }] }}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.brand}>CrashGuard</Text>
            <Text style={styles.emoji}>🚑</Text>
          </View>
          <Text style={styles.tagline}>AI Accident Detection System</Text>
        </View>
      </Animated.View>

      {/* Chips entrance */}
      <Animated.View style={{ opacity: chipsO, transform: [{ translateY: chipsY }] }}>
        <View style={styles.chipsRow}>
          <Animated.View style={{ transform: [{ scale: chipPulse }] }}>
            <View style={[styles.chip, isMonitoring ? styles.chipOn : styles.chipOff]}>
              <Text style={styles.chipText}>
                {isMonitoring ? "AI Monitoring: ON" : "AI Monitoring: OFF"}
              </Text>
            </View>
          </Animated.View>

          <View style={[styles.chip, styles.chipInfo]}>
            <Text style={styles.chipText}>API: {API.replace("http://", "")}</Text>
          </View>
        </View>
      </Animated.View>

      {/* Card entrance */}
      <Animated.View style={{ opacity: cardO, transform: [{ translateY: cardY }] }}>
        <View style={styles.card}>
          <View pointerEvents="none" style={styles.cardGlowTop} />
          <View pointerEvents="none" style={styles.cardGlowBottom} />

          {/* Civilian Mode */}
          <View style={styles.rowBetweenTop}>
            <Text style={styles.miniLabel}>Civilian alerts</Text>

            <BouncePressable
              style={[styles.pillBtn, civilianOn && styles.pillBtnOn]}
              onPress={civilianOn ? disableCivilianAlerts : enableCivilianAlerts}
            >
              <Text style={[styles.pillText, civilianOn && styles.pillTextOn]}>
                {civilianOn ? "ON" : "OFF"}
              </Text>
            </BouncePressable>
          </View>

          {/* Debug line */}
          <View style={styles.debugRow}>
            <Text style={styles.debugText}>
              API: {apiOk === null ? "…" : apiOk ? "OK" : "DOWN"} • ID:{" "}
              {civilUserIdRef.current ? "token-based" : "…"}
            </Text>
            <Text style={styles.debugText}>
              {myLoc ? `${myLoc.lat.toFixed(4)}, ${myLoc.lng.toFixed(4)}` : "Loc: …"}
            </Text>
          </View>

          {!!pushToken && <Text style={styles.debugTextMuted}>Push: ✅ token ready</Text>}
          {!pushToken && (
            <Text style={styles.debugTextError}>
              Push: ❌ token missing (Expo Go / permission / dev build issue)
            </Text>
          )}

          {!!lastRegisterAt && (
            <Text style={styles.debugTextMuted}>Last register: {lastRegisterAt}</Text>
          )}
          {!!civilianErr && <Text style={styles.debugTextError}>Civilian error: {civilianErr}</Text>}

          <View style={styles.dividerSoft} />

          {!isCounting ? (
            <>
              <Text style={styles.cardTitle}>Stay protected</Text>
              <Text style={styles.cardSub}>
                Crash detection is running in the background. Use SOS if you need help.
              </Text>

              <BouncePressable
                style={[styles.primaryBtn, loading && styles.disabled]}
                onPress={() => startSOS("MANUAL_SOS")}
                disabled={loading}
              >
                <Shimmer variant="dark" />
                <Text style={styles.primaryBtnText}>
                  {loading ? "Starting..." : "SOS (Start Countdown)"}
                </Text>
                <Text style={styles.btnHint}>Auto-dispatch after 12s</Text>
              </BouncePressable>

              <BouncePressable
                style={styles.secondaryBtn}
                onPress={() => startSOS("VOICE_SOS", { confidence: 0.9 })}
              >
                <Shimmer variant="light" />
                <Text style={styles.secondaryBtnText}>Voice SOS (Demo)</Text>
              </BouncePressable>

              <View style={styles.divider} />

              <View style={styles.rowBetween}>
                <Text style={styles.miniLabel}>Crash detection</Text>

                <BouncePressable
                  style={styles.pillBtn}
                  onPress={isMonitoring ? stopMonitoring : startMonitoring}
                >
                  <Text style={styles.pillText}>{isMonitoring ? "Stop" : "Start"}</Text>
                </BouncePressable>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.cardTitle}>Emergency Countdown</Text>
              <Text style={styles.cardSub}>If you’re OK, cancel before it dispatches.</Text>

              <View style={styles.timerWrap}>
                <Text style={styles.timerNum}>{countdown}</Text>
                <Text style={styles.timerUnit}>seconds</Text>
              </View>

              <BouncePressable style={styles.dangerBtn} onPress={cancelSOS}>
                <Text style={styles.dangerBtnText}>I’m OK (Cancel)</Text>
              </BouncePressable>

              <Text style={styles.eventHint}>Event: {eventId}</Text>
            </>
          )}
        </View>
      </Animated.View>

      <Text style={styles.footer}>
        Tip: Shake your phone hard to simulate crash detection (threshold 2.5g).
      </Text>

      {/* ✅ In-app animated danger popup */}
      {inAppAlert && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: "rgba(0,0,0,0.35)",
              justifyContent: "center",
              alignItems: "center",
              opacity: alertOpacity,
            },
          ]}
        >
          <Animated.View
            style={{
              width: "86%",
              borderRadius: 22,
              padding: 16,
              backgroundColor: "white",
              transform: [{ scale: alertScale }],
              borderWidth: 2,
              borderColor: "rgba(220,38,38,0.35)",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Text style={{ fontSize: 28 }}>⚠️</Text>
              <Text style={{ fontSize: 18, fontWeight: "900", color: "#DC2626" }}>
                {inAppAlert.title}
              </Text>
            </View>

            <Text style={{ marginTop: 8, color: "#0F172A", fontWeight: "700" }}>
              {inAppAlert.body}
            </Text>

            <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
              <Pressable
                onPress={() => {
                  if (inAppAlert.lat && inAppAlert.lng) openMaps(inAppAlert.lat, inAppAlert.lng);
                  hideInAppAlert();
                }}
                style={{
                  flex: 1,
                  backgroundColor: "#DC2626",
                  paddingVertical: 12,
                  borderRadius: 14,
                }}
              >
                <Text style={{ color: "white", fontWeight: "900", textAlign: "center" }}>
                  Open Location
                </Text>
              </Pressable>

              <Pressable
                onPress={hideInAppAlert}
                style={{
                  flex: 1,
                  backgroundColor: "#0F172A",
                  paddingVertical: 12,
                  borderRadius: 14,
                }}
              >
                <Text style={{ color: "white", fontWeight: "900", textAlign: "center" }}>
                  OK
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}

// --------------------- Styles (SAME) ---------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? 18 : 22,
    paddingHorizontal: 18,
    justifyContent: "center",
  },

  bgBase: { ...StyleSheet.absoluteFillObject, backgroundColor: "#F7F8FF" },
  blob: { position: "absolute", borderRadius: 9999, opacity: 0.65 },
  blobA: { width: 260, height: 260, backgroundColor: "#A7F3D0", top: -80, left: -80 },
  blobB: { width: 320, height: 320, backgroundColor: "#C7D2FE", top: 60, right: -140 },
  blobC: {
    width: 340,
    height: 340,
    backgroundColor: "#BAE6FD",
    bottom: 120,
    right: -160,
    opacity: 0.55,
  },
  blobD: { width: 260, height: 260, backgroundColor: "#FDE68A", bottom: -120, left: -100, opacity: 0.35 },
  bgVignette: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(15, 23, 42, 0.03)" },

  header: { alignItems: "center" },
  titleRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "center", gap: 8 },
  brand: { fontSize: 34, fontWeight: "900", letterSpacing: 0.3, color: "#0F172A" },
  emoji: { fontSize: 26, marginBottom: 4 },
  tagline: { textAlign: "center", marginTop: 6, color: "#475569", fontSize: 14 },

  chipsRow: {
    marginTop: 18,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.06)",
  },
  chipOn: { backgroundColor: "rgba(167, 243, 208, 0.55)" },
  chipOff: { backgroundColor: "rgba(254, 226, 226, 0.60)" },
  chipInfo: { backgroundColor: "rgba(226, 232, 240, 0.70)" },
  chipText: { fontSize: 12, fontWeight: "800", color: "#0F172A" },

  card: {
    marginTop: 16,
    borderRadius: 22,
    padding: 16,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.78)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.55)",
    shadowColor: "#0F172A",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 5,
  },
  cardGlowTop: {
    position: "absolute",
    top: -60,
    left: -60,
    right: -60,
    height: 200,
    borderRadius: 999,
    backgroundColor: "rgba(199,210,254,0.55)",
  },
  cardGlowBottom: {
    position: "absolute",
    bottom: -80,
    left: -60,
    right: -60,
    height: 220,
    borderRadius: 999,
    backgroundColor: "rgba(253,230,138,0.32)",
  },

  rowBetweenTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },

  debugRow: { marginTop: 8, flexDirection: "row", justifyContent: "space-between", gap: 10 },
  debugText: { fontSize: 11, fontWeight: "800", color: "rgba(71, 85, 105, 0.95)" },
  debugTextMuted: { marginTop: 4, fontSize: 11, fontWeight: "700", color: "rgba(71, 85, 105, 0.75)" },
  debugTextError: { marginTop: 4, fontSize: 11, fontWeight: "900", color: "rgba(220, 38, 38, 0.9)" },

  dividerSoft: { marginTop: 10, height: 1, backgroundColor: "rgba(226,232,240,0.65)" },

  cardTitle: { fontSize: 18, fontWeight: "900", color: "#0F172A", marginTop: 12 },
  cardSub: { marginTop: 6, fontSize: 13, color: "#64748B", lineHeight: 18 },

  primaryBtn: {
    marginTop: 14,
    backgroundColor: "#0F172A",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    overflow: "hidden",
    shadowColor: "#0F172A",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  primaryBtnText: { color: "#fff", fontWeight: "900", fontSize: 16, textAlign: "center" },
  btnHint: { marginTop: 6, color: "rgba(226,232,240,0.9)", fontSize: 12, textAlign: "center" },

  secondaryBtn: {
    marginTop: 10,
    backgroundColor: "#334155",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    overflow: "hidden",
    shadowColor: "#0F172A",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  secondaryBtnText: { color: "#fff", fontWeight: "800", fontSize: 14, textAlign: "center" },

  dangerBtn: {
    marginTop: 12,
    backgroundColor: "#DC2626",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    overflow: "hidden",
    shadowColor: "#7F1D1D",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  dangerBtnText: { color: "#fff", fontWeight: "900", fontSize: 15, textAlign: "center" },

  shimmer: { position: "absolute", top: -30, bottom: -30, width: 90, borderRadius: 24, opacity: 0.35 },
  shimmerDark: { backgroundColor: "rgba(255,255,255,0.22)" },
  shimmerLight: { backgroundColor: "rgba(255,255,255,0.16)" },

  timerWrap: {
    marginTop: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: "rgba(241,245,249,0.85)",
    borderWidth: 1,
    borderColor: "rgba(226,232,240,0.9)",
  },
  timerNum: { fontSize: 46, fontWeight: "900", color: "#0F172A" },
  timerUnit: { marginTop: -2, fontSize: 12, fontWeight: "800", color: "#64748B" },
  eventHint: { marginTop: 10, fontSize: 12, color: "#64748B" },

  divider: { marginTop: 14, height: 1, backgroundColor: "rgba(226,232,240,0.9)" },
  rowBetween: { marginTop: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  miniLabel: { fontSize: 12, fontWeight: "800", color: "#64748B" },

  pillBtn: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "rgba(238,242,255,0.95)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.15)",
  },
  pillText: { fontSize: 12, fontWeight: "900", color: "#3730A3" },

  pillBtnOn: { backgroundColor: "rgba(16,185,129,0.16)", borderColor: "rgba(16,185,129,0.22)" },
  pillTextOn: { color: "#065F46" },

  disabled: { opacity: 0.6 },
  footer: { marginTop: 14, textAlign: "center", fontSize: 12, color: "#64748B" },
});