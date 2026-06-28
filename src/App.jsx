import { useState, useEffect, useMemo, useRef } from "react";
import { 
  adhkarData, 
  unifiedRuqyahSteps, 
  treatmentRuqyahGuide
} from "./data/adhkar";

const fullWrittenRuqyah = [...unifiedRuqyahSteps, ...treatmentRuqyahGuide];
import quranData from "./data/quran.json";
import { 
  BookOpen, Sparkles, Clock, Compass, Calendar, Settings, Sun, Moon, 
  Play, Pause, SkipForward, SkipBack, Volume2, RotateCcw, VolumeX, Square,
  Bookmark, ChevronLeft, ChevronRight, Check, CheckCircle, Radio, 
  FileText, X, ChevronDown, ChevronUp, Info, Activity, Minus, Plus,
  MapPin, Sliders, Trash2
} from "lucide-react";
import { Haptics } from "@capacitor/haptics";
import { LocalNotifications } from "@capacitor/local-notifications";
import { registerPlugin } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";

const HisnAudio = registerPlugin("HisnAudio");

// --- Configuration & Constants ---
const cleanArabicText = (text) => {
  if (!text) return "";
  return text.replace(/[\u064B-\u065F\u0670]/g, "");
};

const locationPresets = [
  { id: "cairo", city: "Cairo", country: "Egypt", name: "القاهرة، مصر", lat: 30.0444, lng: 31.2357, method: 5 },
  { id: "riyadh", city: "Riyadh", country: "Saudi Arabia", name: "الرياض، السعودية", lat: 24.7136, lng: 46.6753, method: 4 },
  { id: "makkah", city: "Makkah", country: "Saudi Arabia", name: "مكة المكرمة، السعودية", lat: 21.3891, lng: 39.8579, method: 4 },
  { id: "amman", city: "Amman", country: "Jordan", name: "عمان، الأردن", lat: 31.9454, lng: 35.9284, method: 3 },
  { id: "dubai", city: "Dubai", country: "UAE", name: "دبي، الإمارات", lat: 25.2048, lng: 55.2708, method: 8 },
  { id: "casablanca", city: "Casablanca", country: "Morocco", name: "الدار البيضاء، المغرب", lat: 33.5731, lng: -7.5898, method: 3 },
  { id: "london", city: "London", country: "UK", name: "لندن، بريطانيا", lat: 51.5074, lng: -0.1278, method: 2 }
];

const calculationMethods = [
  { id: 5, name: "الهيئة المصرية العامة للمساحة" },
  { id: 4, name: "جامعة أم القرى، مكة المكرمة" },
  { id: 3, name: "رابطة العالم الإسلامي" },
  { id: 2, name: "الجمعية الإسلامية لأمريكا الشمالية (ISNA)" },
  { id: 1, name: "جامعة العلوم الإسلامية بكراتشي" },
  { id: 8, name: "منطقة الخليج العربي" },
  { id: 9, name: "دولة الكويت" },
  { id: 10, name: "دولة قطر" },
  { id: 13, name: "رئاسة الشؤون الدينية التركية" }
];

const radioStations = [
  { id: "cairo", name: "إذاعة القرآن الكريم من القاهرة", detail: "البث المباشر لإذاعة القاهرة الرسمية 24/7", url: "https://stream.radiojar.com/8s5u5tpdtwzuv" },
  { id: "riyadh", name: "إذاعة القرآن الكريم من الرياض", detail: "البث المباشر لإذاعة الرياض والمسجد الحرام", url: "https://live.kwikmotion.com/sbrksaquranradiolive/srpksaquranradio/playlist.m3u8" },
  { id: "ruqyah", name: "إذاعة الرقية الشرعية المباشرة", detail: "تلاوات الرقية المتواصلة لشفاء البدن والروح", url: "https://backup.qurango.net/radio/roqiah" },
  { id: "alafasy", name: "إذاعة الأناشيد والقرآن (العفاسي)", detail: "أناشيد وتلاوات مميزة بصوت الشيخ مشاري العفاسي", url: "https://backup.qurango.net/radio/mishary_alafasi" },
  { id: "tafseer", name: "إذاعة تفسير القرآن الكريم والدروس", detail: "خواطر وتفسير القرآن الكريم للعلماء على مدار الساعة", url: "https://backup.qurango.net/radio/tafseer" }
];

const playlist = [
  { id: "002", name: "سورة البقرة", detail: "طرد الشياطين والتحصين الشامل للمنزل", file: "002.mp3" },
  { id: "017", name: "سورة الإسراء", detail: "تحصين ووقاية النوم المأثورة", file: "017.mp3" },
  { id: "032", name: "سورة السجدة", detail: "الهدوء النفسي والوقاية النبوية قبل النوم", file: "032.mp3" },
  { id: "039", name: "سورة الزمر", detail: "تحصين ووقاية النوم اليومية", file: "039.mp3" },
  { id: "067", name: "سورة الملك", detail: "المانعة والمنجية من عذاب القبر", file: "067.mp3" },
  { id: "109", name: "سورة الكافرون", detail: "البراءة من الشرك ومنافاة الشيطان", file: "109.mp3" },
  { id: "112", name: "سورة الإخلاص", detail: "ثُلث القرآن والتوحيد الخالص", file: "112.mp3" },
  { id: "113", name: "سورة الفلق", detail: "الاستعاذة من الشرور الخفية والنفث في العقد", file: "113.mp3" },
  { id: "114", name: "سورة الناس", detail: "الاستعاذة من الوسواس الخناس والقرين", file: "114.mp3" }
];

const dailyPrayers = [
  { id: "Fajr", name: "الفجر", rakaat: 2, emoji: "🌅", desc: "ركعتين" },
  { id: "Dhuhr", name: "الظهر", rakaat: 4, emoji: "☀️", desc: "أربع ركعات" },
  { id: "Asr", name: "العصر", rakaat: 4, emoji: "🌤️", desc: "أربع ركعات" },
  { id: "Maghrib", name: "المغرب", rakaat: 3, emoji: "🌆", desc: "ثلاث ركعات" },
  { id: "Isha", name: "العشاء", rakaat: 4, emoji: "🌙", desc: "أربع ركعات" }
];

const dailyReminders = [
  "قراءة آية الكرسي بعد كل صلاة مكتوبة تحرسك وتدخلك الجنة بفضل الله.",
  "قال رسول الله صلى الله عليه وسلم: كلمتان خفيفتان على اللسان، ثقيلتان في الميزان: سبحان الله وبحمده، سبحان الله العظيم.",
  "حافظ على أذكار الصباح والمساء، فهي درعك الواقي من كل عين وعارض.",
  "الاستغفار يفتح الأقفال ويبدد الهموم ويجلب الأرزاق، استغفر الآن.",
  "قراءة سورة الملك قبل النوم تنجي من عذاب القبر بفضل الله ورحمته.",
  "صلي على النبي ﷺ عشراً في الصباح وعشراً في المساء تدركك شفاعته."
];

