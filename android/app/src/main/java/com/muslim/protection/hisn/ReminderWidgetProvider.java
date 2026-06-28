package com.muslim.protection.hisn;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

public class ReminderWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.reminder_widget);

        // Read prayer times from SharedPreferences
        SharedPreferences prefs = context.getSharedPreferences("HisnWidgetPrefs", Context.MODE_PRIVATE);
        String name = prefs.getString("next_prayer_name", null);
        String time = prefs.getString("next_prayer_time", null);
        String remaining = prefs.getString("next_prayer_remaining", null);

        if (name != null && time != null) {
            views.setTextViewText(R.id.widget_text, name + "  " + time);
            if (remaining != null && !remaining.isEmpty()) {
                views.setTextViewText(R.id.widget_subtitle, "متبقي: " + remaining);
            } else {
                views.setTextViewText(R.id.widget_subtitle, "اضغط للتحديث");
            }
        } else {
            views.setTextViewText(R.id.widget_text, "افتح التطبيق للتحديث");
            views.setTextViewText(R.id.widget_subtitle, "مواقيت الصلاة");
        }

        // Create an Intent to launch MainActivity when clicked
        Intent intent = new Intent(context, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        
        PendingIntent pendingIntent = PendingIntent.getActivity(
            context, 
            0, 
            intent, 
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_background, pendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
