package com.muslim.protection.hisn;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.os.Binder;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.support.v4.media.MediaMetadataCompat;
import android.support.v4.media.session.MediaSessionCompat;
import android.support.v4.media.session.PlaybackStateCompat;
import android.util.Log;

import androidx.core.app.NotificationCompat;
import androidx.media.app.NotificationCompat.MediaStyle;

/**
 * HisnAudioService - Native Android Foreground Service for background audio
 *
 * This service is started from JavaScript via Capacitor bridge when audio begins playing.
 * It registers a proper MediaSession with the OS so Android treats this app as a 
 * legitimate media player - bypassing AudioHardening and Samsung's SGM background kill.
 *
 * Compatible with Android 14+ and Samsung OneUI 8.5 (Android 16).
 */
public class AudioService extends Service {

    private static final String TAG = "HisnAudioService";
    public static final String CHANNEL_ID = "hisn_audio_channel";
    public static final int NOTIFICATION_ID = 1001;

    // Intent actions for media controls
    public static final String ACTION_PLAY   = "com.muslim.protection.hisn.PLAY";
    public static final String ACTION_PAUSE  = "com.muslim.protection.hisn.PAUSE";
    public static final String ACTION_STOP   = "com.muslim.protection.hisn.STOP";
    public static final String ACTION_START  = "com.muslim.protection.hisn.START";

    // Extras keys
    public static final String EXTRA_TITLE  = "title";
    public static final String EXTRA_ARTIST = "artist";

    private MediaSessionCompat mediaSession;
    private AudioManager audioManager;
    private AudioFocusRequest audioFocusRequest;
    private PowerManager.WakeLock wakeLock;
    private final IBinder binder = new AudioServiceBinder();

    private String currentTitle  = "حصن المسلم";
    private String currentArtist = "الرقية والأذكار";
    private boolean isPlaying    = false;

