package com.muslim.protection.hisn;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.util.Log;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "HisnAudio")
public class AudioPlugin extends Plugin {

    private static final String TAG = "HisnAudioPlugin";
    private BroadcastReceiver mediaReceiver;

    @Override
    public void load() {
        super.load();
        Log.d(TAG, "AudioPlugin loaded, registering broadcast receiver");
        mediaReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                String action = intent.getAction();
                if (action == null) return;

                Log.d(TAG, "Broadcast received in plugin: " + action);
                JSObject data = new JSObject();

                if ("com.muslim.protection.hisn.MEDIA_PLAY".equals(action)) {
                    notifyListeners("mediaPlay", data);
                } else if ("com.muslim.protection.hisn.MEDIA_PAUSE".equals(action)) {
                    notifyListeners("mediaPause", data);
                } else if ("com.muslim.protection.hisn.MEDIA_STOP".equals(action)) {
                    notifyListeners("mediaStop", data);
                } else if ("com.muslim.protection.hisn.MEDIA_NEXT".equals(action)) {
                    notifyListeners("mediaNext", data);
                } else if ("com.muslim.protection.hisn.MEDIA_PREV".equals(action)) {
                    notifyListeners("mediaPrev", data);
                }
            }
        };

        IntentFilter filter = new IntentFilter();
        filter.addAction("com.muslim.protection.hisn.MEDIA_PLAY");
        filter.addAction("com.muslim.protection.hisn.MEDIA_PAUSE");
        filter.addAction("com.muslim.protection.hisn.MEDIA_STOP");
        filter.addAction("com.muslim.protection.hisn.MEDIA_NEXT");
        filter.addAction("com.muslim.protection.hisn.MEDIA_PREV");

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
            getContext().registerReceiver(mediaReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            getContext().registerReceiver(mediaReceiver, filter);
        }
    }

    @Override
    protected void handleOnDestroy() {
        if (mediaReceiver != null) {
            getContext().unregisterReceiver(mediaReceiver);
            mediaReceiver = null;
        }
        super.handleOnDestroy();
    }

    @PluginMethod
    public void startService(PluginCall call) {
        String title = call.getString("title", "حصن المسلم");
        String artist = call.getString("artist", "الرقية والأذكار");

        try {
            Intent intent = new Intent(getContext(), AudioService.class);
            intent.setAction(AudioService.ACTION_START);
            intent.putExtra(AudioService.EXTRA_TITLE, title);
            intent.putExtra(AudioService.EXTRA_ARTIST, artist);
            
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                getContext().startForegroundService(intent);
            } else {
                getContext().startService(intent);
            }
            Log.d(TAG, "Foreground service start requested: " + title + " - " + artist);
            call.resolve();
        } catch (Exception e) {
            Log.e(TAG, "Failed to start service", e);
            call.reject("Failed to start service: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stopService(PluginCall call) {
        try {
            Intent intent = new Intent(getContext(), AudioService.class);
            intent.setAction(AudioService.ACTION_STOP);
            getContext().startService(intent);
            Log.d(TAG, "Foreground service stop requested");
            call.resolve();
        } catch (Exception e) {
            Log.e(TAG, "Failed to stop service", e);
            call.reject("Failed to stop service: " + e.getMessage());
        }
    }

    @PluginMethod
    public void updateTrack(PluginCall call) {
        String title = call.getString("title");
        String artist = call.getString("artist");

        try {
            Intent intent = new Intent(getContext(), AudioService.class);
            intent.setAction(AudioService.ACTION_START); // Updates info if already running
            intent.putExtra(AudioService.EXTRA_TITLE, title);
            intent.putExtra(AudioService.EXTRA_ARTIST, artist);
            getContext().startService(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to update track: " + e.getMessage());
        }
    }

    @PluginMethod
    public void updateWidget(PluginCall call) {
        String name = call.getString("name", "غير متوفر");
        String time = call.getString("time", "--:--");
        String remaining = call.getString("remaining", "");

        try {
            // Save to SharedPreferences so the widget can read it
            android.content.SharedPreferences prefs = getContext().getSharedPreferences("HisnWidgetPrefs", Context.MODE_PRIVATE);
            prefs.edit()
                .putString("next_prayer_name", name)
                .putString("next_prayer_time", time)
                .putString("next_prayer_remaining", remaining)
                .apply();

            // Trigger widget update broadcast
            Intent intent = new Intent(getContext(), ReminderWidgetProvider.class);
            intent.setAction(android.appwidget.AppWidgetManager.ACTION_APPWIDGET_UPDATE);
            
            int[] ids = android.appwidget.AppWidgetManager.getInstance(getContext())
                .getAppWidgetIds(new android.content.ComponentName(getContext(), ReminderWidgetProvider.class));
            intent.putExtra(android.appwidget.AppWidgetManager.EXTRA_APPWIDGET_IDS, ids);
            getContext().sendBroadcast(intent);

            Log.d(TAG, "Widget updated: " + name + " - " + time + " (Remaining: " + remaining + ")");
            call.resolve();
        } catch (Exception e) {
            Log.e(TAG, "Failed to update widget", e);
            call.reject("Failed to update widget: " + e.getMessage());
        }
    }
}