function App() {
  // --- Navigation & Core Settings ---
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, quran, shield, utilities
  const [activeShieldSubTab, setActiveShieldSubTab] = useState("adhkar"); // adhkar, ruqyah, radio
  const [activeUtilitiesSubTab, setActiveUtilitiesSubTab] = useState("prayers"); // prayers, calendar, tasbih, settings
  const [activeAdhkarKey, setActiveAdhkarKey] = useState("morning"); // morning, evening, sleep, study
  const [activeRuqyahSubTab, setActiveRuqyahSubTab] = useState("written"); // written, audio
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem("themeMode") || "system");
  const [fontSize, setFontSize] = useState(() => parseInt(localStorage.getItem("fontSize")) || 18);
  const [hapticsEnabled, setHapticsEnabled] = useState(() => {
    const saved = localStorage.getItem("hapticsEnabled");
    return saved !== null ? saved === "true" : true;
  });

  // --- Devotion & Habits Progress State ---
  const [completedItems, setCompletedItems] = useState(() => JSON.parse(localStorage.getItem("completedItems")) || {});
  const [itemCounts, setItemCounts] = useState(() => JSON.parse(localStorage.getItem("itemCounts")) || {});
  const [streak, setStreak] = useState(() => parseInt(localStorage.getItem("streak")) || 0);
  const [lastCompletedDate, setLastCompletedDate] = useState(() => localStorage.getItem("lastCompletedDate") || "");
  const [prayerLog, setPrayerLog] = useState(() => JSON.parse(localStorage.getItem("prayerLog")) || {});
  const [quranBookmark, setQuranBookmark] = useState(() => JSON.parse(localStorage.getItem("quranBookmark")) || null);
  const [tasbihCount, setTasbihCount] = useState(0);
  const [tasbihTotal, setTasbihTotal] = useState(() => parseInt(localStorage.getItem("tasbihTotal")) || 0);
  const [tasbihTarget, setTasbihTarget] = useState(33);
  const [showResetModal, setShowResetModal] = useState(false);

  // --- Quran States ---
  const [quranSurahs] = useState(quranData.surahs);
  const [isQuranLoading] = useState(false);
  const [activeSurah, setActiveSurah] = useState(null);
  const [quranSearchQuery, setQuranSearchQuery] = useState("");
  const [quranReadMode, setQuranReadMode] = useState("page"); // verses, page

  const activeSurahData = useMemo(() => {
    if (!activeSurah) return null;
    return quranSurahs.find(s => s.number === activeSurah) || null;
  }, [activeSurah, quranSurahs]);

  const [isActiveSurahLoading] = useState(false);
  const [quranSearchResults, setQuranSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const pendingScroll = useRef(null);

  // --- Athan/Azan Alert States ---
  const [selectedAthan, setSelectedAthan] = useState(() => localStorage.getItem("selectedAthan") || "beep");
  const [previewAudio, setPreviewAudio] = useState(null);
  const [previewingAthanId, setPreviewingAthanId] = useState(null);

  // --- Audio Player States ---
  const audioRef = useRef(null);
  const playTrackRef = useRef(null);
  const loopPlaylistRef = useRef(true);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeRadioStation, setActiveRadioStation] = useState(null);
  const [radioError, setRadioError] = useState(null);
  const [audioError, setAudioError] = useState(null);
  const [isAudioBuffering, setIsAudioBuffering] = useState(false);

  // --- Aladhan API States ---
  const [selectedLocation, setSelectedLocation] = useState(() => {
    const saved = localStorage.getItem("selectedLocation");
    return saved ? JSON.parse(saved) : locationPresets[0]; // Default to Cairo
  });
  const [prayerTimes, setPrayerTimes] = useState(() => JSON.parse(localStorage.getItem("cachedPrayerTimes")) || null);
  const [hijriDate, setHijriDate] = useState(() => JSON.parse(localStorage.getItem("cachedHijriDate")) || null);
  const [locationStatus, setLocationStatus] = useState("idle"); // idle, detecting, success, error
  const [prayerTimesError, setPrayerTimesError] = useState(null);
  const [hijriConvertDate, setHijriConvertDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [convertedHijri, setConvertedHijri] = useState(null);
  const [prayerAlert, setPrayerAlert] = useState(null);

  const [randomReminder, setRandomReminder] = useState(dailyReminders[0]);

  const todayKey = useMemo(() => new Date().toDateString(), []);

  // --- Haptics Utility ---
  const triggerHaptic = (pattern = 50) => {
    if (!hapticsEnabled) return;
    try {
      if (Haptics && typeof Haptics.vibrate === 'function') {
        const duration = Array.isArray(pattern) ? pattern[0] : pattern;
        Haptics.vibrate({ duration: duration || 50 });
      } else if ("vibrate" in navigator) {
        navigator.vibrate(pattern);
      }
    } catch (e) {
      console.log("Haptic feedback failed:", e);
      try {
        if ("vibrate" in navigator) {
          navigator.vibrate(pattern);
        }
      } catch (err) {}
    }
  };

  // --- Play Alert Sound (Synthesized or Selected Athan) ---
  const playAlertSound = () => {
    try {
      if (selectedAthan === "beep") {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const playTone = (freq, duration, delay) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, audioCtx.currentTime + delay);
          gain.gain.setValueAtTime(0.15, audioCtx.currentTime + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delay + duration - 0.05);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(audioCtx.currentTime + delay);
          osc.stop(audioCtx.currentTime + delay + duration);
        };
        for (let i = 0; i < 12; i++) {
          const seqDelay = i * 1.6;
          playTone(523.25, 0.3, seqDelay);      // C5
          playTone(659.25, 0.3, seqDelay + 0.2);    // E5
          playTone(783.99, 0.4, seqDelay + 0.4);    // G5
        }
      } else {
        const athanUrls = {
          azan1: "https://www.islamcan.com/audio/adhan/azan1.mp3",
          azan2: "https://www.islamcan.com/audio/adhan/azan2.mp3",
          azan3: "https://www.islamcan.com/audio/adhan/azan3.mp3",
          azan5: "https://www.islamcan.com/audio/adhan/azan5.mp3",
          azan7: "https://www.islamcan.com/audio/adhan/azan7.mp3",
          azan6: "https://www.islamcan.com/audio/adhan/azan6.mp3"
        };
        const url = athanUrls[selectedAthan];
        if (url) {
          const audio = new Audio(url);
          audio.play().catch(err => console.log("Failed to play Athan audio alert:", err));
        }
      }
    } catch (e) {
      console.log("Failed to play alert sound:", e);
    }
  };

  // --- Toggle Athan Preview Playback ---
  const handleAthanPreviewToggle = (optionId, optionUrl) => {
    if (previewingAthanId === optionId && previewAudio) {
      if (previewAudio instanceof AudioContext) {
        previewAudio.close().catch(() => {});
      } else {
        previewAudio.pause();
      }
      setPreviewingAthanId(null);
      setPreviewAudio(null);
      triggerHaptic(30);
    } else {
      if (previewAudio) {
        if (previewAudio instanceof AudioContext) {
          previewAudio.close().catch(() => {});
        } else {
          previewAudio.pause();
        }
      }
      triggerHaptic(50);
      if (optionId === "beep") {
        try {
          const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          const playTone = (freq, duration, delay) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime + delay);
            gain.gain.setValueAtTime(0.15, audioCtx.currentTime + delay);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delay + duration - 0.05);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(audioCtx.currentTime + delay);
            osc.stop(audioCtx.currentTime + delay + duration);
          };
          for (let i = 0; i < 12; i++) {
            const seqDelay = i * 1.6;
            playTone(523.25, 0.3, seqDelay);      // C5
            playTone(659.25, 0.3, seqDelay + 0.2);    // E5
            playTone(783.99, 0.4, seqDelay + 0.4);    // G5
          }
          setPreviewingAthanId("beep");
          setPreviewAudio(audioCtx);
          const timeoutId = setTimeout(() => {
            setPreviewingAthanId(null);
            setPreviewAudio(null);
          }, 19500);
          
          audioCtx.onstatechange = () => {
            if (audioCtx.state === "closed") {
              clearTimeout(timeoutId);
            }
          };
        } catch (e) {
          console.log("Failed to play synthesized sound:", e);
        }
      } else if (optionUrl) {
        const audio = new Audio(optionUrl);
        setPreviewingAthanId(optionId);
        setPreviewAudio(audio);
        audio.play()
          .then(() => {
            audio.onended = () => {
              setPreviewingAthanId(null);
              setPreviewAudio(null);
            };
          })
          .catch(err => {
            console.log("Failed to play preview:", err);
            alert("تعذر تشغيل تجربة الأذان، يرجى التحقق من اتصال الإنترنت.");
            setPreviewingAthanId(null);
            setPreviewAudio(null);
          });
      }
    }
  };

  // Cordova Background mode disabled - replaced by native HisnAudio service.

  // --- MediaSession Synchronizer ---
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    if (isPlaying) {
      navigator.mediaSession.playbackState = "playing";
      let title = "حصن المسلم";
      let artist = "الرقية والأذكار";
      let album = "Hisn App";

      if (activeRadioStation) {
        title = activeRadioStation.name;
        artist = "البث المباشر";
        album = "المذياع الإسلامي";
      } else if (currentTrackIndex !== null && playlist[currentTrackIndex]) {
        title = playlist[currentTrackIndex].name;
        artist = "الرقية المسموعة";
        album = playlist[currentTrackIndex].detail;
      }

      navigator.mediaSession.metadata = new MediaMetadata({
        title, artist, album,
        artwork: [{ src: "favicon.svg", sizes: "192x192", type: "image/svg+xml" }]
      });

      navigator.mediaSession.setActionHandler("play", () => {
        if (audioRef.current) {
          audioRef.current.play().then(() => setIsPlaying(true)).catch(e => console.log(e));
        }
      });
      navigator.mediaSession.setActionHandler("pause", () => {
        if (audioRef.current) {
          audioRef.current.pause();
          setIsPlaying(false);
        }
      });
      navigator.mediaSession.setActionHandler("stop", () => {
        cleanupAudio();
      });
    } else {
      navigator.mediaSession.playbackState = "paused";
    }
  }, [isPlaying, activeRadioStation, currentTrackIndex]);


  // --- Theme Mode Manager ---
  useEffect(() => {
    const root = window.document.documentElement;
    const applyTheme = () => {
      root.classList.remove("dark");
      if (themeMode === "dark") {
        root.classList.add("dark");
      } else if (themeMode === "system") {
        const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        if (isDark) root.classList.add("dark");
      }
    };
    applyTheme();
    localStorage.setItem("themeMode", themeMode);

    if (themeMode === "system") {
      const matcher = window.matchMedia("(prefers-color-scheme: dark)");
      matcher.addEventListener("change", applyTheme);
      return () => matcher.removeEventListener("change", applyTheme);
    }
  }, [themeMode]);

  // --- Refresh Random Reminder ---
  useEffect(() => {
    const randomIdx = Math.floor(Math.random() * dailyReminders.length);
    setRandomReminder(dailyReminders[randomIdx]);
  }, [activeTab]);

  // --- Fetch API Timings & Qibla ---
  const fetchPrayerTimes = async (lat, lng, method, isPreset = false) => {
    if (!isPreset) setLocationStatus("detecting");
    setPrayerTimesError(null);
    
    // Check if we can use the 24-hour cache
    const cacheKey = `cachedTimes_${lat}_${lng}_${method}`;
    const cachedData = localStorage.getItem(cacheKey);
    const cachedHijri = localStorage.getItem("cachedHijriDate");
    const lastFetch = localStorage.getItem("lastApiFetchTimestamp");
    
    const oneDay = 24 * 60 * 60 * 1000;
    const isCacheValid = cachedData && cachedHijri && lastFetch && (Date.now() - parseInt(lastFetch, 10) < oneDay);
    
    if (isCacheValid) {
      console.log("Loading timings from 24-hour local cache...");
      const timings = JSON.parse(cachedData);
      setPrayerTimes(timings);
      
      const parsedHijri = JSON.parse(cachedHijri);
      setHijriDate({
        day: parsedHijri.day,
        monthNameAr: parsedHijri.month.ar,
        monthNameEn: parsedHijri.month.en,
        year: parsedHijri.year,
        weekdayAr: parsedHijri.weekday.ar
      });
      
      setLocationStatus("success");
      return;
    }
    
    try {
      const nowSec = Math.floor(Date.now() / 1000);
      const res = await fetch(`https://api.aladhan.com/v1/timings/${nowSec}?latitude=${lat}&longitude=${lng}&method=${method}`);
      const json = await res.json();
      
      if (json.code === 200 && json.data) {
        const timings = json.data.timings;
        const hijri = json.data.date.hijri;
        
        setPrayerTimes(timings);
        setHijriDate({
          day: hijri.day,
          monthNameAr: hijri.month.ar,
          monthNameEn: hijri.month.en,
          year: hijri.year,
          weekdayAr: hijri.weekday.ar
        });
        
        localStorage.setItem(cacheKey, JSON.stringify(timings));
        localStorage.setItem("cachedPrayerTimes", JSON.stringify(timings)); // fallback compatibility
        localStorage.setItem("cachedHijriDate", JSON.stringify(hijri));
        localStorage.setItem("lastApiFetchTimestamp", Date.now().toString());
        setLocationStatus("success");
      } else {
        throw new Error("Invalid API Response Format");
      }
    } catch (e) {
      console.log("Timings fetch failed, loading fallback cache:", e);
      setPrayerTimesError("فشل تحميل المواقيت. تم استخدام آخر بيانات محفوظة.");
      setLocationStatus("error");
      
      // Load offline fallback cache
      const fallbackTimes = localStorage.getItem("cachedPrayerTimes") || cachedData;
      const fallbackHijri = localStorage.getItem("cachedHijriDate") || cachedHijri;
      if (fallbackTimes) setPrayerTimes(JSON.parse(fallbackTimes));
      if (fallbackHijri) {
        const parsed = JSON.parse(fallbackHijri);
        setHijriDate({
          day: parsed.day,
          monthNameAr: parsed.month.ar,
          monthNameEn: parsed.month.en,
          year: parsed.year,
          weekdayAr: parsed.weekday.ar
        });
      }
    }
  };

  useEffect(() => {
    if (selectedLocation) {
      fetchPrayerTimes(selectedLocation.lat, selectedLocation.lng, selectedLocation.method, true);
    }
  }, [selectedLocation]);

  // --- Quran Search Local Offline Filter ---
  useEffect(() => {
    const query = cleanArabicText(quranSearchQuery.trim());
    if (query.length < 3) {
      setQuranSearchResults([]);
      return;
    }

    setIsSearching(true);
    const delayDebounce = setTimeout(() => {
      const results = [];
      quranData.surahs.forEach(s => {
        s.ayahs.forEach(a => {
          const cleanAyahText = cleanArabicText(a.text);
          if (cleanAyahText.includes(query)) {
            results.push({
              surahNum: s.number,
              surahName: s.name,
              ayahNum: s.num,
              text: a.text
            });
          }
        });
      });
      setQuranSearchResults(results.slice(0, 100));
      setIsSearching(false);
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [quranSearchQuery]);

  // --- Request Local Notifications Permissions ---
  useEffect(() => {
    try {
      LocalNotifications.requestPermissions().then(result => {
        console.log("LocalNotifications permissions request result:", result);
      });
    } catch (e) {
      console.log("LocalNotifications requestPermissions failed:", e);
    }
  }, []);

  // --- Android Native Back Button Handler ---
  useEffect(() => {
    let handler;
    const registerBackButton = async () => {
      handler = await CapApp.addListener("backButton", () => {
        if (activeSurah !== null) {
          setActiveSurah(null);
          triggerHaptic(30);
        } else if (quranSearchQuery.trim() !== "") {
          setQuranSearchQuery("");
          triggerHaptic(30);
        } else if (activeTab !== "home") {
          setActiveTab("home");
          triggerHaptic(30);
        } else {
          CapApp.exitApp();
        }
      });
    };
    
    registerBackButton();
    
    return () => {
      if (handler) {
        handler.remove();
      }
    };
  }, [activeSurah, activeTab, quranSearchQuery]);

  // --- Real-time Prayer Time Alerts Interval ---
  const lastCheckedAlert = useRef({});
  useEffect(() => {
    const checkTimer = setInterval(() => {
      if (!prayerTimes) return;
      
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const todayStr = now.toDateString();
      
      const targetPrayers = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
      targetPrayers.forEach(pId => {
        const pTime = prayerTimes[pId];
        if (pTime === timeStr && lastCheckedAlert.current[pId] !== todayStr) {
          lastCheckedAlert.current[pId] = todayStr;
          
          let alertLabel = "";
          if (pId === "Fajr") alertLabel = "الفجر";
          else if (pId === "Dhuhr") alertLabel = "الظهر";
          else if (pId === "Asr") alertLabel = "العصر";
          else if (pId === "Maghrib") alertLabel = "المغرب";
          else if (pId === "Isha") alertLabel = "العشاء";
          
          setPrayerAlert({ name: alertLabel, time: pTime });
          triggerHaptic([300, 100, 300, 100, 500]);
          playAlertSound();
          
          try {
            LocalNotifications.schedule({
              notifications: [
                {
                  title: "حان الآن موعد الأذان",
                  body: `نداء صلاة ${alertLabel} بتوقيت ${selectedLocation.name}`,
                  id: pId === "Fajr" ? 1 : pId === "Dhuhr" ? 2 : pId === "Asr" ? 3 : pId === "Maghrib" ? 4 : 5,
                  schedule: { at: new Date(Date.now() + 500) },
                  actionTypeId: "",
                  extra: null
                }
              ]
            }).catch(e => console.log("Failed to schedule local notification:", e));
          } catch (err) {
            console.log("LocalNotifications not available:", err);
          }
          
          setTimeout(() => setPrayerAlert(null), 10000); // Alert banner fades out after 10s
        }
      });
    }, 15000);

    return () => clearInterval(checkTimer);
  }, [prayerTimes, selectedLocation]);

  // --- Next Prayer Timing Calculations ---
  const nextPrayerStats = useMemo(() => {
    if (!prayerTimes) return { name: "غير متوفر", timeRemaining: "--:--" };
    const now = new Date();
    const activePrayers = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
    
    let nextName = "الفجر";
    let nextTimeStr = prayerTimes.Fajr;
    let isNextDay = false;
    let minDiff = Infinity;

    activePrayers.forEach(pId => {
      const [h, m] = prayerTimes[pId].split(":").map(Number);
      const pDate = new Date();
      pDate.setHours(h, m, 0, 0);

      const diff = pDate - now;
      if (diff > 0 && diff < minDiff) {
        minDiff = diff;
        nextTimeStr = prayerTimes[pId];
        if (pId === "Fajr") nextName = "الفجر";
        else if (pId === "Dhuhr") nextName = "الظهر";
        else if (pId === "Asr") nextName = "العصر";
        else if (pId === "Maghrib") nextName = "المغرب";
        else if (pId === "Isha") nextName = "العشاء";
      }
    });

    if (minDiff === Infinity) { // If all prayers today have passed, next is Fajr tomorrow
      const [h, m] = prayerTimes.Fajr.split(":").map(Number);
      const pDate = new Date();
      pDate.setDate(pDate.getDate() + 1);
      pDate.setHours(h, m, 0, 0);
      minDiff = pDate - now;
      nextName = "الفجر";
      nextTimeStr = prayerTimes.Fajr;
      isNextDay = true;
    }

    const totalMin = Math.floor(minDiff / 60000);
    const hrs = Math.floor(totalMin / 60);
    const mins = totalMin % 60;
    
    return {
      name: nextName,
      time: nextTimeStr,
      timeRemaining: `${hrs} ساعة و ${mins} دقيقة`,
      hrs,
      mins
    };
  }, [prayerTimes]);

  // --- Sync next prayer time to Android Widget ---
  useEffect(() => {
    if (nextPrayerStats && nextPrayerStats.name !== "غير متوفر" && nextPrayerStats.time) {
      const formatTime12 = (time24) => {
        const [hStr, mStr] = time24.split(":");
        const h = parseInt(hStr);
        const ampm = h >= 12 ? "م" : "ص";
        const h12 = h % 12 || 12;
        return `${h12}:${mStr} ${ampm}`;
      };

      const formatRemaining = (h, m) => {
        if (h === 0) return `${m} د`;
        return `${h} س و ${m} د`;
      };

      HisnAudio.updateWidget({
        name: nextPrayerStats.name,
        time: formatTime12(nextPrayerStats.time),
        remaining: formatRemaining(nextPrayerStats.hrs || 0, nextPrayerStats.mins || 0)
      }).catch(e => console.log("Failed to update widget:", e));
    }
  }, [nextPrayerStats]);

  // --- GPS Location Geolocator ---
  const detectGPSLocation = () => {
    if (!navigator.geolocation) {
      alert("تحديد الموقع الجغرافي (GPS) غير مدعوم في جهازك.");
      return;
    }

    setLocationStatus("detecting");
    try {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const newLoc = { id: "gps", city: "موقعي الحالي", country: "GPS", name: "الموقع الجغرافي المكتشف", lat, lng, method: 5 };
          setSelectedLocation(newLoc);
          localStorage.setItem("selectedLocation", JSON.stringify(newLoc));
          
          fetchPrayerTimes(lat, lng, newLoc.method, false);
        },
        (err) => {
          console.log("GPS Location Detection Failed:", err);
          alert("تعذر الوصول للموقع الجغرافي. يرجى تفعيل الـ GPS وصلاحية الموقع للجهاز، أو اختيار مدينة من القائمة.");
          setLocationStatus("error");
        },
        { enableHighAccuracy: false, timeout: 15000 }
      );
    } catch (e) {
      console.error("Geolocation exception:", e);
      alert("حدث خطأ أثناء الاتصال بمستشعر الموقع. يرجى اختيار مدينة يدوياً.");
      setLocationStatus("error");
    }
  };

  // --- Hijri Date Conversions ---
  const triggerDateConversion = async () => {
    if (!hijriConvertDate) return;
    const normalized = hijriConvertDate.replace(/\//g, "-");
    const parts = normalized.split("-");
    if (parts.length !== 3) {
      setConvertedHijri("صيغة التاريخ غير صالحة. يرجى التأكد من صحة المدخلات.");
      return;
    }
    
    let formatted = "";
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      formatted = `${parts[2]}-${parts[1]}-${parts[0]}`;
    } else {
      // DD-MM-YYYY
      formatted = `${parts[0]}-${parts[1]}-${parts[2]}`;
    }
    
    try {
      const res = await fetch(`https://api.aladhan.com/v1/gToH/${formatted}`);
      const json = await res.json();
      if (json.code === 200 && json.data) {
        const hijri = json.data.hijri;
        setConvertedHijri(`${hijri.day} ${hijri.month.ar} ${hijri.year} هـ`);
      } else {
        setConvertedHijri("فشل التحويل. الرجاء التأكد من صحة التاريخ.");
      }
    } catch (e) {
      console.log("Hijri conversion request failed:", e);
      setConvertedHijri("فشل الاتصال بالشبكة لإتمام التحويل.");
    }
  };

  // --- Save habit / completion states ---
  const saveState = (updatedCompleted, updatedCounts) => {
    setCompletedItems(updatedCompleted);
    setItemCounts(updatedCounts);
    localStorage.setItem("completedItems", JSON.stringify(updatedCompleted));
    localStorage.setItem("itemCounts", JSON.stringify(updatedCounts));
    checkDailyStreak(updatedCompleted);
  };

  const checkDailyStreak = (completed) => {
    const today = new Date().toDateString();
    if (lastCompletedDate === today) return;

    const quranicDone = adhkarData.quranic.every(item => completed[item.id]);
    const morningDone = adhkarData.morning.every(item => completed[item.id]);
    const eveningDone = adhkarData.evening.every(item => completed[item.id]);

    if (quranicDone && (morningDone || eveningDone)) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setLastCompletedDate(today);
      localStorage.setItem("streak", newStreak.toString());
      localStorage.setItem("lastCompletedDate", today);
      triggerHaptic([100, 50, 100]);
    }
  };

  // --- Time-Based Adhkar Notifications with Repeats ---
  const scheduleAdhkarNotifications = async () => {
    try {
      const pending = await LocalNotifications.getPending();
      const idsToCancel = pending.notifications
        .map(n => n.id)
        .filter(id => id >= 1000 && id < 4000);
      
      if (idsToCancel.length > 0) {
        await LocalNotifications.cancel({ notifications: idsToCancel.map(id => ({ id })) });
      }

      const morningDone = adhkarData.morning.every(item => completedItems[item.id]);
      const eveningDone = adhkarData.evening.every(item => completedItems[item.id]);
      const sleepDone = adhkarData.sleep.every(item => completedItems[item.id]);

      const now = new Date();
      const todayDate = now.getDate();
      const todayMonth = now.getMonth();
      const todayYear = now.getFullYear();

      const notifications = [];

      const scheduleCategory = (categoryKey, done, times, title, body, baseId) => {
        if (done) return;
        times.forEach((t, index) => {
          const targetTime = new Date(todayYear, todayMonth, todayDate, t.hour, t.minute, 0);
          if (targetTime.getTime() > now.getTime()) {
            notifications.push({
              title,
              body,
              id: baseId + index,
              schedule: { at: targetTime },
              sound: "beep.wav",
              actionTypeId: "",
              extra: null
            });
          }
        });
      };

      // Morning reminders: 7:00 AM to 10:00 AM, every 30 mins
      const morningTimes = [
        { hour: 7, minute: 0 },
        { hour: 7, minute: 30 },
        { hour: 8, minute: 0 },
        { hour: 8, minute: 30 },
        { hour: 9, minute: 0 },
        { hour: 9, minute: 30 },
        { hour: 10, minute: 0 }
      ];
      scheduleCategory("morning", morningDone, morningTimes, "أذكار الصباح ☀️", "لم تقم بقراءة أذكار الصباح اليوم، اضغط لقراءتها وتحصين نفسك.", 1000);

      // Evening reminders: 4:30 PM to 7:30 PM, every 30 mins
      const eveningTimes = [
        { hour: 16, minute: 30 },
        { hour: 17, minute: 0 },
        { hour: 17, minute: 30 },
        { hour: 18, minute: 0 },
        { hour: 18, minute: 30 },
        { hour: 19, minute: 0 },
        { hour: 19, minute: 30 }
      ];
      scheduleCategory("evening", eveningDone, eveningTimes, "أذكار المساء 🌙", "حان وقت أذكار المساء وحفظ نفسك، اضغط لقراءتها.", 2000);

      // Sleep reminders: 10:00 PM to 12:00 AM, every 30 mins
      const sleepTimes = [
        { hour: 22, minute: 0 },
        { hour: 22, minute: 30 },
        { hour: 23, minute: 0 },
        { hour: 23, minute: 30 },
        { hour: 0, minute: 0 }
      ];
      scheduleCategory("sleep", sleepDone, sleepTimes, "أذكار النوم 🛌", "تذكير بقراءة أذكار النوم قبل النوم ليلة هانئة ومحمية.", 3000);

      // Schedule next 5 future days
      for (let dayOffset = 1; dayOffset <= 5; dayOffset++) {
        const futureDate = new Date(todayYear, todayMonth, todayDate + dayOffset);
        const fDay = futureDate.getDate();
        const fMonth = futureDate.getMonth();
        const fYear = futureDate.getFullYear();

        notifications.push({
          title: "أذكار الصباح ☀️",
          body: "صباح الخير! ابدأ يومك بذكر الله وحصن نفسك.",
          id: 1100 + dayOffset,
          schedule: { at: new Date(fYear, fMonth, fDay, 7, 0, 0) }
        });
        notifications.push({
          title: "أذكار الصباح ☀️",
          body: "تذكير بقراءة أذكار الصباح قبل فوات وقتها.",
          id: 1200 + dayOffset,
          schedule: { at: new Date(fYear, fMonth, fDay, 8, 0, 0) }
        });

        notifications.push({
          title: "أذكار المساء 🌙",
          body: "حان وقت أذكار المساء وحفظ نفسك، اضغط لقراءتها.",
          id: 2100 + dayOffset,
          schedule: { at: new Date(fYear, fMonth, fDay, 16, 30, 0) }
        });
        notifications.push({
          title: "أذكار المساء 🌙",
          body: "تذكير بقراءة أذكار المساء لحفظ يومك.",
          id: 2200 + dayOffset,
          schedule: { at: new Date(fYear, fMonth, fDay, 17, 30, 0) }
        });

        notifications.push({
          title: "أذكار النوم 🛌",
          body: "حان وقت أذكار النوم ليلة هانئة ومحمية.",
          id: 3100 + dayOffset,
          schedule: { at: new Date(fYear, fMonth, fDay, 22, 0, 0) }
        });
      }

      if (notifications.length > 0) {
        await LocalNotifications.schedule({ notifications });
      }
    } catch (err) {
      console.log("LocalNotifications scheduling failed:", err);
    }
  };

  useEffect(() => {
    scheduleAdhkarNotifications();
  }, [completedItems]);

  // --- Tap counts decrement --
  const handleItemTap = (itemId, targetCount) => {
    triggerHaptic(50);
    const current = itemCounts[itemId] !== undefined ? itemCounts[itemId] : targetCount;

    if (current <= 1) {
      const newCompleted = { ...completedItems, [itemId]: true };
      const newCounts = { ...itemCounts, [itemId]: 0 };
      saveState(newCompleted, newCounts);
      triggerHaptic([85, 45, 85]);
    } else {
      const newCounts = { ...itemCounts, [itemId]: current - 1 };
      saveState(completedItems, newCounts);
    }
  };

  const handleResetItem = (itemId) => {
    triggerHaptic(40);
    const newCompleted = { ...completedItems };
    delete newCompleted[itemId];
    const newCounts = { ...itemCounts };
    delete newCounts[itemId];
    saveState(newCompleted, newCounts);
  };

  const handleResetSection = (sectionName, type = "adhkar") => {
    triggerHaptic([100, 100]);
    const newCompleted = { ...completedItems };
    const newCounts = { ...itemCounts };

    let items = [];
    if (type === "ruqyah" || type === "treatment") {
      items = fullWrittenRuqyah;
    } else if (type === "quranic") {
      items = adhkarData.quranic;
    } else {
      items = adhkarData[sectionName];
    }

    items.forEach(item => {
      delete newCompleted[item.id];
      delete newCounts[item.id];
    });
    saveState(newCompleted, newCounts);
  };

  // --- Reset Entire App data ---
  const handleFullReset = () => {
    localStorage.clear();
    setCompletedItems({});
    setItemCounts({});
    setStreak(0);
    setLastCompletedDate("");
    setPrayerLog({});
    setQuranBookmark(null);
    setTasbihCount(0);
    setTasbihTotal(0);
    setFontSize(18);
    setThemeMode("system");
    setShowResetModal(false);
    triggerHaptic([200, 100, 200]);
    alert("تم إعادة تهيئة جميع البيانات بنجاح!");
  };

  // --- Overall progression ratios ---
  const progressStats = useMemo(() => {
    const getProgress = (name) => {
      const items = adhkarData[name];
      if (!items || items.length === 0) return 0;
      const done = items.filter(item => completedItems[item.id]).length;
      return Math.round((done / items.length) * 100);
    };

    const getRuqyahProgress = () => {
      const done = unifiedRuqyahSteps.filter(item => completedItems[item.id]).length;
      return Math.round((done / unifiedRuqyahSteps.length) * 100);
    };

    const quranic = getProgress("quranic");
    const morning = getProgress("morning");
    const evening = getProgress("evening");
    const sleep = getProgress("sleep");
    const study = getProgress("study");
    const ruqyah = getRuqyahProgress();

    const totalItems = adhkarData.quranic.length + adhkarData.morning.length + 
                       adhkarData.evening.length + adhkarData.sleep.length + 
                       adhkarData.study.length + unifiedRuqyahSteps.length;

    const doneCount = Object.keys(completedItems).filter(k => completedItems[k]).length;
    const overall = totalItems > 0 ? Math.round((doneCount / totalItems) * 100) : 0;

    return { quranic, morning, evening, sleep, study, ruqyah, overall, totalItems, doneCount };
  }, [completedItems]);

  // --- Audio core methods ---
  const cleanupAudio = () => {
    setIsAudioBuffering(false);
    if (audioRef.current) {
      const old = audioRef.current;
      audioRef.current = null;
      old.pause();
      old.ontimeupdate = null;
      old.onloadedmetadata = null;
      old.onerror = null;
      old.onended = null;
      old.src = "";
      try { old.load(); } catch (_) {}
    }
    HisnAudio.stopService().catch(e => console.log("Service stop failed", e));
  };

  const playTrack = (index) => {
    if (index === null || index < 0 || index >= playlist.length) return;

    if (currentTrackIndex === index && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        HisnAudio.stopService().catch(e => console.log(e));
      } else {
        audioRef.current.play()
          .then(() => {
            setIsPlaying(true);
            HisnAudio.startService({ title: playlist[index].name, artist: "الرقية المسموعة" }).catch(e => console.log(e));
          })
          .catch(e => console.log("Play error:", e));
      }
      return;
    }

    cleanupAudio();
    setCurrentTrackIndex(index);
    setCurrentTime(0);
    setDuration(0);
    setActiveRadioStation(null);
    setRadioError(null);
    setAudioError(null);

    const newAudio = new Audio(`https://server8.mp3quran.net/afs/${playlist[index].file}`);
    audioRef.current = newAudio;
    setIsAudioBuffering(true);

    newAudio.addEventListener("timeupdate", () => {
      if (audioRef.current !== newAudio) return;
      setCurrentTime(newAudio.currentTime);
    });
    newAudio.addEventListener("loadedmetadata", () => {
      if (audioRef.current !== newAudio) return;
      setDuration(newAudio.duration);
    });
    newAudio.addEventListener("waiting", () => {
      if (audioRef.current === newAudio) setIsAudioBuffering(true);
    });
    newAudio.addEventListener("playing", () => {
      if (audioRef.current === newAudio) setIsAudioBuffering(false);
    });
    newAudio.addEventListener("canplay", () => {
      if (audioRef.current === newAudio) setIsAudioBuffering(false);
    });
    newAudio.addEventListener("loadstart", () => {
      if (audioRef.current === newAudio) setIsAudioBuffering(true);
    });
    newAudio.addEventListener("ended", () => {
      if (audioRef.current !== newAudio) return;
      setIsAudioBuffering(false);
      if (loopPlaylistRef.current) {
        const next = (index + 1) % playlist.length;
        playTrackRef.current(next);
      } else {
        setIsPlaying(false);
        HisnAudio.stopService().catch(e => console.log(e));
      }
    });
    newAudio.onerror = () => {
      if (audioRef.current !== newAudio) return;
      setIsPlaying(false);
      setIsAudioBuffering(false);
      setAudioError(`تعذّر تشغيل: ${playlist[index].name}`);
      HisnAudio.stopService().catch(e => console.log(e));
    };

    newAudio.play()
      .then(() => {
        if (audioRef.current === newAudio) {
          setIsPlaying(true);
          HisnAudio.startService({ title: playlist[index].name, artist: "الرقية المسموعة" }).catch(e => console.log(e));
        }
      })
      .catch(e => {
        console.log("Play rejected:", e);
        if (audioRef.current === newAudio) {
          setIsPlaying(false);
          HisnAudio.stopService().catch(e => console.log(e));
        }
      });
    triggerHaptic(60);
  };

  useEffect(() => { playTrackRef.current = playTrack; });

  const playRadio = (station) => {
    setCurrentTrackIndex(null);

    if (activeRadioStation?.id === station.id && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        HisnAudio.stopService().catch(e => console.log(e));
      } else {
        setIsPlaying(true);
        audioRef.current.play()
          .then(() => {
            setIsPlaying(true);
            HisnAudio.startService({ title: station.name, artist: "البث المباشر" }).catch(e => console.log(e));
          })
          .catch(e => {
            console.log("Radio play error:", e);
            setIsPlaying(false);
            HisnAudio.stopService().catch(e => console.log(e));
          });
      }
      return;
    }

    cleanupAudio();
    setActiveRadioStation(station);
    setIsPlaying(false);
    setRadioError(null);
    setAudioError(null);
    setIsAudioBuffering(true);

    const audio = new Audio(station.url);
    audioRef.current = audio;

    audio.addEventListener("waiting", () => {
      if (audioRef.current === audio) setIsAudioBuffering(true);
    });
    audio.addEventListener("playing", () => {
      if (audioRef.current === audio) setIsAudioBuffering(false);
    });
    audio.addEventListener("canplay", () => {
      if (audioRef.current === audio) setIsAudioBuffering(false);
    });
    audio.addEventListener("loadstart", () => {
      if (audioRef.current === audio) setIsAudioBuffering(true);
    });

    audio.onerror = () => {
      if (audioRef.current !== audio) return;
      setIsPlaying(false);
      setIsAudioBuffering(false);
      setRadioError(`تعذّر تشغيل الراديو: ${station.name}`);
      HisnAudio.stopService().catch(e => console.log(e));
    };

    audio.play()
      .then(() => {
        if (audioRef.current === audio) {
          setIsPlaying(true);
          setIsAudioBuffering(false);
          HisnAudio.startService({ title: station.name, artist: "البث المباشر" }).catch(e => console.log(e));
        }
      })
      .catch(e => {
        console.log("Radio play rejected:", e);
        if (audioRef.current === audio) {
          setIsPlaying(false);
          setIsAudioBuffering(false);
          setRadioError(`تعذّر تشغيل الراديو: ${station.name}`);
          HisnAudio.stopService().catch(e => console.log(e));
        }
      });
    triggerHaptic(60);
  };

  const togglePlay = () => {
    if (activeRadioStation) {
      playRadio(activeRadioStation);
    } else if (currentTrackIndex !== null) {
      playTrack(currentTrackIndex);
    } else {
      playTrack(0);
    }
  };

  const nextTrack = () => {
    if (currentTrackIndex === null) {
      playTrack(0);
    } else {
      playTrack((currentTrackIndex + 1) % playlist.length);
    }
  };

  const prevTrack = () => {
    if (currentTrackIndex === null) {
      playTrack(playlist.length - 1);
    } else {
      playTrack((currentTrackIndex - 1 + playlist.length) % playlist.length);
    }
  };

  // --- Native Notification Event Listeners Sync ---
  useEffect(() => {
    let playSub, pauseSub, stopSub, nextSub, prevSub;

    const setupListeners = async () => {
      try {
        playSub = await HisnAudio.addListener("mediaPlay", () => {
          console.log("JS: Native play action triggered");
          if (audioRef.current && audioRef.current.paused) {
            audioRef.current.play()
              .then(() => setIsPlaying(true))
              .catch(e => console.log(e));
          }
        });

        pauseSub = await HisnAudio.addListener("mediaPause", () => {
          console.log("JS: Native pause action triggered");
          if (audioRef.current && !audioRef.current.paused) {
            audioRef.current.pause();
            setIsPlaying(false);
          }
        });

        stopSub = await HisnAudio.addListener("mediaStop", () => {
          console.log("JS: Native stop action triggered");
          cleanupAudio();
          setIsPlaying(false);
        });

        nextSub = await HisnAudio.addListener("mediaNext", () => {
          console.log("JS: Native next action triggered");
          nextTrack();
        });

        prevSub = await HisnAudio.addListener("mediaPrev", () => {
          console.log("JS: Native prev action triggered");
          prevTrack();
        });
      } catch (e) {
        console.error("Failed to setup HisnAudio notification listeners:", e);
      }
    };

    setupListeners();

    return () => {
      if (playSub) playSub.remove();
      if (pauseSub) pauseSub.remove();
      if (stopSub) stopSub.remove();
      if (nextSub) nextSub.remove();
      if (prevSub) prevSub.remove();
    };
  }, [currentTrackIndex, activeRadioStation]);

  const formatTime = (timeSec) => {
    const m = Math.floor(timeSec / 60);
    const s = Math.floor(timeSec % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  // --- Tasbih Tap Counter ---
  const handleTasbihTap = () => {
    triggerHaptic(50);
    const nextCount = tasbihCount + 1;
    const nextTotal = tasbihTotal + 1;
    setTasbihCount(nextCount);
    setTasbihTotal(nextTotal);
    localStorage.setItem("tasbihTotal", nextTotal.toString());

    if (nextCount === tasbihTarget) {
      triggerHaptic([150, 80, 150]);
    }
  };

  // --- Quran Bookmarking ---
  const saveQuranBookmark = (surahNum, ayahNum, surahName) => {
    const newBookmark = { surahNum, ayahNum, surahName };
    setQuranBookmark(newBookmark);
    localStorage.setItem("quranBookmark", JSON.stringify(newBookmark));
    triggerHaptic(75);
  };

  const handleResumeReading = (bookmark) => {
    if (bookmark) {
      setActiveSurah(bookmark.surahNum);
      setActiveTab("quran");
      setTimeout(() => {
        const element = document.getElementById(`ayah-${bookmark.surahNum}-${bookmark.ayahNum}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 300);
    }
  };

  // --- Toggle Prayer checked logs ---
  const togglePrayerState = (prayerId) => {
    triggerHaptic(45);
    const dateRecord = prayerLog[todayKey] || {};
    const updated = {
      ...prayerLog,
      [todayKey]: {
        ...dateRecord,
        [prayerId]: !dateRecord[prayerId]
      }
    };
    setPrayerLog(updated);
    localStorage.setItem("prayerLog", JSON.stringify(updated));
  };

  const adjustQiyamValue = (delta) => {
    triggerHaptic(30);
    const dateRecord = prayerLog[todayKey] || {};
    const currentQiyam = dateRecord.qiyam || 0;
    const nextQiyam = Math.max(0, Math.min(40, currentQiyam + delta));
    const updated = {
      ...prayerLog,
      [todayKey]: {
        ...dateRecord,
        qiyam: nextQiyam
      }
    };
    setPrayerLog(updated);
    localStorage.setItem("prayerLog", JSON.stringify(updated));
  };

  const todayRecord = useMemo(() => prayerLog[todayKey] || {}, [prayerLog, todayKey]);
  const loggedPrayersCount = useMemo(() => {
    return dailyPrayers.filter(p => todayRecord[p.id]).length;
  }, [todayRecord]);

  const last7DaysData = useMemo(() => {
    const arabicDays = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const key = d.toDateString();
      const rec = prayerLog[key] || {};
      const count = dailyPrayers.filter(p => rec[p.id]).length;
      return {
        key,
        dayName: arabicDays[d.getDay()],
        count,
        isToday: key === todayKey,
        qiyam: rec.qiyam || 0
      };
    });
  }, [prayerLog, todayKey]);

  // --- Filtering Quran Surahs ---
  const filteredSurahs = useMemo(() => {
    if (quranSurahs.length === 0) return [];
    const query = cleanArabicText(quranSearchQuery.trim());
    if (!query) return quranSurahs;
    return quranSurahs.filter(s => {
      return cleanArabicText(s.name).includes(query) || 
             s.englishName.toLowerCase().includes(query.toLowerCase()) ||
             s.number.toString() === query;
    });
  }, [quranSearchQuery, quranSurahs]);

  // --- Circle progress coordinates offset ---
  const circularStrokeOffset = useMemo(() => {
    const radius = 58;
    const circumference = 2 * Math.PI * radius;
    return circumference * (1 - progressStats.overall / 100);
  }, [progressStats.overall]);

  const lunarIcon = useMemo(() => {
    const cycle = streak % 30;
    const icons = ["🌑", "🌒", "🌒", "🌒", "🌓", "🌓", "🌓", "🌓", "🌔", "🌔", "🌔", "🌔", "🌕", "🌕", "🌕", "🌕", "🌕", "🌕", "🌕", "🌖", "🌖", "🌖", "🌖", "🌗", "🌗", "🌗", "🌗", "🌘", "🌘", "🌘"];
    return icons[cycle] || "🌑";
  }, [streak]);

  const lunarName = useMemo(() => {
    const cycle = streak % 30;
    if (cycle === 0) return "محاق (بداية جديدة)";
    if (cycle >= 1 && cycle <= 3) return "هلال أول الشهر";
    if (cycle >= 4 && cycle <= 7) return "تربيع أول";
    if (cycle >= 8 && cycle <= 11) return "أحدب متزايد";
    if (cycle >= 12 && cycle <= 18) return "بدر مكتمل";
    if (cycle >= 19 && cycle <= 22) return "أحدب متناقص";
    if (cycle >= 23 && cycle <= 26) return "تربيع أخير";
    return "هلال آخر الشهر";
  }, [streak]);

  return (
    <div className="flex flex-col min-h-screen pb-24 select-none bg-white dark:bg-[#0e0e10] text-[#121214] dark:text-[#f4f4f5] transition-colors duration-300">
      
      {/* --- PRAYER REAL-TIME ALERTS BANNER --- */}
      {prayerAlert && (
        <div className="fixed top-4 left-4 right-4 z-50 bg-neutral-900/95 dark:bg-[#16161a]/95 backdrop-blur-md border border-neutral-800 dark:border-neutral-700/80 rounded-2xl p-4 shadow-2xl flex items-center gap-4 animate-fade-slide-in">
          <div className="w-10 h-10 rounded-full bg-white/10 dark:bg-white/10 flex items-center justify-center text-amber-500 animate-pulse">
            <Clock className="w-5 h-5" />
          </div>
          <div className="flex-1 text-right">
            <h4 className="text-sm font-black text-white font-naskh">حان الآن موعد الأذان</h4>
            <p className="text-xs text-neutral-450 dark:text-neutral-450 font-naskh mt-0.5">نداء صلاة {prayerAlert.name} بتوقيت {selectedLocation.name}</p>
          </div>
          <button onClick={() => setPrayerAlert(null)} className="text-white hover:opacity-85">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* --- HEADER --- */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#0e0e10]/90 backdrop-blur-md border-b border-neutral-100 dark:border-neutral-900 px-6 py-4 flex items-center justify-between transition-colors duration-300">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-black dark:bg-white flex items-center justify-center text-white dark:text-black">
            <Sparkles className="w-4.5 h-4.5" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight select-none">حصن المسلم</h1>
            <p className="text-[9px] text-neutral-400 dark:text-neutral-500 font-bold -mt-0.5">رفيقك اليومي للعبادة</p>
          </div>
        </div>

        {/* Global Mini Hijri Date Indicator */}
        {hijriDate && (
          <div className="hidden sm:flex items-center gap-1.5 bg-neutral-50 dark:bg-[#16161a] border border-neutral-150 dark:border-neutral-800 px-3 py-1 rounded-full text-[10px] font-bold font-naskh">
            <Calendar className="w-3.5 h-3.5 text-neutral-400" />
            <span>{hijriDate.weekdayAr}، {hijriDate.day} {hijriDate.monthNameAr} {hijriDate.year} هـ</span>
          </div>
        )}

        {/* Quick Theme Toggle */}
        <button 
          onClick={() => { setThemeMode(themeMode === "light" ? "dark" : "light"); triggerHaptic(30); }}
          className="p-2 rounded-xl bg-neutral-50 dark:bg-[#16161a] border border-neutral-150 dark:border-neutral-800 text-neutral-500 hover:text-black dark:hover:text-white clickable"
        >
          {themeMode === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>
      </header>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 max-w-lg mx-auto w-full px-6 py-6 overflow-y-auto no-scrollbar">

        {/* =======================================
            1. TAB: DASHBOARD (الرئيسية)
            ======================================= */}
        {activeTab === "dashboard" && (
          <div className="space-y-6 animate-fade-slide-in">
            {/* Time-based Greeting & Hijri Display */}
            <div className="bg-gradient-to-r from-neutral-50 to-neutral-100 dark:from-[#16161a] dark:to-[#121214] border border-neutral-200 dark:border-neutral-850 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-0.5 text-right">
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-bold font-naskh">طاب يومك بذكر الله</span>
                  <h2 className="text-base font-extrabold text-neutral-900 dark:text-neutral-50 font-naskh">السلام عليكم ورحمة الله</h2>
                </div>
                {hijriDate ? (
                  <span className="text-[10px] font-black bg-black dark:bg-white text-white dark:text-black px-3 py-1 rounded-full font-naskh shadow-sm">
                    {hijriDate.day} {hijriDate.monthNameAr} {hijriDate.year} هـ
                  </span>
                ) : (
                  <span className="text-[10px] font-black bg-neutral-200 dark:bg-neutral-850 px-3 py-1 rounded-full">-- -- هـ</span>
                )}
              </div>

              {/* Next Prayer Banner */}
              {prayerTimes && (
                <div className="flex items-center justify-between bg-white dark:bg-[#0e0e10] border border-neutral-150 dark:border-neutral-800 rounded-2xl p-4 shadow-inner">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-neutral-50 dark:bg-[#16161a] border border-neutral-150 dark:border-neutral-800 flex items-center justify-center text-amber-500">
                      <Clock className="w-4.5 h-4.5" />
                    </div>
                    <div className="text-right">
                      <h4 className="text-xs font-black text-neutral-800 dark:text-neutral-200 font-naskh">الصلاة القادمة: {nextPrayerStats.name}</h4>
                      <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-bold font-naskh mt-0.5">المتبقي: {nextPrayerStats.timeRemaining}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 font-mono bg-neutral-50 dark:bg-[#16161a] px-3 py-1 rounded-lg border border-neutral-150 dark:border-neutral-800">
                    {nextPrayerStats.time}
                  </span>
                </div>
              )}
            </div>

            {/* Circular Progress & Quick Stats grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Daily Progress Orbit */}
              <div className="col-span-1 bg-neutral-50 dark:bg-[#16161a] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-4 shadow-sm flex flex-col items-center justify-center text-center gap-3">
                <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold font-naskh">اكتمال التحصين</span>
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
                    <circle cx="64" cy="64" r="58" className="stroke-neutral-100 dark:stroke-neutral-850 fill-none" strokeWidth="6" />
                    <circle 
                      cx="64" cy="64" r="58" 
                      className="stroke-black dark:stroke-white fill-none transition-all duration-500 ease-out" 
                      strokeWidth="6" 
                      strokeDasharray={2 * Math.PI * 58} 
                      strokeDashoffset={circularStrokeOffset} 
                      strokeLinecap="round" 
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xl font-black text-neutral-900 dark:text-neutral-50 font-sans">{progressStats.overall}%</span>
                    <span className="text-[8px] text-neutral-400 dark:text-neutral-500 font-bold font-naskh">إنجاز اليوم</span>
                  </div>
                </div>
              </div>

              {/* Vertical Side Cards (Streak & Prayers Orbit) */}
              <div className="col-span-1 flex flex-col gap-4">
                {/* Streak card */}
                <div className="flex-1 bg-neutral-50 dark:bg-[#16161a] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-4 shadow-sm flex flex-col justify-between items-center text-center">
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold font-naskh">الاستقامة المتتالية</span>
                  <div className="text-2xl">{lunarIcon}</div>
                  <div className="text-right w-full flex flex-col items-center">
                    <span className="text-sm font-black text-neutral-900 dark:text-neutral-50">{streak} يوم</span>
                    <span className="text-[8px] text-neutral-400 dark:text-neutral-500 font-bold font-naskh mt-0.5">{lunarName}</span>
                  </div>
                </div>

                {/* Prayers tracker mini card */}
                <button 
                  onClick={() => { setActiveTab("utilities"); setActiveUtilitiesSubTab("prayers"); triggerHaptic(30); }}
                  className="flex-1 bg-neutral-50 dark:bg-[#16161a] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-4 shadow-sm flex flex-col justify-between items-center text-center active:scale-97 transition-transform clickable"
                >
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold font-naskh">تعقب الصلوات</span>
                  <div className="text-lg">🕋</div>
                  <div className="text-right w-full flex flex-col items-center">
                    <span className="text-sm font-black text-neutral-900 dark:text-neutral-50">{loggedPrayersCount} من 5</span>
                    <span className="text-[8px] text-neutral-400 dark:text-neutral-500 font-bold font-naskh mt-0.5">صلاة مؤداة اليوم</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Quick Links Cards */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-neutral-400 dark:text-neutral-500 font-naskh uppercase tracking-wide">الورد والتحصين السريع</h3>
              <div className="grid grid-cols-3 gap-3">
                <button 
                  onClick={() => { setActiveTab("shield"); setActiveShieldSubTab("adhkar"); triggerHaptic(30); }}
                  className="bg-neutral-50 dark:bg-[#16161a] border border-neutral-150 dark:border-neutral-850 rounded-2xl p-3 text-center space-y-2 active:scale-95 transition-transform clickable"
                >
                  <div className="text-lg">☀️</div>
                  <h4 className="text-[10px] font-black text-neutral-800 dark:text-neutral-100 font-naskh">أذكار المسلم</h4>
                </button>
                
                <button 
                  onClick={() => { setActiveTab("shield"); setActiveShieldSubTab("ruqyah"); triggerHaptic(30); }}
                  className="bg-neutral-50 dark:bg-[#16161a] border border-neutral-150 dark:border-neutral-850 rounded-2xl p-3 text-center space-y-2 active:scale-95 transition-transform clickable"
                >
                  <div className="text-lg">🛡️</div>
                  <h4 className="text-[10px] font-black text-neutral-800 dark:text-neutral-100 font-naskh">الرقية الشرعية</h4>
                </button>

                <button 
                  onClick={() => { setActiveTab("shield"); setActiveShieldSubTab("radio"); triggerHaptic(30); }}
                  className="bg-neutral-50 dark:bg-[#16161a] border border-neutral-150 dark:border-neutral-850 rounded-2xl p-3 text-center space-y-2 active:scale-95 transition-transform clickable"
                >
                  <div className="text-lg">📻</div>
                  <h4 className="text-[10px] font-black text-neutral-800 dark:text-neutral-100 font-naskh">راديو القرآن</h4>
                </button>
              </div>
            </div>

            {/* Random Reminder Card */}
            <div className="bg-neutral-50 dark:bg-[#16161a] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 shadow-sm space-y-3 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-24 h-24 bg-amber-500/5 rounded-full -translate-x-10 -translate-y-10" />
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-[10px] font-black text-amber-700 dark:text-amber-450 font-naskh">تذكرة اليوم</span>
              </div>
              <p className="text-xs font-bold leading-relaxed text-neutral-800 dark:text-neutral-200 font-naskh select-text">
                {randomReminder}
              </p>
              <div className="flex justify-end mt-2">
                <button 
                  onClick={() => {
                    const idx = Math.floor(Math.random() * dailyReminders.length);
                    setRandomReminder(dailyReminders[idx]);
                    triggerHaptic(30);
                  }}
                  className="text-[9px] font-black text-neutral-500 hover:text-black dark:hover:text-white font-naskh underline decoration-dotted"
                >
                  عرض تذكرة أخرى
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =======================================
            2. TAB: QURAN (المصحف الشريف)
            ======================================= */}
        {activeTab === "quran" && (
          <div className="space-y-6 animate-fade-slide-in">
            {isQuranLoading || quranSurahs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                <div className="w-8 h-8 border-3 border-neutral-200 border-t-emerald-500 rounded-full animate-spin" />
                <p className="text-xs font-bold text-neutral-500 dark:text-neutral-450 font-naskh">جاري تحميل المصحف الشريف...</p>
              </div>
            ) : (
              <>
                {!activeSurah ? (
              // --- INDEX VIEW ---
              <div className="space-y-4">
                <div className="space-y-1 text-right">
                  <h2 className="text-base font-extrabold font-naskh">المصحف الشريف</h2>
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-naskh">اقرأ آيات كتاب الله ميسرة مع الحفظ والبحث الفوري</p>
                </div>

                {/* Bookmark Resume */}
                {quranBookmark && (
                  <div className="bg-amber-500/5 dark:bg-amber-500/5 border border-amber-500/20 dark:border-amber-500/10 rounded-2xl p-4 flex items-center justify-between shadow-sm animate-pulse-subtle">
                    <div className="space-y-1 text-right">
                      <span className="text-[8px] font-black bg-amber-500/10 text-amber-700 dark:text-amber-450 px-2 py-0.5 rounded-full font-naskh">واصل القراءة</span>
                      <h4 className="text-xs font-black text-neutral-800 dark:text-neutral-250 font-naskh">سورة {quranBookmark.surahName} • الآية {quranBookmark.ayahNum}</h4>
                    </div>
                    <button 
                      onClick={() => handleResumeReading(quranBookmark)}
                      className="px-4 py-2 bg-amber-600 text-white dark:bg-amber-500 dark:text-black rounded-xl text-[10px] font-black font-naskh shadow-sm hover:opacity-90 active:scale-95 transition-all clickable"
                    >
                      متابعة القراءة
                    </button>
                  </div>
                )}

                {/* Search Bar */}
                <div className="relative">
                  <input 
                    type="text"
                    value={quranSearchQuery}
                    onChange={(e) => setQuranSearchQuery(e.target.value)}
                    placeholder="ابحث عن اسم السورة أو آية معيّنة..."
                    className="w-full pl-10 pr-4 py-3.5 bg-neutral-50 dark:bg-[#16161a] border border-neutral-200 dark:border-neutral-800 rounded-2xl text-xs font-bold font-naskh focus:outline-none focus:border-neutral-500 transition-colors"
                  />
                  {quranSearchQuery && (
                    <button onClick={() => setQuranSearchQuery("")} className="absolute left-3 top-3.5 text-neutral-400 hover:text-black dark:hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Results vs List */}
                {quranSearchQuery.trim().length >= 3 ? (
                  // Search Results
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 font-naskh">نتائج البحث ({quranSearchResults.length})</h3>
                      {isSearching && <div className="w-3.5 h-3.5 border-2 border-neutral-200 border-t-emerald-500 rounded-full animate-spin" />}
                    </div>
                    {quranSearchResults.length > 0 ? (
                      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                        {quranSearchResults.map((res, idx) => (
                          <button 
                            key={idx}
                            onClick={() => {
                              pendingScroll.current = res.ayahNum;
                              setActiveSurah(res.surahNum);
                              setQuranSearchQuery("");
                              triggerHaptic(50);
                            }}
                            className="w-full bg-neutral-50 dark:bg-[#16161a] border border-neutral-150 dark:border-neutral-800 rounded-2xl p-4 text-right space-y-2 active:scale-98 transition-transform block clickable"
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] font-black text-neutral-400 dark:text-neutral-500 font-naskh">سورة {res.surahName} • الآية {res.ayahNum}</span>
                            </div>
                            <p className="text-xs font-bold leading-loose text-neutral-800 dark:text-neutral-150 font-amiri select-text">{res.text}</p>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-neutral-450 dark:text-neutral-500 text-xs font-naskh">لم نجد آيات مطابقة للبحث.</div>
                    )}
                  </div>
                ) : (
                  // Surah List View
                  <div className="grid grid-cols-1 gap-2.5 max-h-[600px] overflow-y-auto pr-1">
                    {filteredSurahs.map(surah => (
                      <button 
                        key={surah.number}
                        onClick={() => { setActiveSurah(surah.number); triggerHaptic(40); }}
                        className="bg-neutral-50 dark:bg-[#16161a] hover:bg-neutral-100/50 dark:hover:bg-[#1b1b22] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 flex items-center justify-between active:scale-99 transition-all clickable"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-850 flex items-center justify-center text-xs font-black text-neutral-550 dark:text-neutral-400 font-sans">
                            {surah.number}
                          </span>
                          <div className="text-right">
                            <h4 className="text-xs font-black text-neutral-850 dark:text-neutral-100 font-naskh">{surah.name}</h4>
                            <span className="text-[9px] font-bold text-neutral-400 dark:text-neutral-500 font-naskh">{surah.revelationType} • {surah.ayahs.length} آية</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 font-mono font-bold tracking-wider">{surah.englishName}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // --- READER VIEW ---
              (() => {
                if (isActiveSurahLoading || !activeSurahData) {
                  return (
                    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                      <div className="w-8 h-8 border-3 border-neutral-200 border-t-emerald-500 rounded-full animate-spin" />
                      <p className="text-xs font-bold text-neutral-500 dark:text-neutral-450 font-naskh">جاري تحميل السورة الكريمة...</p>
                    </div>
                  );
                }
                const surah = activeSurahData;
                return (
                  <div className="space-y-6 animate-fade-slide-in">
                    {/* Header Controls */}
                    <div className="flex justify-between items-center bg-neutral-50 dark:bg-[#16161a] border border-neutral-200 dark:border-neutral-800 rounded-2xl px-4 py-3">
                      <button 
                        onClick={() => { setActiveSurah(null); triggerHaptic(30); }}
                        className="px-3 py-1.5 text-[10px] font-black text-neutral-500 hover:text-black dark:hover:text-white bg-white dark:bg-[#0e0e10] border border-neutral-150 dark:border-neutral-850 rounded-xl font-naskh transition-all clickable"
                      >
                        العودة للفهرس
                      </button>
                      <div className="text-center">
                        <h3 className="text-xs font-black font-naskh">{surah.name}</h3>
                        <span className="text-[9px] font-bold text-neutral-400 dark:text-neutral-500 font-naskh">{surah.revelationType} • {surah.ayahs.length} آية</span>
                      </div>
                      {/* Read Mode Spacer */}
                      <div className="w-[80px]" />
                    </div>

                    {/* Font Adjuster & Info */}
                    <div className="flex items-center justify-between gap-4 bg-neutral-50 dark:bg-[#16161a] border border-neutral-200 dark:border-neutral-850 rounded-2xl p-4">
                      <span className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 font-naskh">حجم الخط</span>
                      <div className="flex items-center gap-2 flex-1 max-w-[150px]">
                        <button onClick={() => setFontSize(Math.max(14, fontSize - 2))} className="p-1 rounded bg-neutral-200 dark:bg-neutral-800"><Minus className="w-3.5 h-3.5" /></button>
                        <span className="text-xs font-black font-mono flex-1 text-center">{fontSize}px</span>
                        <button onClick={() => setFontSize(Math.min(32, fontSize + 2))} className="p-1 rounded bg-neutral-200 dark:bg-neutral-800"><Plus className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>

                    {/* Surah Text Area */}
                    <div className="bg-neutral-50 dark:bg-[#16161a] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm overflow-hidden select-text text-right">
                      {/* Continuous Page layout */}
                      <div 
                        className="leading-loose tracking-wide font-amiri text-neutral-850 dark:text-neutral-100 text-justify"
                        style={{ fontSize: `${fontSize}px` }}
                        dir="rtl"
                      >
                        {surah.number !== 1 && surah.number !== 9 && (
                          <div className="text-center mb-6 font-amiri text-lg">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
                        )}
                        {surah.ayahs.map(ayah => (
                          <span key={ayah.num} id={`ayah-${surah.number}-${ayah.num}`} className="inline">
                            {ayah.text.replace(/^[﻿\s]*بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ[﻿\s]*/, "")}
                            <span className="text-amber-600 dark:text-amber-500 font-sans font-bold mx-1.5 select-none">
                              ﴿{ayah.num}﴾
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()
                )}
              </>
            )}
          </div>
        )}

        {/* =======================================
            3. TAB: SHIELD (الحصن والرقية)
            ======================================= */}
        {activeTab === "shield" && (
          <div className="space-y-6 animate-fade-slide-in">
            {/* Tab selector header */}
            <div className="flex bg-neutral-100 dark:bg-[#16161a] border border-neutral-200 dark:border-neutral-850 rounded-2xl p-1 gap-1">
              {[
                { id: "adhkar", label: "أذكار اليوم" },
                { id: "ruqyah", label: "الرقية الشرعية" },
                { id: "radio", label: "راديو البث المباشر" }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveShieldSubTab(tab.id); triggerHaptic(35); }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold font-naskh transition-all clickable ${
                    activeShieldSubTab === tab.id
                      ? "bg-white dark:bg-[#0e0e10] text-black dark:text-white shadow-sm border border-neutral-200/50 dark:border-neutral-800/50"
                      : "text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* --- SUB-TAB: DAILY ADHKAR --- */}
            {activeShieldSubTab === "adhkar" && (
              <div className="space-y-6">
                {/* Categories selector */}
                <div className="grid grid-cols-4 gap-2 bg-neutral-50 dark:bg-[#16161a] border border-neutral-250/20 dark:border-neutral-800/20 rounded-2xl p-1.5">
                  {[
                    { key: "morning", label: "الصباح" },
                    { key: "evening", label: "المساء" },
                    { key: "sleep", label: "النوم" },
                    { key: "study", label: "الدراسة" }
                  ].map(cat => (
                    <button
                      key={cat.key}
                      onClick={() => { setActiveAdhkarKey(cat.key); triggerHaptic(30); }}
                      className={`py-1.5 rounded-xl text-[10px] font-black font-naskh transition-all clickable ${
                        activeAdhkarKey === cat.key
                          ? "bg-black dark:bg-white text-white dark:text-black"
                          : "text-neutral-500 hover:text-black dark:hover:text-white"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Adhkar Items list */}
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 font-naskh">أذكار طائفة: {activeAdhkarKey === "morning" ? "الصباح" : activeAdhkarKey === "evening" ? "المساء" : activeAdhkarKey === "sleep" ? "النوم" : "الدراسة والاستذكار"}</span>
                  <button 
                    onClick={() => handleResetSection(activeAdhkarKey, "adhkar")}
                    className="text-[9px] font-black text-red-600 dark:text-red-400 font-naskh hover:underline font-bold"
                  >
                    تصفير التقدم بالقسم
                  </button>
                </div>

                <div className="space-y-3.5">
                  {adhkarData[activeAdhkarKey].map(item => {
                    const isDone = !!completedItems[item.id];
                    const remaining = itemCounts[item.id] !== undefined ? itemCounts[item.id] : item.count;
                    return (
                      <div 
                        key={item.id}
                        className={`bg-neutral-50 dark:bg-[#16161a] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 shadow-sm space-y-3.5 transition-all text-right ${
                          isDone ? "opacity-60 grayscale-[40%]" : ""
                        }`}
                      >
                        <h4 className="text-xs font-black text-neutral-900 dark:text-neutral-50 font-naskh leading-relaxed">{item.title}</h4>
                        <p className="text-xs font-bold leading-loose text-neutral-800 dark:text-neutral-200 font-amiri select-text">{item.text}</p>
                        
                        {item.reward && (
                          <div className="p-3 bg-neutral-100/50 dark:bg-[#0e0e10]/50 border border-neutral-100 dark:border-neutral-850 rounded-2xl text-[9px] font-bold text-neutral-500 dark:text-neutral-400 font-naskh leading-relaxed select-text">
                            الأثر/الفضل: {item.reward}
                          </div>
                        )}

                        {/* Interactive counters row */}
                        <div className="flex justify-between items-center pt-2">
                          <button 
                            onClick={() => handleResetItem(item.id)}
                            className="p-2 text-neutral-400 hover:text-red-500 active:scale-90 transition-transform clickable"
                            title="إعادة التصفير"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          
                          <button 
                            onClick={() => !isDone && handleItemTap(item.id, item.count)}
                            disabled={isDone}
                            className={`px-6 py-2 rounded-2xl font-sans text-xs font-black flex items-center gap-2 active:scale-96 transition-all shadow-sm border clickable ${
                              isDone
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-450"
                                : "bg-black dark:bg-white border-black dark:border-white text-white dark:text-black"
                            }`}
                          >
                            {isDone ? (
                              <>
                                <Check className="w-4 h-4" /> تم الأثر
                              </>
                            ) : (
                              <>
                                التكرار: {remaining} من {item.count}
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* --- SUB-TAB: RUQYAH --- */}
            {activeShieldSubTab === "ruqyah" && (
              <div className="space-y-6">
                <div className="flex bg-neutral-50 dark:bg-[#16161a] border border-neutral-200 dark:border-neutral-850 rounded-xl p-1 gap-1 max-w-[280px] mx-auto">
                  <button
                    onClick={() => { setActiveRuqyahSubTab("written"); triggerHaptic(30); }}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-black font-naskh transition-all clickable ${
                      activeRuqyahSubTab === "written"
                        ? "bg-white dark:bg-[#0e0e10] text-black dark:text-white shadow-sm border border-neutral-200/50 dark:border-neutral-800/50"
                        : "text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white"
                    }`}
                  >
                    الرقية المكتوبة
                  </button>
                  <button
                    onClick={() => { setActiveRuqyahSubTab("audio"); triggerHaptic(30); }}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-black font-naskh transition-all clickable ${
                      activeRuqyahSubTab === "audio"
                        ? "bg-white dark:bg-[#0e0e10] text-black dark:text-white shadow-sm border border-neutral-200/50 dark:border-neutral-800/50"
                        : "text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white"
                    }`}
                  >
                    الرقية المسموعة (النوم)
                  </button>
                </div>

                {/* --- Written Ruqyah Steps & Guides --- */}
                {activeRuqyahSubTab === "written" && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] font-black text-neutral-400 font-naskh">
                        بروتوكول الرقية والتحصين الكامل الشامل ({fullWrittenRuqyah.length} خطوة موحدة)
                      </span>
                      <button 
                        onClick={() => handleResetSection("ruqyah", "ruqyah")} 
                        className="text-[9px] font-black text-red-500 hover:underline"
                      >
                        إعادة ضبط الكل
                      </button>
                    </div>

                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                      {fullWrittenRuqyah.map((step, idx) => {
                        const isDone = !!completedItems[step.id];
                        const remaining = itemCounts[step.id] !== undefined ? itemCounts[step.id] : step.repeat;
                        const benefitText = step.reward || step.benefit;
                        const referenceText = step.hadith || step.reference;
                        const isSpecialized = step.id.startsWith("tr_");
                        
                        return (
                          <div 
                            key={step.id} 
                            className={`bg-neutral-50 dark:bg-[#16161a] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 text-right space-y-3.5 transition-all ${
                              isDone ? "opacity-60 grayscale-[40%]" : ""
                            }`}
                          >
                            <div className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-850 pb-2">
                              <span className="text-[10px] font-naskh font-black text-neutral-400 dark:text-neutral-500">
                                الخطوة {idx + 1} • {step.category}
                              </span>
                              <button 
                                onClick={() => {
                                  triggerHaptic(50);
                                  const nextComp = { ...completedItems, [step.id]: !isDone };
                                  const nextCounts = { ...itemCounts, [step.id]: isDone ? step.repeat : 0 };
                                  saveState(nextComp, nextCounts);
                                }}
                                className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all clickable ${
                                  isDone 
                                    ? "bg-black dark:bg-white border-black dark:border-white text-white dark:text-black" 
                                    : "border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#0e0e10]"
                                }`}
                              >
                                {isDone && <Check className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                            
                            <h4 className={`text-xs font-black font-naskh leading-relaxed ${
                              isSpecialized ? "text-amber-700 dark:text-amber-400" : "text-neutral-900 dark:text-neutral-50"
                            }`}>
                              {step.title}
                            </h4>
                            
                            <p className="text-xs font-bold leading-loose text-neutral-800 dark:text-neutral-200 font-amiri select-text">
                              {step.text}
                            </p>
                            
                            {benefitText && (
                              <div className="p-3 bg-neutral-100/50 dark:bg-[#0e0e10]/50 border border-neutral-100 dark:border-neutral-850 rounded-2xl text-[9px] font-bold text-neutral-500 dark:text-neutral-400 font-naskh leading-relaxed select-text">
                                الأثر والفضل: {benefitText}
                              </div>
                            )}
                            
                            {referenceText && (
                              <div className="p-3 bg-neutral-100/20 dark:bg-[#0e0e10]/20 border border-neutral-100 dark:border-neutral-900 rounded-2xl text-[9px] text-neutral-450 dark:text-neutral-500 font-naskh leading-relaxed select-text">
                                الدليل والبيان: {referenceText}
                              </div>
                            )}

                            {/* Interactive counter row */}
                            <div className="flex justify-between items-center pt-2">
                              <button 
                                onClick={() => handleResetItem(step.id)}
                                className="p-2 text-neutral-400 hover:text-red-500 active:scale-90 transition-transform clickable"
                                title="إعادة التصفير"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                              
                              <button 
                                onClick={() => !isDone && handleItemTap(step.id, step.repeat)}
                                disabled={isDone}
                                className={`px-6 py-2 rounded-2xl font-sans text-xs font-black flex items-center gap-2 active:scale-96 transition-all shadow-sm border clickable ${
                                  isDone
                                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-450"
                                    : "bg-black dark:bg-white border-black dark:border-white text-white dark:text-black"
                                }`}
                              >
                                {isDone ? (
                                  <>
                                    <Check className="w-4 h-4" /> اكتملت الخطوة
                                  </>
                                ) : (
                                  <>
                                    تكرار القراءة: {remaining} من {step.repeat}
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* --- Audio player interface --- */}
                {activeRuqyahSubTab === "audio" && (
                  <div className="space-y-6">
                    {/* Visual Player Card */}
                    <div className="bg-neutral-50 dark:bg-[#16161a] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm flex flex-col items-center gap-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-black/5 dark:bg-white/5 rounded-full translate-x-8 -translate-y-8" />
                      
                      <div className="text-center space-y-1">
                        <span className="text-[9px] font-black text-neutral-400 dark:text-neutral-500 font-naskh uppercase tracking-widest">تحصين النوم الصوتي</span>
                        <h3 className="text-sm font-extrabold text-neutral-900 dark:text-neutral-50 font-naskh">
                          {currentTrackIndex !== null ? playlist[currentTrackIndex].name : "تلاوات التحصين"}
                        </h3>
                        <p className="text-[10px] text-neutral-450 dark:text-neutral-400 font-naskh max-w-xs mx-auto">
                          {currentTrackIndex !== null ? playlist[currentTrackIndex].detail : "تلاوة هادئة لرقية البيت والنفس قبل المنام"}
                        </p>
                      </div>

                      {/* Animated Audio bars */}
                      {isPlaying && !activeRadioStation && (
                        <div className="flex items-end justify-center gap-1.5 h-8 select-none">
                          <span className="w-1 bg-amber-500 rounded animate-audio-bar-1" style={{ height: "70%" }} />
                          <span className="w-1 bg-amber-500 rounded animate-audio-bar-2" style={{ height: "40%" }} />
                          <span className="w-1 bg-amber-500 rounded animate-audio-bar-3" style={{ height: "90%" }} />
                          <span className="w-1 bg-amber-500 rounded animate-audio-bar-4" style={{ height: "50%" }} />
                          <span className="w-1 bg-amber-500 rounded animate-audio-bar-5" style={{ height: "80%" }} />
                        </div>
                      )}

                      {/* Error labels */}
                      {audioError && <p className="text-[10px] font-black text-red-500 text-center font-naskh">{audioError}</p>}

                      {/* Seek slider */}
                      <div className="w-full space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-bold text-neutral-450 font-mono">
                          <span>{formatTime(currentTime)}</span>
                          <span>{formatTime(duration)}</span>
                        </div>
                        <input 
                          type="range"
                          min="0"
                          max={duration || 100}
                          value={currentTime}
                          onChange={(e) => {
                            if (audioRef.current) {
                              audioRef.current.currentTime = parseFloat(e.target.value);
                            }
                          }}
                          className="w-full accent-black dark:accent-white bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none h-1.5"
                        />
                      </div>

                      {/* Control buttons */}
                      <div className="flex items-center justify-center gap-6">
                        <button onClick={() => { triggerHaptic(30); prevTrack(); }} className="text-neutral-500 hover:text-black dark:hover:text-white p-2.5 rounded-full bg-neutral-100/50 dark:bg-neutral-850/50 clickable">
                          <SkipBack className="w-4.5 h-4.5" />
                        </button>
                        <button 
                          onClick={() => { triggerHaptic(40); togglePlay(); }} 
                          className="w-12 h-12 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center active:scale-95 transition-all shadow-md clickable"
                        >
                          {isAudioBuffering ? (
                            <div className="w-5 h-5 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin" />
                          ) : isPlaying && !activeRadioStation ? (
                            <Pause className="w-5 h-5 fill-current" />
                          ) : (
                            <Play className="w-5 h-5 fill-current translate-x-0.5" />
                          )}
                        </button>
                        <button onClick={() => { triggerHaptic(30); nextTrack(); }} className="text-neutral-500 hover:text-black dark:hover:text-white p-2.5 rounded-full bg-neutral-100/50 dark:bg-neutral-850/50 clickable">
                          <SkipForward className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </div>

                    {/* Surah Playlist */}
                    <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                      {playlist.map((track, idx) => {
                        const isCurrent = currentTrackIndex === idx && !activeRadioStation;
                        return (
                          <button
                            key={track.id}
                            onClick={() => playTrack(idx)}
                            className={`w-full text-right p-4 rounded-2xl border transition-all active:scale-99 flex items-center justify-between clickable ${
                              isCurrent
                                ? "bg-amber-500/5 border-amber-500/25"
                                : "bg-neutral-50 dark:bg-[#16161a] border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100/50 dark:hover:bg-neutral-850/50"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-sans font-bold text-neutral-400">0{idx + 1}</span>
                              <div className="text-right">
                                <h4 className="text-xs font-black text-neutral-850 dark:text-neutral-100 font-naskh">{track.name}</h4>
                                <span className="text-[9px] font-bold text-neutral-400 dark:text-neutral-500 font-naskh">{track.detail}</span>
                              </div>
                            </div>
                            {isCurrent ? (
                              isAudioBuffering ? (
                                <div className="w-3.5 h-3.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                              ) : isPlaying ? (
                                <Activity className="w-4 h-4 text-amber-500 animate-pulse" />
                              ) : (
                                <Play className="w-3.5 h-3.5 text-neutral-400" />
                              )
                            ) : (
                              <Play className="w-3.5 h-3.5 text-neutral-400" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* --- SUB-TAB: LIVE RADIO --- */}
            {activeShieldSubTab === "radio" && (
              <div className="space-y-6">
                <div className="space-y-1 text-right">
                  <h3 className="text-sm font-extrabold font-naskh">المذياع الإسلامي المباشر</h3>
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-naskh">استمع مباشرة إلى إذاعة القرآن والرقية والدروس 24 ساعة عبر خوادم آمنة</p>
                </div>

                {/* Radio error display */}
                {radioError && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-500 text-xs font-bold text-center font-naskh leading-normal">
                    {radioError}
                  </div>
                )}

                {/* Custom equalizer bar for playing radio */}
                {activeRadioStation && isPlaying && (
                  <div className="bg-neutral-50 dark:bg-[#16161a] border border-neutral-200 dark:border-neutral-850 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                      <span className="text-xs font-black text-neutral-805 dark:text-neutral-200 font-naskh">قيد البث المباشر: {activeRadioStation.name}</span>
                    </div>
                    <button 
                      onClick={() => playRadio(activeRadioStation)}
                      className="px-3 py-1.5 bg-neutral-900 text-white dark:bg-white dark:text-black text-[10px] font-black rounded-lg font-naskh clickable"
                    >
                      إيقاف مؤقت
                    </button>
                  </div>
                )}

                {/* Radio Stations List */}
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {radioStations.map(station => {
                    const isCurrent = activeRadioStation?.id === station.id;
                    const isStationPlaying = isCurrent && isPlaying;
                    
                    return (
                      <button
                        key={station.id}
                        onClick={() => playRadio(station)}
                        className={`w-full text-right p-4 rounded-3xl border transition-all active:scale-99 flex items-center justify-between clickable ${
                          isCurrent
                            ? "bg-emerald-500/5 border-emerald-500/25"
                            : "bg-neutral-50 dark:bg-[#16161a] border-neutral-200 dark:border-neutral-850 hover:bg-neutral-100/50 dark:hover:bg-neutral-850/50"
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-colors border ${
                            isCurrent 
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-450" 
                              : "bg-white dark:bg-[#0e0e10] border-neutral-150 dark:border-neutral-800 text-neutral-450"
                          }`}>
                            <Radio className={`w-4.5 h-4.5 ${isStationPlaying && !isAudioBuffering ? "animate-spin-slow" : ""}`} />
                          </div>
                          <div className="text-right">
                            <h4 className="text-xs font-black text-neutral-850 dark:text-neutral-100 font-naskh">{station.name}</h4>
                            <p className="text-[9px] font-bold text-neutral-450 dark:text-neutral-500 font-naskh mt-0.5">{station.detail}</p>
                          </div>
                        </div>
                        {isCurrent ? (
                          isAudioBuffering ? (
                            <div className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                          ) : isPlaying ? (
                            <Pause className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Play className="w-3.5 h-3.5 text-neutral-400" />
                          )
                        ) : (
                          <Play className="w-3.5 h-3.5 text-neutral-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* =======================================
            4. TAB: UTILITIES (العبادات والخدمات)
            ======================================= */}
        {activeTab === "utilities" && (
          <div className="space-y-6 animate-fade-slide-in">
            {/* Sub-tab segmented toggle */}
            <div className="grid grid-cols-4 bg-neutral-100 dark:bg-[#16161a] border border-neutral-200 dark:border-neutral-850 rounded-2xl p-1 gap-1">
              {[
                { id: "prayers", label: "المواقيت" },
                { id: "calendar", label: "الهجري" },
                { id: "tasbih", label: "المسبحة" },
                { id: "settings", label: "الضبط" }
              ].map(subTab => (
                <button
                  key={subTab.id}
                  onClick={() => { setActiveUtilitiesSubTab(subTab.id); triggerHaptic(30); }}
                  className={`py-2 rounded-xl text-[10px] font-black font-naskh transition-all clickable ${
                    activeUtilitiesSubTab === subTab.id
                      ? "bg-white dark:bg-[#0e0e10] text-black dark:text-white shadow-sm border border-neutral-200/50 dark:border-neutral-800/50"
                      : "text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white"
                  }`}
                >
                  {subTab.label}
                </button>
              ))}
            </div>

            {/* --- SUB-TAB: PRAYER TIMINGS & LOGGING --- */}
            {activeUtilitiesSubTab === "prayers" && (
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div className="text-right space-y-0.5">
                    <h3 className="text-sm font-extrabold font-naskh">مواقيت الصلوات الخمس</h3>
                    <p className="text-[9px] text-neutral-500 dark:text-neutral-400 font-naskh">الموقع الحالي: {selectedLocation.name}</p>
                  </div>
                  <button 
                    onClick={detectGPSLocation}
                    className="px-3.5 py-1.5 bg-neutral-900 text-white dark:bg-white dark:text-black border border-neutral-200 dark:border-neutral-800 rounded-xl text-[10px] font-black font-naskh flex items-center gap-1 active:scale-95 transition-all clickable"
                  >
                    تحديث (GPS)
                  </button>
                </div>

                {prayerTimesError && (
                  <p className="text-[9px] font-black text-red-500 text-center font-naskh leading-normal">{prayerTimesError}</p>
                )}

                {/* Timings List */}
                {prayerTimes ? (
                  <div className="bg-neutral-50 dark:bg-[#16161a] border border-neutral-200 dark:border-neutral-850 rounded-3xl p-5 shadow-sm space-y-3">
                    {dailyPrayers.map(p => {
                      const isChecked = !!todayRecord[p.id];
                      return (
                        <button
                          key={p.id}
                          onClick={() => togglePrayerState(p.id)}
                          className="w-full flex items-center justify-between py-3 border-b border-neutral-100 dark:border-neutral-850 last:border-none text-right clickable"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{p.emoji}</span>
                            <div className="text-right">
                              <h4 className="text-xs font-black text-neutral-850 dark:text-neutral-100 font-naskh">{p.name}</h4>
                              <span className="text-[9px] font-bold text-neutral-450 dark:text-neutral-550 font-naskh">{p.desc}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-black font-mono bg-neutral-150 dark:bg-[#0e0e10] border border-neutral-200 dark:border-neutral-850 px-2.5 py-0.5 rounded-lg">
                              {prayerTimes[p.id]}
                            </span>
                            <div className={`w-5.5 h-5.5 rounded-full border flex items-center justify-center transition-all ${
                              isChecked 
                                ? "bg-black dark:bg-white border-black dark:border-white text-white dark:text-black" 
                                : "border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#0e0e10]"
                            }`}>
                              {isChecked && <Check className="w-3.5 h-3.5" />}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-neutral-500 text-xs font-naskh animate-pulse">جاري تحميل مواقيت الصلاة...</div>
                )}

                {/* Qiyam Al-Layl Tracker */}
                <div className="bg-neutral-50 dark:bg-[#16161a] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="text-right">
                      <h4 className="text-xs font-black text-neutral-850 dark:text-neutral-100 font-naskh">قيام الليل والتهجد</h4>
                      <p className="text-[9px] text-neutral-400 dark:text-neutral-500 font-bold font-naskh mt-0.5">حافظ على قيام الليل وصلاة الشفع والوتر</p>
                    </div>
                    <span className="text-xs font-black font-mono bg-neutral-150 dark:bg-[#0e0e10] border border-neutral-200 dark:border-neutral-850 px-3 py-1 rounded-lg">
                      {todayRecord.qiyam || 0} ركعة
                    </span>
                  </div>

                  <div className="flex items-center justify-center gap-4">
                    <button onClick={() => adjustQiyamValue(-2)} className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center active:scale-90 transition-transform clickable">
                      <Minus className="w-4 h-4 text-neutral-600 dark:text-neutral-200" />
                    </button>
                    <span className="text-xs font-black font-naskh">تعديل عدد الركعات</span>
                    <button onClick={() => adjustQiyamValue(2)} className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center active:scale-90 transition-transform clickable">
                      <Plus className="w-4 h-4 text-neutral-600 dark:text-neutral-200" />
                    </button>
                  </div>
                </div>

                {/* Weekly Analytics Chart */}
                <div className="bg-neutral-50 dark:bg-[#16161a] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 shadow-sm space-y-4">
                  <h4 className="text-xs font-black text-neutral-800 dark:text-neutral-200 font-naskh">معدل التزامك خلال آخر 7 أيام</h4>
                  <div className="flex items-end justify-between h-28 pt-4 select-none">
                    {last7DaysData.map(day => {
                      const heightPct = (day.count / 5) * 100;
                      // Color scale based on completed prayers count
                      let barColorClass = "bg-neutral-250 dark:bg-neutral-800";
                      if (day.count === 1) barColorClass = "bg-emerald-500/20";
                      else if (day.count === 2) barColorClass = "bg-emerald-500/40";
                      else if (day.count === 3) barColorClass = "bg-emerald-500/60";
                      else if (day.count === 4) barColorClass = "bg-emerald-500/80";
                      else if (day.count === 5) barColorClass = "bg-emerald-500";

                      return (
                        <div key={day.key} className="flex-1 flex flex-col items-center gap-0.5 h-full justify-end relative">
                          {/* Qiyam rak'ahs count (only if > 0) */}
                          {day.qiyam > 0 ? (
                            <span className="text-[7px] font-bold text-amber-600 dark:text-amber-450 bg-amber-500/10 px-0.5 rounded-sm" title={`قيام الليل: ${day.qiyam} ركعة`}>
                              🌙 {day.qiyam}
                            </span>
                          ) : (
                            <span className="h-2.5" /> // Spacer to preserve layout alignment
                          )}
                          {/* Prayers count */}
                          <span className="text-[8px] font-sans font-bold text-neutral-500 dark:text-neutral-400">{day.count}/5</span>
                          
                          <div className="w-3.5 bg-neutral-200 dark:bg-neutral-800 rounded-full h-14 flex items-end overflow-hidden border border-neutral-100 dark:border-neutral-850">
                            <div 
                              className={`w-full rounded-full transition-all duration-500 ${barColorClass} ${
                                day.isToday ? "ring-2 ring-amber-500/50" : ""
                              }`}
                              style={{ height: `${heightPct}%` }}
                            />
                          </div>
                          <span className="text-[8px] font-bold font-naskh text-neutral-500 dark:text-neutral-450 mt-1">{day.dayName}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}


            {/* --- SUB-TAB: ISLAMIC CALENDAR & CONVERTER --- */}
            {activeUtilitiesSubTab === "calendar" && (
              <div className="space-y-6">
                <div className="space-y-0.5 text-right">
                  <h3 className="text-sm font-extrabold font-naskh">التقويم والتحويل الهجري</h3>
                  <p className="text-[9px] text-neutral-500 dark:text-neutral-400 font-naskh">قم بتحويل التواريخ بين التقويم الميلادي والهجري فوراً</p>
                </div>

                {/* Current Hijri Date Card */}
                {hijriDate && (
                  <div className="bg-neutral-50 dark:bg-[#16161a] border border-neutral-200 dark:border-neutral-850 rounded-3xl p-5 text-center shadow-sm space-y-2">
                    <span className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 font-naskh uppercase tracking-wider">تاريخ اليوم الهجري</span>
                    <h2 className="text-base font-extrabold text-neutral-900 dark:text-neutral-50 font-naskh leading-normal">
                      {hijriDate.weekdayAr}، {hijriDate.day} {hijriDate.monthNameAr} {hijriDate.year} هـ
                    </h2>
                    <span className="text-[9px] font-black text-neutral-450 dark:text-neutral-400 font-sans tracking-wide">({hijriDate.monthNameEn})</span>
                  </div>
                )}

                {/* Hijri Date Converter Input */}
                <div className="bg-neutral-50 dark:bg-[#16161a] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 shadow-sm space-y-4">
                  <h4 className="text-xs font-black text-neutral-800 dark:text-neutral-100 font-naskh">محول التواريخ</h4>
                  
                  <div className="space-y-3.5">
                    <div className="space-y-1.5 text-right">
                      <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 font-naskh">اختر التاريخ الميلادي</label>
                      <input 
                        type="date"
                        value={hijriConvertDate}
                        onChange={(e) => setHijriConvertDate(e.target.value)}
                        className="w-full bg-white dark:bg-[#0e0e10] border border-neutral-250/20 dark:border-neutral-800/20 rounded-xl px-4 py-3 text-xs font-bold text-neutral-850 dark:text-neutral-100 focus:outline-none"
                      />
                    </div>

                    <button 
                      onClick={triggerDateConversion}
                      className="w-full py-3 bg-black dark:bg-white text-white dark:text-black font-black text-xs rounded-xl font-naskh active:scale-98 transition-transform clickable shadow-sm"
                    >
                      إتمام التحويل الهجري
                    </button>
                  </div>

                  {convertedHijri && (
                    <div className="bg-white dark:bg-[#0e0e10] border border-neutral-150 dark:border-neutral-800/80 rounded-2xl p-4 text-center animate-fade-slide-in">
                      <span className="text-[9px] font-black text-neutral-400 dark:text-neutral-500 font-naskh uppercase tracking-wide">النتيجة المقابلة</span>
                      <h4 className="text-xs font-black text-amber-700 dark:text-amber-450 font-naskh mt-1 leading-normal">{convertedHijri}</h4>
                    </div>
                  )}

                            </div>
              </div>
            )}

            {/* --- SUB-TAB: ELECTRONIC TASBIH --- */}
            {activeUtilitiesSubTab === "tasbih" && (
              <div className="space-y-6 flex flex-col items-center animate-fade-slide-in">
                <div className="space-y-0.5 text-right w-full">
                  <h3 className="text-sm font-extrabold font-naskh">المسبحة الإلكترونية</h3>
                  <p className="text-[9px] text-neutral-500 dark:text-neutral-400 font-naskh">عداد تسبيح يومي مع اهتزازات هابتك مخصصة عند اكتمال الهدف</p>
                </div>

                {/* Target presets selector */}
                <div className="flex bg-neutral-50 dark:bg-[#16161a] border border-neutral-200 dark:border-neutral-855 rounded-xl p-1 gap-1 max-w-[280px] w-full">
                  {[33, 100, 1000].map(tgt => (
                    <button
                      key={tgt}
                      onClick={() => { setTasbihTarget(tgt); setTasbihCount(0); triggerHaptic(30); }}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all clickable ${
                        tasbihTarget === tgt 
                          ? "bg-black dark:bg-white text-white dark:text-black shadow-sm" 
                          : "text-neutral-500 hover:text-black"
                      }`}
                    >
                      {tgt}
                    </button>
                  ))}
                </div>

                {/* Tactile Count Clicker area */}
                <button
                  onClick={handleTasbihTap}
                  className="w-52 h-52 rounded-full bg-neutral-50 dark:bg-[#16161a] hover:bg-neutral-100/50 dark:hover:bg-[#1b1b22] border-4 border-neutral-150 dark:border-neutral-800 shadow-inner flex flex-col items-center justify-center gap-2 active:scale-97 transition-all clickable"
                >
                  <span className="text-5xl font-black font-sans text-neutral-900 dark:text-neutral-50">{tasbihCount}</span>
                  <span className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 font-naskh">اضغط للعد</span>
                </button>

                {/* Totals & Reset */}
                <div className="w-full flex justify-between items-center bg-neutral-50 dark:bg-[#16161a] border border-neutral-200 dark:border-neutral-850 rounded-2xl px-5 py-3">
                  <div className="text-right">
                    <span className="text-[8px] font-black text-neutral-400 dark:text-neutral-500 font-naskh uppercase tracking-wide">العد الإجمالي اليومي</span>
                    <h4 className="text-xs font-black text-neutral-850 dark:text-neutral-100 font-mono">{tasbihTotal} تسبيحة</h4>
                  </div>
                  <button 
                    onClick={() => { setTasbihCount(0); triggerHaptic([50, 50]); }}
                    className="p-2.5 rounded-xl bg-white dark:bg-[#0e0e10] border border-neutral-150 dark:border-neutral-855 hover:bg-red-500/5 hover:text-red-500 transition-colors clickable"
                    title="تصفير العداد الحالي"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* --- SUB-TAB: SETTINGS (الضبط والإعدادات) --- */}
            {activeUtilitiesSubTab === "settings" && (
              <div className="space-y-6 animate-fade-slide-in">
                <div className="space-y-0.5 text-right px-1">
                  <h3 className="text-sm font-extrabold font-naskh">الضبط وإعدادات التطبيق</h3>
                  <p className="text-[9px] text-neutral-500 dark:text-neutral-400 font-naskh">قم بتهيئة وحفظ تفضيلات التطبيق وخيارات المزامنة يدوياً</p>
                </div>

                {/* Premium Unified Settings Card */}
                <div className="bg-neutral-50 dark:bg-[#16161a] border border-neutral-200/60 dark:border-neutral-800/60 rounded-3xl p-6 shadow-sm space-y-6 text-right">
                  
                  {/* SECTION 1: Location & Prayer calculation */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-neutral-200/40 dark:border-neutral-800/40 pb-2">
                      <MapPin className="w-4.5 h-4.5 text-neutral-500" />
                      <h4 className="text-xs font-black text-neutral-850 dark:text-neutral-100 font-naskh">الموقع الجغرافي والمواقيت</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Current Location Preset Select */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 font-naskh">المدينة الحالية</label>
                        <div className="relative">
                          <select
                            value={selectedLocation.id}
                            onChange={(e) => {
                              const preset = locationPresets.find(p => p.id === e.target.value);
                              if (preset) {
                                setSelectedLocation(preset);
                                localStorage.setItem("selectedLocation", JSON.stringify(preset));
                                triggerHaptic(30);
                              }
                            }}
                            className="w-full appearance-none bg-white dark:bg-[#0e0e10] border border-neutral-200 dark:border-neutral-800 rounded-2xl pl-10 pr-4 py-3 text-xs font-bold text-neutral-850 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all clickable"
                          >
                            {locationPresets.map(preset => (
                              <option key={preset.id} value={preset.id}>{preset.name}</option>
                            ))}
                            {selectedLocation.id === "gps" && (
                              <option value="gps">موقعي الحالي (GPS المكتشف)</option>
                            )}
                          </select>
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400 dark:text-neutral-500">
                            <ChevronDown className="w-4 h-4" />
                          </div>
                        </div>
                      </div>

                      {/* Prayer calculation method select */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 font-naskh">الهيئة المعتمدة للحساب</label>
                        <div className="relative">
                          <select
                            value={selectedLocation.method}
                            onChange={(e) => {
                              const newMethod = parseInt(e.target.value);
                              const nextLoc = { ...selectedLocation, method: newMethod };
                              setSelectedLocation(nextLoc);
                              localStorage.setItem("selectedLocation", JSON.stringify(nextLoc));
                              triggerHaptic(30);
                            }}
                            className="w-full appearance-none bg-white dark:bg-[#0e0e10] border border-neutral-200 dark:border-neutral-800 rounded-2xl pl-10 pr-4 py-3 text-xs font-bold text-neutral-850 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all clickable"
                          >
                            {calculationMethods.map(method => (
                              <option key={method.id} value={method.id}>{method.name}</option>
                            ))}
                          </select>
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400 dark:text-neutral-500">
                            <ChevronDown className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2: Athan Voice Selector */}
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-2 border-b border-neutral-200/40 dark:border-neutral-800/40 pb-2">
                      <Volume2 className="w-4.5 h-4.5 text-neutral-500" />
                      <h4 className="text-xs font-black text-neutral-850 dark:text-neutral-100 font-naskh">صوت تنبيه الأذان</h4>
                    </div>

                    <div className="bg-white dark:bg-[#0e0e10] border border-neutral-200 dark:border-neutral-855 rounded-3xl p-4 space-y-3.5">
                      {[
                        { id: "beep", label: "نغمة تنبيه رقمية متصاعدة (افتراضي)", url: null },
                        { id: "azan1", label: "أذان الحرم المكي الشريف", url: "https://www.islamcan.com/audio/adhan/azan1.mp3" },
                        { id: "azan2", label: "أذان الحرم المدني الشريف", url: "https://www.islamcan.com/audio/adhan/azan2.mp3" },
                        { id: "azan3", label: "أذان الشيخ عبد الباسط عبد الصمد", url: "https://www.islamcan.com/audio/adhan/azan3.mp3" },
                        { id: "azan5", label: "أذان الشيخ مشاري بن راشد العفاسي", url: "https://www.islamcan.com/audio/adhan/azan5.mp3" },
                        { id: "azan7", label: "أذان المسجد الأقصى المبارك", url: "https://www.islamcan.com/audio/adhan/azan7.mp3" },
                        { id: "azan6", label: "أذان المساجد التركية (مقام تركي)", url: "https://www.islamcan.com/audio/adhan/azan6.mp3" }
                      ].map((voice) => (
                        <div 
                          key={voice.id} 
                          className="flex items-center justify-between py-1 border-b border-neutral-100/50 dark:border-neutral-855 last:border-none last:pb-0"
                        >
                          {/* Radio Selector & Voice Label */}
                          <button
                            onClick={() => {
                              setSelectedAthan(voice.id);
                              localStorage.setItem("selectedAthan", voice.id);
                              triggerHaptic(35);
                            }}
                            className="flex items-center gap-3 text-right flex-1 focus:outline-none clickable"
                          >
                            <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center transition-all ${
                              selectedAthan === voice.id 
                                ? "border-emerald-500 bg-emerald-500/10" 
                                : "border-neutral-300 dark:border-neutral-700"
                            }`}>
                              {selectedAthan === voice.id && (
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                              )}
                            </div>
                            <span className={`text-[11px] transition-colors ${
                              selectedAthan === voice.id 
                                ? "text-emerald-600 dark:text-emerald-400 font-extrabold" 
                                : "text-neutral-700 dark:text-neutral-300 font-bold"
                            } font-naskh`}>
                              {voice.label}
                            </span>
                          </button>

                          {/* Play/Pause Preview button */}
                          <button
                            onClick={() => handleAthanPreviewToggle(voice.id, voice.url)}
                            className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-[#1b1b22] text-neutral-500 active:scale-90 transition-all focus:outline-none clickable"
                            title="تجربة الصوت"
                          >
                            {previewingAthanId === voice.id ? (
                              <Square className="w-3.5 h-3.5 fill-current text-red-500" />
                            ) : (
                              <Play className="w-3.5 h-3.5 fill-current text-emerald-500" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SECTION 3: Haptic & Interaction */}
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-2 border-b border-neutral-200/40 dark:border-neutral-800/40 pb-2">
                      <Sliders className="w-4.5 h-4.5 text-neutral-500" />
                      <h4 className="text-xs font-black text-neutral-850 dark:text-neutral-100 font-naskh">الاهتزاز والتفاعل</h4>
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <div className="text-right">
                        <span className="text-xs font-bold text-neutral-855 dark:text-neutral-200 font-naskh">تفعيل الهبتك (Haptic Feedback)</span>
                        <p className="text-[9px] text-neutral-400 dark:text-neutral-500 font-bold font-naskh mt-0.5">اهتزاز خفيف وتفاعلي عند الضغط والتسبيح</p>
                      </div>
                      <button
                        onClick={() => {
                          const nextHap = !hapticsEnabled;
                          setHapticsEnabled(nextHap);
                          localStorage.setItem("hapticsEnabled", nextHap.toString());
                          if (nextHap) triggerHaptic(50);
                        }}
                        className={`relative w-10 h-6 rounded-full transition-colors duration-200 focus:outline-none clickable ${
                          hapticsEnabled ? "bg-emerald-500" : "bg-neutral-350 dark:bg-neutral-800"
                        }`}
                      >
                        <div 
                          className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200"
                          style={{
                            left: hapticsEnabled ? "18px" : "2px"
                          }}
                        />
                      </button>
                    </div>
                  </div>

                  {/* SECTION 4: Theme Selector */}
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-2 border-b border-neutral-200/40 dark:border-neutral-800/40 pb-2">
                      <Moon className="w-4.5 h-4.5 text-neutral-500" />
                      <h4 className="text-xs font-black text-neutral-850 dark:text-neutral-100 font-naskh">مظهر التطبيق</h4>
                    </div>

                    <div className="flex bg-neutral-100 dark:bg-[#0e0e10] border border-neutral-200/50 dark:border-neutral-855 rounded-2xl p-1 gap-1">
                      {[
                        { id: "light", label: "مضيء" },
                        { id: "dark", label: "مظلم" },
                        { id: "system", label: "تلقائي" }
                      ].map(mode => (
                        <button
                          key={mode.id}
                          onClick={() => { setThemeMode(mode.id); triggerHaptic(30); }}
                          className={`flex-1 py-2 rounded-xl text-xs font-black font-naskh transition-all clickable ${
                            themeMode === mode.id 
                              ? "bg-white dark:bg-[#16161a] text-black dark:text-white shadow-sm border border-neutral-200/30 dark:border-neutral-800/30" 
                              : "text-neutral-550 dark:text-neutral-400 hover:text-black dark:hover:text-white"
                          }`}
                        >
                          {mode.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* SECTION 5: Danger Zone Reset */}
                  <div className="space-y-4 pt-4 border-t border-neutral-200/40 dark:border-neutral-800/40">
                    <div className="flex items-center gap-2 pb-1">
                      <Trash2 className="w-4.5 h-4.5 text-red-500" />
                      <h4 className="text-xs font-black text-red-650 dark:text-red-400 font-naskh">منطقة الخطر والتهيئة</h4>
                    </div>

                    <div className="bg-red-50/50 dark:bg-red-950/10 border border-red-200/60 dark:border-red-900/20 rounded-2xl p-4 space-y-3 text-right">
                      <p className="text-[10px] text-red-700 dark:text-red-300 font-bold font-naskh leading-normal">
                        تحذير: سيقوم زر التهيئة بمسح جميع أذكارك المحفوظة اليومية، ونسب تقدمك، والعدادات بشكل دائم.
                      </p>
                      <button 
                        onClick={() => { triggerHaptic([100, 50, 100]); setShowResetModal(true); }}
                        className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black font-naskh active:scale-98 transition-all clickable shadow-sm"
                      >
                        إعادة تهيئة التطبيق ومسح البيانات
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            )}

          </div>
        )}
      </main>

            {/* --- RESET CONFIRMATION DIALOG MODAL --- */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white dark:bg-[#16161a] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 w-full max-w-sm space-y-5 text-right shadow-2xl animate-scale-up">
            <div className="space-y-1.5">
              <h3 className="text-sm font-black text-red-600 dark:text-red-400 font-naskh">هل أنت متأكد من المسح الكامل؟</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-bold font-naskh leading-relaxed">سيؤدي هذا الإجراء إلى حذف جميع التقدم والأذكار المحفوظة، وسلسلة الأيام وعداد التسبيح. لا يمكن التراجع عن هذا الإجراء.</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => { triggerHaptic(30); setShowResetModal(false); }}
                className="flex-1 py-3 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-850 dark:hover:bg-neutral-750 text-neutral-800 dark:text-neutral-100 text-xs font-black rounded-xl font-naskh transition-colors clickable"
              >
                تراجع وإلغاء
              </button>
              <button 
                onClick={handleFullReset}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl font-naskh transition-colors clickable shadow-sm"
              >
                نعم، احذف كل شيء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- FLOATING CONTROLS FOOTER MINI PLAYER (Sticky when audio is active) --- */}
      {(isPlaying || isAudioBuffering) && (
        <div className="fixed bottom-20 left-4 right-4 z-40 bg-white/95 dark:bg-[#16161a]/95 backdrop-blur-md border border-neutral-200/80 dark:border-neutral-800/80 shadow-lg rounded-2xl p-3 flex items-center justify-between gap-3 animate-fade-slide-in">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => { triggerHaptic(40); togglePlay(); }}
              className="w-9 h-9 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-black flex items-center justify-center active:scale-95 transition-all clickable"
            >
              {isAudioBuffering ? (
                <div className="w-4 h-4 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current translate-x-0.5" />
              )}
            </button>
            <div className="text-right">
              <h4 className="text-[10px] font-black text-neutral-800 dark:text-neutral-50 font-naskh max-w-[140px] truncate">
                {activeRadioStation ? activeRadioStation.name : playlist[currentTrackIndex]?.name}
              </h4>
              <p className="text-[8px] text-neutral-450 dark:text-neutral-500 font-bold font-naskh -mt-0.5 truncate">
                {activeRadioStation ? "بث مباشر" : "الرقية الشرعية المسموعة"}
              </p>
            </div>
          </div>
          <button 
            onClick={() => { triggerHaptic(30); cleanupAudio(); setIsPlaying(false); }}
            className="p-2 text-neutral-400 hover:text-red-500 active:scale-90 transition-transform clickable"
            title="إغلاق المشغل"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* --- BOTTOM TAB BAR NAVIGATION --- */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0e0e10]/95 backdrop-blur-md border-t border-neutral-100 dark:border-neutral-900 px-6 py-2 flex items-center justify-around transition-colors duration-300">
        {[
          { id: "dashboard", label: "الرئيسية", icon: Sparkles },
          { id: "quran", label: "المصحف", icon: BookOpen },
          { id: "shield", label: "الحصن والرقية", icon: Compass },
          { id: "utilities", label: "العبادات والخدمات", icon: Calendar }
        ].map(tab => {
          const IconComponent = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); triggerHaptic(30); }}
              className="flex flex-col items-center gap-1 py-1.5 focus:outline-none transition-colors duration-250 clickable group"
            >
              <div className={`p-1.5 rounded-xl transition-colors ${
                isActive 
                  ? "bg-black text-white dark:bg-white dark:text-black" 
                  : "text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-200"
              }`}>
                <IconComponent className="w-4.5 h-4.5" />
              </div>
              <span className={`text-[8px] font-black font-naskh transition-colors ${
                isActive ? "text-black dark:text-white" : "text-neutral-400"
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default App;
