package com.hocusfocus.app;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;

public class ReminderReceiver extends BroadcastReceiver {
    private static final String CHANNEL="hocus_focus_reminders";
    public static void ensureChannel(Context c) {
        NotificationManager m=(NotificationManager)c.getSystemService(Context.NOTIFICATION_SERVICE);
        if (m==null)return;
        NotificationChannel channel=new NotificationChannel(CHANNEL,"Hocus Focus reminders",NotificationManager.IMPORTANCE_HIGH);
        channel.setDescription("Task and event reminders");
        m.createNotificationChannel(channel);
    }
    public static void show(Context c,String title,String message,int id) {
        if(Build.VERSION.SDK_INT>=33 && c.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED)return;
        ensureChannel(c);
        Intent open=new Intent(c,MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP|Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent click=PendingIntent.getActivity(c,1,open,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
        Notification n=new Notification.Builder(c,CHANNEL)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title==null?"Hocus Focus":title)
            .setContentText(message==null?"Tiny step: just start.":message)
            .setContentIntent(click)
            .setAutoCancel(true)
            .setCategory(Notification.CATEGORY_REMINDER)
            .build();
        NotificationManager m=(NotificationManager)c.getSystemService(Context.NOTIFICATION_SERVICE);
        if(m!=null)m.notify(id,n);
    }
    @Override public void onReceive(Context context,Intent intent){
        String title=intent!=null?intent.getStringExtra("title"):"Reminder";
        show(context,title,"Tiny step: just start.",intent==null?1:intent.getAction().hashCode());
    }
}
