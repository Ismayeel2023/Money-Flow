package com.moneyflow.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class ExpenseReminderReceiver extends BroadcastReceiver {
    public static final String ACTION_REMINDER = "com.moneyflow.app.EXPENSE_REMINDER";
    public static final String EXTRA_KIND = "kind";
    public static final String PREFS = "moneyflow_reminders";
    public static final String KEY_ENABLED = "expense_reminders_enabled";
    public static final String KEY_HAS_EXPENSE_DATE = "has_expense_date";
    public static final String KEY_HAS_EXPENSE = "has_expense";
    public static final String KEY_PENDING_TAB = "pending_open_tab";
    public static final String CHANNEL_ID = "moneyflow_reminders";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null) {
            return;
        }

        if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) {
            LocalRemindersPlugin.rescheduleAlarms(context);
            return;
        }

        if (!ACTION_REMINDER.equals(intent.getAction())) {
            return;
        }

        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        if (!prefs.getBoolean(KEY_ENABLED, true)) {
            return;
        }

        String kind = intent.getStringExtra(EXTRA_KIND);
        if (kind == null) {
            kind = "morning";
        }

        String today = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
        if ("evening".equals(kind)) {
            boolean logged = prefs.getBoolean(KEY_HAS_EXPENSE, false)
                    && today.equals(prefs.getString(KEY_HAS_EXPENSE_DATE, ""));
            if (logged) {
                return;
            }
        }

        String title = "Money Flow";
        String body = "morning".equals(kind)
                ? "Add today’s expenses to keep your ledger current."
                : "Did you log today’s spending? Tap to add expenses.";

        prefs.edit().putString(KEY_PENDING_TAB, "add-transaction").apply();
        showNotification(context, "morning".equals(kind) ? 9101 : 9102, title, body);
    }

    public static void showNotification(Context context, int id, String title, String body) {
        ensureChannel(context);

        Intent launch = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (launch == null) {
            launch = new Intent(context, MainActivity.class);
        }
        launch.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        launch.putExtra("openTab", "add-transaction");

        PendingIntent pending = PendingIntent.getActivity(
                context,
                id,
                launch,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                .setAutoCancel(true)
                .setContentIntent(pending)
                .setPriority(NotificationCompat.PRIORITY_DEFAULT);

        try {
            NotificationManagerCompat.from(context).notify(id, builder.build());
        } catch (SecurityException ignored) {
        }
    }

    public static void ensureChannel(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return;
        }
        NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Money Flow reminders",
                NotificationManager.IMPORTANCE_DEFAULT
        );
        channel.setDescription("Daily expense logging and bill reminders");
        NotificationManager manager = context.getSystemService(NotificationManager.class);
        if (manager != null) {
            manager.createNotificationChannel(channel);
        }
    }
}
