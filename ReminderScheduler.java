package com.hocusfocus.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import org.json.JSONArray;
import org.json.JSONObject;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

public final class ReminderScheduler {
    private static final String PREFS="hocus_native_reminders";
    private static final String IDS="scheduled_ids";
    private static final String DATA="reminders_json";
    private ReminderScheduler() {}

    private static PendingIntent pending(Context context,String id,String title) {
        Intent intent = new Intent(context,ReminderReceiver.class);
        intent.setAction("com.hocusfocus.app.REMINDER."+id);
        intent.putExtra("title",title);
        return PendingIntent.getBroadcast(context,id.hashCode(),intent,
            PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
    }
    public static void sync(Context context,String json) {
        SharedPreferences prefs=context.getSharedPreferences(PREFS,Context.MODE_PRIVATE);
        AlarmManager alarms=(AlarmManager)context.getSystemService(Context.ALARM_SERVICE);
        if(alarms==null)return;
        Set<String> previous=new HashSet<>(prefs.getStringSet(IDS,new HashSet<>()));
        for(String oldId:previous) alarms.cancel(pending(context,oldId,""));
        Set<String> current=new HashSet<>();
        try {
            JSONArray items=new JSONArray(json);
            for(int i=0;i<items.length();i++) {
                JSONObject item=items.getJSONObject(i);
                String id=item.optString("id","");
                String title=item.optString("title","Reminder");
                String time=item.optString("due","");
                if(id.isEmpty() || time.isEmpty())continue;
                long when=Instant.parse(time).toEpochMilli();
                if(when<=System.currentTimeMillis())continue;
                current.add(id);
                // Inexact alarm: Android may defer delivery in Doze/battery saver mode.
                alarms.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP,when,pending(context,id,title));
            }
        } catch(Exception ignored) {}
        prefs.edit().putString(DATA,json).putStringSet(IDS,current).apply();
    }
    public static void restore(Context context){
        SharedPreferences p=context.getSharedPreferences(PREFS,Context.MODE_PRIVATE);
        sync(context,p.getString(DATA,"[]"));
    }
}
