package com.moneyflow.app;

import android.app.Notification;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.text.TextUtils;

public class BankNotificationListenerService extends NotificationListenerService {
    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (sbn == null || sbn.isOngoing()) {
            return;
        }

        Notification notification = sbn.getNotification();
        if (notification == null) {
            return;
        }

        Bundle extras = notification.extras;
        String title = extras != null ? extras.getString(Notification.EXTRA_TITLE, "") : "";
        CharSequence textCs = extras != null ? extras.getCharSequence(Notification.EXTRA_TEXT) : null;
        CharSequence bigCs = extras != null ? extras.getCharSequence(Notification.EXTRA_BIG_TEXT) : null;
        CharSequence inboxCs = extras != null ? extras.getCharSequence(Notification.EXTRA_SUB_TEXT) : null;

        String text = textCs != null ? textCs.toString() : "";
        if (bigCs != null && !TextUtils.isEmpty(bigCs)) {
            text = bigCs.toString();
        } else if (inboxCs != null && !TextUtils.isEmpty(inboxCs) && TextUtils.isEmpty(text)) {
            text = inboxCs.toString();
        }

        if (!looksLikeBankAlert(title, text)) {
            return;
        }

        NotificationAccessPlugin.emitPosted(sbn.getPackageName(), title, text);
    }

    private boolean looksLikeBankAlert(String title, String text) {
        String combined = ((title == null ? "" : title) + " " + (text == null ? "" : text)).toLowerCase();
        if (combined.trim().length() < 10) {
            return false;
        }

        boolean otpOnly = combined.contains("otp")
                && !combined.contains("debited")
                && !combined.contains("credited")
                && !combined.contains("spent")
                && !combined.contains("paid");
        if (otpOnly) {
            return false;
        }

        return combined.contains("rs.")
                || combined.contains("rs ")
                || combined.contains("inr")
                || combined.contains("₹")
                || combined.contains("upi")
                || combined.contains("debited")
                || combined.contains("credited")
                || combined.contains("a/c")
                || combined.contains("account xx")
                || combined.contains("sent rs")
                || combined.contains("paid rs");
    }
}
