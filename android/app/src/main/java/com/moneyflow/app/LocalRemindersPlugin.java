package com.moneyflow.app;

import android.Manifest;
import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.util.Calendar;

@CapacitorPlugin(
        name = "LocalReminders",
        permissions = {
                @Permission(strings = { Manifest.permission.POST_NOTIFICATIONS }, alias = "notifications")
        }
)
public class LocalRemindersPlugin extends Plugin {
    private static final int MORNING_REQUEST = 4101;
    private static final int EVENING_REQUEST = 4102;

    @PluginMethod
    public void requestPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            JSObject result = new JSObject();
            result.put("granted", true);
            call.resolve(result);
            return;
        }
        if (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.POST_NOTIFICATIONS)
                == PackageManager.PERMISSION_GRANTED) {
            JSObject result = new JSObject();
            result.put("granted", true);
            call.resolve(result);
            return;
        }
        requestPermissionForAlias("notifications", call, "notificationsPermsCallback");
    }

    @PermissionCallback
    private void notificationsPermsCallback(PluginCall call) {
        boolean granted = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.POST_NOTIFICATIONS)
                == PackageManager.PERMISSION_GRANTED;
        JSObject result = new JSObject();
        result.put("granted", granted);
        call.resolve(result);
    }

    @PluginMethod
    public void scheduleExpenseReminders(PluginCall call) {
        boolean enabled = Boolean.TRUE.equals(call.getBoolean("enabled", true));
        SharedPreferences prefs = getContext().getSharedPreferences(ExpenseReminderReceiver.PREFS, Context.MODE_PRIVATE);
        prefs.edit().putBoolean(ExpenseReminderReceiver.KEY_ENABLED, enabled).apply();
        if (enabled) {
            rescheduleAlarms(getContext());
        } else {
            cancelAlarms(getContext());
        }
        JSObject result = new JSObject();
        result.put("scheduled", enabled);
        call.resolve(result);
    }

    @PluginMethod
    public void setHasExpenseToday(PluginCall call) {
        boolean logged = Boolean.TRUE.equals(call.getBoolean("logged", false));
        String date = call.getString("date", "");
        SharedPreferences prefs = getContext().getSharedPreferences(ExpenseReminderReceiver.PREFS, Context.MODE_PRIVATE);
        prefs.edit()
                .putBoolean(ExpenseReminderReceiver.KEY_HAS_EXPENSE, logged)
                .putString(ExpenseReminderReceiver.KEY_HAS_EXPENSE_DATE, date == null ? "" : date)
                .apply();
        call.resolve();
    }

    @PluginMethod
    public void showNow(PluginCall call) {
        String title = call.getString("title", "Money Flow");
        String body = call.getString("body", "");
        int id = call.getInt("id", 9200);
        ExpenseReminderReceiver.showNotification(getContext(), id, title, body);
        JSObject result = new JSObject();
        result.put("shown", true);
        call.resolve(result);
    }

    @PluginMethod
    public void consumePendingOpenTab(PluginCall call) {
        SharedPreferences prefs = getContext().getSharedPreferences(ExpenseReminderReceiver.PREFS, Context.MODE_PRIVATE);
        String tab = prefs.getString(ExpenseReminderReceiver.KEY_PENDING_TAB, "");
        prefs.edit().remove(ExpenseReminderReceiver.KEY_PENDING_TAB).apply();
        JSObject result = new JSObject();
        if (tab != null && !tab.isEmpty()) {
            result.put("tab", tab);
        }
        call.resolve(result);
    }

    public static void rescheduleAlarms(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(ExpenseReminderReceiver.PREFS, Context.MODE_PRIVATE);
        if (!prefs.getBoolean(ExpenseReminderReceiver.KEY_ENABLED, true)) {
            return;
        }
        scheduleDaily(context, MORNING_REQUEST, 9, 0, "morning");
        scheduleDaily(context, EVENING_REQUEST, 20, 0, "evening");
    }

    private static void scheduleDaily(Context context, int requestCode, int hour, int minute, String kind) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) {
            return;
        }
        PendingIntent pending = buildPending(context, requestCode, kind);
        Calendar calendar = Calendar.getInstance();
        calendar.set(Calendar.HOUR_OF_DAY, hour);
        calendar.set(Calendar.MINUTE, minute);
        calendar.set(Calendar.SECOND, 0);
        calendar.set(Calendar.MILLISECOND, 0);
        if (calendar.getTimeInMillis() <= System.currentTimeMillis()) {
            calendar.add(Calendar.DAY_OF_YEAR, 1);
        }
        alarmManager.setRepeating(
                AlarmManager.RTC_WAKEUP,
                calendar.getTimeInMillis(),
                AlarmManager.INTERVAL_DAY,
                pending
        );
    }

    private static void cancelAlarms(Context context) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) {
            return;
        }
        alarmManager.cancel(buildPending(context, MORNING_REQUEST, "morning"));
        alarmManager.cancel(buildPending(context, EVENING_REQUEST, "evening"));
    }

    private static PendingIntent buildPending(Context context, int requestCode, String kind) {
        Intent intent = new Intent(context, ExpenseReminderReceiver.class);
        intent.setAction(ExpenseReminderReceiver.ACTION_REMINDER);
        intent.putExtra(ExpenseReminderReceiver.EXTRA_KIND, kind);
        return PendingIntent.getBroadcast(
                context,
                requestCode,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }
}