    public class AudioServiceBinder extends Binder {
        public AudioService getService() {
            return AudioService.this;
        }
    }

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "AudioService created");
        createNotificationChannel();
        initMediaSession();
        acquireWakeLock();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) {
            Log.w(TAG, "onStartCommand: null intent, restarting foreground");
            startForegroundWithNotification();
            return START_STICKY;
        }

        String action = intent.getAction();
        Log.d(TAG, "onStartCommand: action=" + action);

        if (ACTION_START.equals(action)) {
            currentTitle  = intent.getStringExtra(EXTRA_TITLE)  != null ? intent.getStringExtra(EXTRA_TITLE)  : currentTitle;
            currentArtist = intent.getStringExtra(EXTRA_ARTIST) != null ? intent.getStringExtra(EXTRA_ARTIST) : currentArtist;
            isPlaying = true;
            requestAudioFocus();
            updateMediaSession(true);
            startForegroundWithNotification();

        } else if (ACTION_PAUSE.equals(action)) {
            isPlaying = false;
            updateMediaSession(false);
            updateNotification();

        } else if (ACTION_PLAY.equals(action)) {
            isPlaying = true;
            requestAudioFocus();
            updateMediaSession(true);
            updateNotification();

        } else if (ACTION_STOP.equals(action)) {
            stopSelf();
        }

        return START_STICKY;
    }

    // ---- Audio Focus ----

    private void requestAudioFocus() {
        if (audioManager == null) {
            audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            AudioAttributes attrs = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .build();

            audioFocusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                    .setAudioAttributes(attrs)
                    .setAcceptsDelayedFocusGain(true)
                    .setWillPauseWhenDucked(false)
                    .setOnAudioFocusChangeListener(focusChange -> {
                        Log.d(TAG, "Audio focus changed: " + focusChange);
                        // Re-request focus if lost
                        if (focusChange == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT ||
                            focusChange == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK) {
                            // Do nothing - let the WebView handle it  
                        } else if (focusChange == AudioManager.AUDIOFOCUS_LOSS) {
                            // Permanent loss - stop
                        } else if (focusChange == AudioManager.AUDIOFOCUS_GAIN) {
                            Log.d(TAG, "Audio focus GAINED back");
                        }
                    })
                    .build();

            int result = audioManager.requestAudioFocus(audioFocusRequest);
            Log.d(TAG, "Audio focus request result: " + result);
        }
    }

    private void abandonAudioFocus() {
        if (audioManager != null && audioFocusRequest != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            audioManager.abandonAudioFocusRequest(audioFocusRequest);
        }
    }

    // ---- MediaSession ----

    private void initMediaSession() {
        mediaSession = new MediaSessionCompat(this, TAG);
        mediaSession.setFlags(
                MediaSessionCompat.FLAG_HANDLES_MEDIA_BUTTONS |
                MediaSessionCompat.FLAG_HANDLES_TRANSPORT_CONTROLS
        );

        mediaSession.setCallback(new MediaSessionCompat.Callback() {
            @Override
            public void onPlay() {
                Log.d(TAG, "MediaSession: onPlay");
                isPlaying = true;
                requestAudioFocus();
                updateMediaSession(true);
                updateNotification();
                // Notify JavaScript via broadcast
                sendBroadcast(new Intent("com.muslim.protection.hisn.MEDIA_PLAY"));
            }

            @Override
            public void onPause() {
                Log.d(TAG, "MediaSession: onPause");
                isPlaying = false;
                updateMediaSession(false);
                updateNotification();
                sendBroadcast(new Intent("com.muslim.protection.hisn.MEDIA_PAUSE"));
            }

            @Override
            public void onStop() {
                Log.d(TAG, "MediaSession: onStop");
                stopSelf();
                sendBroadcast(new Intent("com.muslim.protection.hisn.MEDIA_STOP"));
            }

            @Override
            public void onSkipToNext() {
                sendBroadcast(new Intent("com.muslim.protection.hisn.MEDIA_NEXT"));
            }

            @Override
            public void onSkipToPrevious() {
                sendBroadcast(new Intent("com.muslim.protection.hisn.MEDIA_PREV"));
            }
        });

        PlaybackStateCompat state = new PlaybackStateCompat.Builder()
                .setActions(
                        PlaybackStateCompat.ACTION_PLAY |
                        PlaybackStateCompat.ACTION_PAUSE |
                        PlaybackStateCompat.ACTION_STOP |
                        PlaybackStateCompat.ACTION_SKIP_TO_NEXT |
                        PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS
                )
                .setState(PlaybackStateCompat.STATE_PLAYING, PlaybackStateCompat.PLAYBACK_POSITION_UNKNOWN, 1.0f)
                .build();

        mediaSession.setPlaybackState(state);
        mediaSession.setActive(true);
        Log.d(TAG, "MediaSession initialized and active");
    }

    private void updateMediaSession(boolean playing) {
        if (mediaSession == null) return;

        MediaMetadataCompat metadata = new MediaMetadataCompat.Builder()
                .putString(MediaMetadataCompat.METADATA_KEY_TITLE, currentTitle)
                .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, currentArtist)
                .putString(MediaMetadataCompat.METADATA_KEY_ALBUM, "حصن المسلم")
                .build();
        mediaSession.setMetadata(metadata);

        int stateInt = playing ? PlaybackStateCompat.STATE_PLAYING : PlaybackStateCompat.STATE_PAUSED;
        PlaybackStateCompat state = new PlaybackStateCompat.Builder()
                .setActions(
                        PlaybackStateCompat.ACTION_PLAY |
                        PlaybackStateCompat.ACTION_PAUSE |
                        PlaybackStateCompat.ACTION_STOP |
                        PlaybackStateCompat.ACTION_SKIP_TO_NEXT |
                        PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS
                )
                .setState(stateInt, PlaybackStateCompat.PLAYBACK_POSITION_UNKNOWN, 1.0f)
                .build();
        mediaSession.setPlaybackState(state);
    }

    // ---- Notification ----

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "مشغل حصن المسلم",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("الرقية الشرعية والأذكار");
            channel.setShowBadge(false);
            channel.setSound(null, null);
            channel.enableLights(false);
            channel.enableVibration(false);

            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
            Log.d(TAG, "Notification channel created: " + CHANNEL_ID);
        }
    }

    private void startForegroundWithNotification() {
        Notification notification = buildNotification();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification,
                    android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }
        Log.d(TAG, "Service started in foreground");
    }

    private void updateNotification() {
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) {
            manager.notify(NOTIFICATION_ID, buildNotification());
        }
    }

    private Notification buildNotification() {
        Context ctx = this;

        // Intent to open app
        Intent openIntent = new Intent(ctx, MainActivity.class);
        openIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent openPendingIntent = PendingIntent.getActivity(
                ctx, 0, openIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        // Play/Pause action
        String actionLabel = isPlaying ? "إيقاف مؤقت" : "تشغيل";
        String actionIcon = isPlaying ? "android.R.drawable.ic_media_pause" : "android.R.drawable.ic_media_play";
        Intent toggleIntent = new Intent(ctx, AudioService.class);
        toggleIntent.setAction(isPlaying ? ACTION_PAUSE : ACTION_PLAY);
        PendingIntent togglePending = PendingIntent.getService(
                ctx, 1, toggleIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        // Stop action
        Intent stopIntent = new Intent(ctx, AudioService.class);
        stopIntent.setAction(ACTION_STOP);
        PendingIntent stopPending = PendingIntent.getService(
                ctx, 2, stopIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(ctx, CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(currentTitle)
                .setContentText(currentArtist)
                .setSubText("حصن المسلم")
                .setContentIntent(openPendingIntent)
                .setOngoing(isPlaying)
                .setOnlyAlertOnce(true)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setCategory(NotificationCompat.CATEGORY_TRANSPORT)
                .addAction(
                        android.R.drawable.ic_media_previous,
                        "السابق",
                        togglePending
                )
                .addAction(
                        isPlaying ? android.R.drawable.ic_media_pause : android.R.drawable.ic_media_play,
                        actionLabel,
                        togglePending
                )
                .addAction(
                        android.R.drawable.ic_delete,
                        "إيقاف",
                        stopPending
                );

        // Add MediaStyle to tell Android this is a real media player
        if (mediaSession != null) {
            MediaStyle mediaStyle = new MediaStyle()
                    .setMediaSession(mediaSession.getSessionToken())
                    .setShowActionsInCompactView(1) // Show play/pause in compact
                    .setShowCancelButton(true)
                    .setCancelButtonIntent(stopPending);
            builder.setStyle(mediaStyle);
        }

        return builder.build();
    }

    // ---- WakeLock ----

    private void acquireWakeLock() {
        PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (powerManager != null) {
            wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "HisnAudio:WakeLock");
            wakeLock.setReferenceCounted(false);
            wakeLock.acquire(10 * 60 * 60 * 1000L); // 10 hours max
            Log.d(TAG, "WakeLock acquired");
        }
    }

    // ---- Lifecycle ----

    @Override
    public IBinder onBind(Intent intent) {
        return binder;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "AudioService destroyed");

        if (mediaSession != null) {
            mediaSession.setActive(false);
            mediaSession.release();
            mediaSession = null;
        }

        abandonAudioFocus();

        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }

        stopForeground(true);
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        Log.d(TAG, "Task removed - keeping service alive");
        // Don't stop - keep playing even when app is removed from recents
        // Re-build notification to ensure it's still shown
        startForegroundWithNotification();
    }

    // ---- Public API (called from Capacitor Plugin) ----

    public void updateTrackInfo(String title, String artist) {
        currentTitle  = title  != null ? title  : currentTitle;
        currentArtist = artist != null ? artist : currentArtist;
        updateMediaSession(isPlaying);
        updateNotification();
    }

    public void setPlaying(boolean playing) {
        isPlaying = playing;
        if (playing) requestAudioFocus();
        updateMediaSession(playing);
        updateNotification();
    }

    public boolean isPlayingNow() {
        return isPlaying;
    }
}
