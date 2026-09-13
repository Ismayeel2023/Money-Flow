package com.moneyflow.app;

import android.content.ComponentName;
import android.content.Intent;
import android.provider.Settings;
import android.text.TextUtils;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.ArrayList;
import java.util.List;

@CapacitorPlugin(name = "NotificationAccess")
public class NotificationAccessPlugin extends Plugin {
    private static NotificationAccessPlugin instance;
    private static final List<JSObject> pendingEvents = new ArrayList<>();

    @Override
    public void load() {
        instance = this;
        flushPending();
    }

    @Override
    protected void handleOnDestroy() {
        if (instance == this) {
            instance = null;
        }
        super.handleOnDestroy();
    }

    @PluginMethod
    public void isEnabled(PluginCall call) {
        JSObject result = new JSObject();
        result.put("enabled", isNotificationListenerEnabled());
        call.resolve(result);
    }

    @PluginMethod
    public void openSettings(PluginCall call) {
        Intent intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        call.resolve();
    }

    public static void emitPosted(String packageName, String title, String text) {
        JSObject data = new JSObject();
        data.put("packageName", packageName == null ? "" : packageName);
        data.put("title", title == null ? "" : title);
        data.put("text", text == null ? "" : text);

        if (instance != null) {
            instance.notifyListeners("notificationPosted", data, true);
        } else {
            synchronized (pendingEvents) {
                pendingEvents.add(data);
                if (pendingEvents.size() > 50) {
                    pendingEvents.remove(0);
                }
            }
        }
    }

    private void flushPending() {
        List<JSObject> queued;
        synchronized (pendingEvents) {
            queued = new ArrayList<>(pendingEvents);
            pendingEvents.clear();
        }
        for (JSObject event : queued) {
            notifyListeners("notificationPosted", event, true);
        }
    }

    private boolean isNotificationListenerEnabled() {
        String flat = Settings.Secure.getString(
                getContext().getContentResolver(),
                "enabled_notification_listeners"
        );
        if (TextUtils.isEmpty(flat)) {
            return false;
        }

        String packageName = getContext().getPackageName();
        for (String entry : flat.split(":")) {
            ComponentName componentName = ComponentName.unflattenFromString(entry);
            if (componentName != null && packageName.equals(componentName.getPackageName())) {
                return true;
            }
        }
        return false;
    }
}
